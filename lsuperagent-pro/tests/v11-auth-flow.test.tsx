// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { useEffect } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RequireAuth } from '../components/v11/components/auth/RequireAuth'
import { V11Landing } from '../components/v11/V11Landing'

const {
  pushMock,
  routerMock,
  getSessionMock,
  subscribeMock,
  protectedMountMock,
  searchParamsMock,
} = vi.hoisted(() => {
  const pushMock = vi.fn()
  return {
    pushMock,
    routerMock: { push: pushMock, replace: pushMock },
    getSessionMock: vi.fn(),
    subscribeMock: vi.fn(),
    protectedMountMock: vi.fn(),
    searchParamsMock: vi.fn(),
  }
})

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
  useSearchParams: () => searchParamsMock(),
}))

vi.mock('../components/v11/services/browserAuth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../components/v11/services/browserAuth')>()
  return {
    ...actual,
    getCurrentSession: getSessionMock,
    subscribeToAuthChanges: subscribeMock,
  }
})

beforeEach(() => {
  searchParamsMock.mockReturnValue(new URLSearchParams('next=/chat'))
  subscribeMock.mockReturnValue(() => undefined)
})

afterEach(() => {
  cleanup()
  pushMock.mockReset()
  getSessionMock.mockReset()
  subscribeMock.mockReset()
  protectedMountMock.mockReset()
  searchParamsMock.mockReset()
})

function ProtectedProbe() {
  useEffect(() => {
    protectedMountMock()
  }, [])
  return <div>protected-chat</div>
}

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
    getSessionMock.mockResolvedValue({ status: 'authenticated', phoneNumber: '0812345678', name: 'Test User' })

    render(
      <RequireAuth>
        <ProtectedProbe />
      </RequireAuth>,
    )
    expect(await screen.findByText('protected-chat')).toBeInTheDocument()
    expect(protectedMountMock).toHaveBeenCalledTimes(1)
    expect(pushMock).not.toHaveBeenCalled()
  })
})
