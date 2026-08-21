'use client'

import type { signInWithPassword } from '@/lib/auth/browser-auth'

type LoginFormProps = {
  signIn?: typeof signInWithPassword
}

export function LoginForm(_props: LoginFormProps) {
  return (
    <form>
      <label>
        Email
        <input aria-label="Email" type="email" />
      </label>
      <label>
        Password
        <input aria-label="Password" type="password" />
      </label>
      <button type="button">Sign in</button>
    </form>
  )
}
