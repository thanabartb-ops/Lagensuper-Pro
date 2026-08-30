// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LoginView } from '../components/v11/components/auth/LoginView'

const { pushMock, signInMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  signInMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: pushMock }),
  useSearchParams: () => new URLSearchParams('next=/chat'),
}))

vi.mock('../components/v11/services/browserAuth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../components/v11/services/browserAuth')>()
  return { ...actual, signInWithPassword: signInMock }
})

afterEach(() => {
  cleanup()
  pushMock.mockReset()
  signInMock.mockReset()
})

function fillLoginForm() {
  fireEvent.change(screen.getByLabelText('อีเมล'), {
    target: { value: 'me@example.com' },
  })
  fireEvent.change(screen.getByLabelText('รหัสผ่าน'), {
    target: { value: 'secret' },
  })
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
