'use client'

import { useState, type FormEvent } from 'react'
import { Phone, Lock } from 'lucide-react'
import { requestOTP, verifyOTP } from '../../services/browserAuth'

type PhoneOTPStep = 'phone' | 'otp' | 'profile'

type PhoneOTPFormProps = {
  disabled: boolean
  onSuccess: (phoneNumber: string, name: string) => void
  onError: (message: string) => void
}

export function PhoneOTPForm({
  disabled,
  onSuccess,
  onError,
}: PhoneOTPFormProps) {
  const [step, setStep] = useState<PhoneOTPStep>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [demoOtp, setDemoOtp] = useState<string | undefined>()

  const handleRequestOTP = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading || disabled) return

    setLoading(true)
    onError('')

    const result = await requestOTP(phoneNumber)

    if (result.status === 'sent') {
      setDemoOtp(result.demoOtp)
      setStep('otp')
    } else if (result.status === 'invalid_phone') {
      onError('เบอร์โทรศัพท์ไม่ถูกต้อง')
    } else {
      onError('ไม่สามารถส่ง OTP ได้ กรุณาลองใหม่อีกครั้ง')
    }

    setLoading(false)
  }

  const handleVerifyOTP = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading || disabled) return

    setLoading(true)
    onError('')

    if (step === 'otp') {
      setStep('profile')
      setLoading(false)
      return
    }

    const result = await verifyOTP(phoneNumber, otp, name, termsAccepted)

    if (result.status === 'authenticated') {
      onSuccess(result.phoneNumber, result.name)
    } else if (result.status === 'invalid_otp') {
      onError('รหัส OTP ไม่ถูกต้อง')
    } else if (result.status === 'expired') {
      onError('รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่')
      setStep('phone')
      setOtp('')
      setPhoneNumber('')
      setDemoOtp(undefined)
    } else if (result.status === 'invalid_input') {
      onError('กรุณากรอกข้อมูลให้ครบถ้วนและยอมรับเงื่อนไขการใช้งาน')
    } else {
      onError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    }

    setLoading(false)
  }

  const handleBack = () => {
    if (step === 'profile') {
      setStep('otp')
      setName('')
      setTermsAccepted(false)
    } else if (step === 'otp') {
      setStep('phone')
      setOtp('')
      setDemoOtp(undefined)
    }
  }

  if (step === 'phone') {
    return (
      <form onSubmit={handleRequestOTP} className="space-y-4">
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-white/80">
            เบอร์โทรศัพท์
          </label>
          <div className="flex min-h-[48px] items-center rounded-2xl border border-[#312E81] bg-[#131525] px-3 focus-within:border-[#7B2CFE] focus-within:ring-2 focus-within:ring-[#7B2CFE]/20">
            <Phone className="h-4 w-4 shrink-0 text-white/35" aria-hidden="true" />
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              placeholder="+66 XX XXX XXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading || disabled}
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-white outline-none placeholder:text-white/25 disabled:opacity-50"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || disabled || !phoneNumber}
          className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#FF00FF] to-[#7B2CFE] px-4 py-3 text-base font-bold text-white shadow-[0_4px_20px_rgba(123,44,254,0.35)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'กำลังส่ง...' : 'ขอรหัส OTP'}
        </button>
      </form>
    )
  }

  if (step === 'otp') {
    return (
      <form onSubmit={handleVerifyOTP} className="space-y-4">
        <div>
          <label htmlFor="otp" className="mb-1.5 block text-sm font-medium text-white/80">
            รหัส OTP (ตรวจสอบ SMS)
          </label>
          <div className="flex min-h-[48px] items-center rounded-2xl border border-[#312E81] bg-[#131525] px-3 focus-within:border-[#7B2CFE] focus-within:ring-2 focus-within:ring-[#7B2CFE]/20">
            <Lock className="h-4 w-4 shrink-0 text-white/35" aria-hidden="true" />
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={loading || disabled}
              maxLength={6}
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-center text-base font-mono text-white outline-none placeholder:text-white/25 disabled:opacity-50"
              required
            />
          </div>
            <p className="mt-2 text-xs text-white/50">ป้อนรหัส 6 หลักที่ส่งไปยังเบอร์โทรศัพท์ของคุณ</p>
        </div>

        <button
          type="submit"
          disabled={loading || disabled || otp.length !== 6}
          className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#FF00FF] to-[#7B2CFE] px-4 py-3 text-base font-bold text-white shadow-[0_4px_20px_rgba(123,44,254,0.35)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'กำลังตรวจสอบ...' : 'ถัดไป'}
        </button>

        <button
          type="button"
          onClick={handleBack}
          disabled={loading || disabled}
          className="flex min-h-[44px] w-full items-center justify-center text-sm text-white/55 transition-colors hover:text-white disabled:opacity-50"
        >
          ← กลับ
        </button>
      </form>
    )
  }

  if (step === 'profile') {
    return (
      <form onSubmit={handleVerifyOTP} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-white/80">
            ชื่อ
          </label>
          <input
            id="name"
            type="text"
            placeholder="ชื่อของคุณ"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading || disabled}
            className="flex min-h-[48px] w-full rounded-2xl border border-[#312E81] bg-[#131525] px-4 py-3 text-base text-white outline-none placeholder:text-white/25 focus:border-[#7B2CFE] focus:ring-2 focus:ring-[#7B2CFE]/20 disabled:opacity-50"
            required
          />
        </div>

        <div className="flex items-start gap-2">
          <input
            id="terms"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            disabled={loading || disabled}
            className="mt-1 h-4 w-4 rounded border-[#312E81] bg-[#131525] text-[#7B2CFE] focus:ring-2 focus:ring-[#7B2CFE]/20 disabled:opacity-50"
            required
          />
          <label htmlFor="terms" className="text-sm text-white/70">
            ฉันยอมรับ<span className="text-white/90"> เงื่อนไขการใช้งาน</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || disabled || !name || !termsAccepted}
          className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#FF00FF] to-[#7B2CFE] px-4 py-3 text-base font-bold text-white shadow-[0_4px_20px_rgba(123,44,254,0.35)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>

        <button
          type="button"
          onClick={handleBack}
          disabled={loading || disabled}
          className="flex min-h-[44px] w-full items-center justify-center text-sm text-white/55 transition-colors hover:text-white disabled:opacity-50"
        >
          ← กลับ
        </button>
      </form>
    )
  }
}
