// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { useEffect } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginView } from '../components/v11/components/auth/LoginView'
import { RequireAuth } from '../components/v11/components/auth/RequireAuth'
import { V11Landing } from '../components/v11/V11Landing'

const {
  pushMock,
  routerMock,
  signInMock,
  getSessionMock,
  subscribeMock,
  protectedMountMock,
} = vi.hoisted(() => {
  const pushMock = vi.fn()
  return {
    pushMock,
    routerMock: { push: pushMock, replace: pushMock },
    signInMock: vi.fn(),
    getSessionMock: vi.fn(),
    subscribeMock: vi.fn(),
    protectedMountMock: vi.fn(),
  }
})

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
  useSearchParams: () => new URLSearchParams('next=/chat'),
}))

vi.mock('../components/v11/services/browserAuth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../components/v11/services/browserAuth')>()
  return {
    ...actual,
    signInWithPassword: signInMock,
    getCurrentSession: getSessionMock,
    subscribeToAuthChanges: subscribeMock,
  }
})

beforeEach(() => {
  subscribeMock.mockReturnValue(() => undefined)
})

afterEach(() => {
  cleanup()
  pushMock.mockReset()
  signInMock.mockReset()
  getSessionMock.mockReset()
  subscribeMock.mockReset()
  protectedMountMock.mockReset()
})

function fillLoginForm() {
  fireEvent.change(screen.getByLabelText('อีเมล'), {
    target: { value: 'me@example.com' },
  })
  fireEvent.change(screen.getByLabelText('รหัสผ่าน'), {
    target: { value: 'secret' },
  })
}

function ProtectedProbe() {
  useEffect(() => {
    protectedMountMock()
  }, [])
  return <div>protected-chat</div>
}

describe('V11 email/password login', () => {
  it('logs in with email/password and returns to /chat', async () => {
    signInMock.mockResolvedValue({ status: 'authenticated' })
    render(<LoginView />)
    fillLoginForm()
    fireEvent.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/chat'))
    expect(signInMock).toHaveBeenCalledWith('me@example.com', 'secret')
  })

  it('shows a safe Thai message for invalid credentials', async () => {
    signInMock.mockResolvedValue({ status: 'invalid_credentials' })
    render(<LoginView />)
    fillLoginForm()
    fireEvent.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }))

    expect(await screen.findByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeInTheDocument()
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('shows service unavailable without raw provider text', async () => {
    signInMock.mockResolvedValue({ status: 'unavailable' })
    render(<LoginView />)
    fillLoginForm()
    fireEvent.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }))

    expect(
      await screen.findByText('ระบบเข้าสู่ระบบยังไม่พร้อม กรุณาลองใหม่อีกครั้ง'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/supabase/i)).not.toBeInTheDocument()
  })

  it('blocks duplicate submit while sign-in is pending', async () => {
    let resolve!: (value: { status: 'authenticated' }) => void
    signInMock.mockReturnValue(
      new Promise<{ status: 'authenticated' }>((done) => {
        resolve = done
      }),
    )

    render(<LoginView />)
    fillLoginForm()
    const button = screen.getByRole('button', { name: 'เข้าสู่ระบบ' })
    fireEvent.click(button)

    await waitFor(() => expect(button).toBeDisabled())
    fireEvent.click(button)
    expect(signInMock).toHaveBeenCalledTimes(1)

    resolve({ status: 'authenticated' })
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/chat'))
  })
})

describe('V11 landing auth entry', () => {
  it('offers a real login action that returns to Chat after authentication', () => {
    render(<V11Landing />)

    const loginButton = screen.getByRole('button', { name: 'เข้าสู่ระบบ' })
    expect(loginButton).toBeEnabled()
    fireEvent.click(loginButton)

    expect(pushMock).toHaveBeenCalledWith('/login?next=/chat')
  })
})

describe('V11 chat auth gate', () => {
  it('redirects unauthenticated users before protected Chat mounts', async () => {
    getSessionMock.mockResolvedValue({ status: 'unauthenticated' })

    render(
      <RequireAuth>
        <ProtectedProbe />
      </RequireAuth>,
    )

    expect(screen.queryByText('protected-chat')).not.toBeInTheDocument()
    expect(protectedMountMock).not.toHaveBeenCalled()
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/login?next=/chat'))
    expect(protectedMountMock).not.toHaveBeenCalled()
  })

  it('renders protected Chat only after a valid session is confirmed', async () => {
    getSessionMock.mockResolvedValue({ status: 'authenticated', accessToken: 'token' })

    render(
      <RequireAuth>
        <ProtectedProbe />
      </RequireAuth>,
    )

    expect(await screen.findByText('protected-chat')).toBeInTheDocument()
    expect(protectedMountMock).toHaveBeenCalledTimes(1)
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('fails closed when an authenticated session disappears', async () => {
    let authListener: ((authenticated: boolean) => void) | undefined
    getSessionMock.mockResolvedValue({ status: 'authenticated', accessToken: 'token' })
    subscribeMock.mockImplementation((listener: (authenticated: boolean) => void) => {
      authListener = listener
      return () => undefined
    })

    render(
      <RequireAuth>
        <ProtectedProbe />
      </RequireAuth>,
    )
    expect(await screen.findByText('protected-chat')).toBeInTheDocument()

    act(() => authListener?.(false))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/login?next=/chat'))
    expect(screen.queryByText('protected-chat')).not.toBeInTheDocument()
  })
})
