'use client'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LockKeyhole, Mail } from 'lucide-react'
import { LSLogo } from '../common/LSLogo'
import {
  sanitizeAuthNext,
  signInWithPassword,
  signInWithOAuth,
  signUpWithPassword,
  type OAuthProvider,
} from '../../services/browserAuth'

type AuthMode = 'login' | 'signup'

export function LoginView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<AuthMode>(() =>
    searchParams.get('mode') === 'signup' ? 'signup' : 'login',
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [messageKind, setMessageKind] = useState<'error' | 'success'>('error')

  const switchMode = (nextMode: AuthMode) => {
    if (submitting) return
    setMode(nextMode)
    setMessageText('')
    setMessageKind('error')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setMessageText('')
    setMessageKind('error')

    const next = sanitizeAuthNext(searchParams.get('next'))

    if (mode === 'signup') {
      const result = await signUpWithPassword(email, password)

      if (result.status === 'authenticated') {
        router.push(next)
        return
      }

      if (result.status === 'confirmation_required') {
        setMessageKind('success')
        setMessageText('สมัครเรียบร้อย กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี')
      } else {
        setMessageText(
          result.status === 'invalid_signup'
            ? 'ไม่สามารถสมัครด้วยข้อมูลนี้ได้ กรุณาตรวจสอบอีเมลและรหัสผ่าน'
            : 'ระบบสมัครใช้งานยังไม่พร้อม กรุณาลองใหม่อีกครั้ง',
        )
      }
      setSubmitting(false)
      return
    }

    const result = await signInWithPassword(email, password)

    if (result.status === 'authenticated') {
      router.push(next)
      return
    }

    setMessageText(
      result.status === 'invalid_credentials'
        ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
        : 'ระบบเข้าสู่ระบบยังไม่พร้อม กรุณาลองใหม่อีกครั้ง',
    )
    setSubmitting(false)
  }

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    if (submitting) return
    setSubmitting(true)
    setMessageText('')
    setMessageKind('error')

    const result = await signInWithOAuth(provider)

    if (result.status === 'unavailable') {
      setMessageText('ระบบล็อกอินยังไม่พร้อม กรุณาลองใหม่อีกครั้ง')
      setSubmitting(false)
    }
  }

  const isSignup = mode === 'signup'
  const messageId = messageKind === 'error' ? 'auth-error' : 'auth-success'

  return (
    <main className="flex min-h-[calc(100dvh-5rem)] w-full items-center justify-center px-4 py-8">
      <section className="w-full max-w-[420px] rounded-3xl border border-[#312E81] bg-[#0C0D1A] p-5 shadow-2xl sm:p-8">
        <div className="mb-7 flex flex-col items-center text-center">
          <LSLogo size="lg" showGlow />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white">LSUPERAGENT</h1>
          <p className="mt-2 text-sm text-white/50">
            {isSignup ? 'สมัครบัญชีเพื่อใช้งาน LS_BOTAGENT' : 'เข้าสู่ระบบเพื่อใช้งาน LS_BOTAGENT'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          aria-describedby={messageText ? messageId : undefined}
        >
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
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-white outline-none placeholder:text-white/25"
                placeholder="รหัสผ่าน"
              />
            </div>
          </div>

          {messageText && (
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
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#FF00FF] to-[#7B2CFE] px-4 py-3 text-base font-bold text-white shadow-[0_4px_20px_rgba(123,44,254,0.35)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? isSignup
                ? 'กำลังสมัคร...'
                : 'กำลังเข้าสู่ระบบ...'
              : isSignup
                ? 'สมัครใช้งาน'
                : 'เข้าสู่ระบบ'}
          </button>

          <div className="mt-6 space-y-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#0C0D1A] px-2 text-white/40">หรือ</span>
              </div>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleOAuthSignIn('google')}
              className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#312E81] bg-[#131525] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#1A1D2E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Google
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleOAuthSignIn('microsoft')}
              className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#312E81] bg-[#131525] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#1A1D2E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Microsoft
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleOAuthSignIn('apple')}
              className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#312E81] bg-[#131525] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#1A1D2E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apple
            </button>
          </div>
        </form>

        {isSignup ? (
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="mt-4 flex min-h-[44px] w-full items-center justify-center text-sm text-white/55 transition-colors hover:text-white"
          >
            มีบัญชีแล้ว? เข้าสู่ระบบ
          </button>
        ) : (
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className="mt-4 flex min-h-[44px] w-full items-center justify-center text-sm text-white/55 transition-colors hover:text-white"
          >
            สมัครใช้งาน
          </button>
        )}

        <button
          type="button"
          onClick={() => router.push('/')}
          className="flex min-h-[44px] w-full items-center justify-center text-sm text-white/40 transition-colors hover:text-white"
        >
          กลับหน้าหลัก
        </button>
      </section>
    </main>
  )
}
