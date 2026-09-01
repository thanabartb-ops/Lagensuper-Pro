'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { PhoneOTPForm } from './PhoneOTPForm'

export function LoginView() {
  const router = useRouter()
  const [messageText, setMessageText] = useState('')
  const [messageKind, setMessageKind] = useState<'error' | 'success'>('error')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSuccess = (phoneNumber: string, name: string) => {
    setMessageKind('success')
    setMessageText('ยืนยันตัวตนสำเร็จ กำลังเข้าสู่ระบบ...')
    setIsSubmitting(true)
    router.push('/chat')
  }

  const handleError = (message: string) => {
    setMessageText(message)
    setMessageKind('error')
  }

  const messageId = messageKind === 'error' ? 'auth-error' : 'auth-success'

  return (
    <main className="flex min-h-[calc(100dvh-5rem)] w-full items-center justify-center px-4 py-8">
      <section className="w-full max-w-[420px] rounded-3xl border border-[#312E81] bg-[#0C0D1A] p-5 shadow-2xl sm:p-8">
        <div className="mb-7 flex flex-col items-center text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            เข้าสู่ระบบ
          </h1>
          <p className="mt-2 text-sm text-white/50">
            เข้าสู่ระบบเพื่อใช้งาน LS_BOTAGENT
          </p>
        </div>

        <PhoneOTPForm
          disabled={isSubmitting}
          onSuccess={handleSuccess}
          onError={handleError}
        />

        {messageText && (
          <div className="mt-4">
            <p
              id={messageId}
              role={messageKind === 'error' ? 'alert' : 'status'}
              className={
                messageKind === 'error'
                  ? 'rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300'
                  : 'rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300'
              }
            >
              {messageText}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => router.push('/')}
          className="mt-4 flex min-h-[44px] w-full items-center justify-center text-sm text-white/40 transition-colors hover:text-white"
        >
          กลับหน้าหลัก
        </button>
      </section>
    </main>
  )
}
