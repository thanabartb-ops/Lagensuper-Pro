'use client'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LockKeyhole, Mail } from 'lucide-react'
import { LSLogo } from '../common/LSLogo'
import { sanitizeAuthNext, signInWithPassword } from '../../services/browserAuth'

export function LoginView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorText, setErrorText] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setErrorText('')

    const result = await signInWithPassword(email, password)

    if (result.status === 'authenticated') {
      router.push(sanitizeAuthNext(searchParams.get('next')))
      return
    }

    setErrorText(
      result.status === 'invalid_credentials'
        ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
        : 'ระบบเข้าสู่ระบบยังไม่พร้อม กรุณาลองใหม่อีกครั้ง',
    )
    setSubmitting(false)
  }

  return (
    <main className="flex min-h-[calc(100dvh-5rem)] w-full items-center justify-center px-4 py-8">
      <section className="w-full max-w-[420px] rounded-3xl border border-[#312E81] bg-[#0C0D1A] p-5 shadow-2xl sm:p-8">
        <div className="mb-7 flex flex-col items-center text-center">
          <LSLogo size="lg" showGlow />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white">LSUPERAGENT</h1>
          <p className="mt-2 text-sm text-white/50">เข้าสู่ระบบเพื่อใช้งาน LS_BOTAGENT</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" aria-describedby={errorText ? 'login-error' : undefined}>
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-white/80">
              อีเมล
            </label>
            <div className="flex min-h-[48px] items-center rounded-2xl border border-[#312E81] bg-[#131525] px-3 focus-within:border-[#7B2CFE] focus-within:ring-2 focus-within:ring-[#7B2CFE]/20">
              <Mail className="h-4 w-4 shrink-0 text-white/35" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-white outline-none placeholder:text-white/25"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-white/80">
              รหัสผ่าน
            </label>
            <div className="flex min-h-[48px] items-center rounded-2xl border border-[#312E81] bg-[#131525] px-3 focus-within:border-[#7B2CFE] focus-within:ring-2 focus-within:ring-[#7B2CFE]/20">
              <LockKeyhole className="h-4 w-4 shrink-0 text-white/35" aria-hidden="true" />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-white outline-none placeholder:text-white/25"
                placeholder="รหัสผ่าน"
              />
            </div>
          </div>

          {errorText && (
            <p id="login-error" role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {errorText}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#FF00FF] to-[#7B2CFE] px-4 py-3 text-base font-bold text-white shadow-[0_4px_20px_rgba(123,44,254,0.35)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => router.push('/')}
          className="mt-4 flex min-h-[44px] w-full items-center justify-center text-sm text-white/50 transition-colors hover:text-white"
        >
          กลับหน้าหลัก
        </button>
      </section>
    </main>
  )
}
