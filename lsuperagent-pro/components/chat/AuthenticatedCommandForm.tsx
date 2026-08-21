'use client'

import type { sendAuthenticatedChat } from '@/lib/auth/browser-auth'

type AuthenticatedCommandFormProps = {
  sendChat?: typeof sendAuthenticatedChat
}

export function AuthenticatedCommandForm(_props: AuthenticatedCommandFormProps) {
  return (
    <form>
      <label>
        Message
        <textarea aria-label="Message" />
      </label>
      <button type="button">Send</button>
    </form>
  )
}
