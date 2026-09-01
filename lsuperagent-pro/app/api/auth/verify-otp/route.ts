import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

interface VerifyRequest {
  phoneNumber: string
  otp: string
  name: string
  termsAccepted: boolean
}

interface OTPStore {
  code: string
  expiresAt: number
  attempts: number
}

interface SessionData {
  phoneNumber: string
  name: string
  authenticatedAt: number
}

const otpStore = new Map<string, OTPStore>()
const sessionStore = new Map<string, SessionData>()
const MAX_ATTEMPTS = 3
const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function generateSessionToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function isValidPhoneNumber(phone: string): boolean {
  const normalized = phone.replace(/\D/g, '')
  return normalized.length >= 10 && normalized.length <= 15
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequest = await request.json()
    const { phoneNumber, otp, name, termsAccepted } = body

    if (!phoneNumber || !otp || !name) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 },
      )
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { error: 'กรุณายอมรับเงื่อนไขการใช้งาน' },
        { status: 400 },
      )
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: 'เบอร์โทรศัพท์ไม่ถูกต้อง' },
        { status: 400 },
      )
    }

    const normalized = phoneNumber.replace(/\D/g, '')
    const storedOTP = otpStore.get(normalized)

    if (!storedOTP) {
      return NextResponse.json(
        { error: 'ไม่พบรหัส OTP กรุณาขอรหัสใหม่' },
        { status: 400 },
      )
    }

    if (storedOTP.expiresAt < Date.now()) {
      otpStore.delete(normalized)
      return NextResponse.json(
        { error: 'รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่' },
        { status: 400 },
      )
    }

    if (storedOTP.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(normalized)
      return NextResponse.json(
        { error: 'พยายามใส่รหัสผิดเกินจำนวนครั้ง กรุณาขอรหัสใหม่' },
        { status: 429 },
      )
    }

    if (storedOTP.code !== otp) {
      storedOTP.attempts++
      return NextResponse.json(
        { error: 'รหัส OTP ไม่ถูกต้อง' },
        { status: 400 },
      )
    }

    otpStore.delete(normalized)

    const sessionToken = generateSessionToken()
    const sessionData: SessionData = {
      phoneNumber: normalized,
      name: name.trim(),
      authenticatedAt: Date.now(),
    }

    sessionStore.set(sessionToken, sessionData)

    const cookieStore = await cookies()
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY_MS / 1000,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'ยืนยันตัวตนสำเร็จ',
        sessionToken,
        user: {
          phoneNumber: normalized,
          name: sessionData.name,
        },
      },
      { status: 200 },
    )
  } catch {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 },
    )
  }
}

export function getSessionData(sessionToken: string): SessionData | null {
  const data = sessionStore.get(sessionToken)
  if (!data) return null

  const age = Date.now() - data.authenticatedAt
  if (age > 30 * 24 * 60 * 60 * 1000) {
    sessionStore.delete(sessionToken)
    return null
  }

  return data
}
