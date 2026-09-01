import { NextRequest, NextResponse } from 'next/server'

interface OTPRequest {
  phoneNumber: string
}

interface OTPStore {
  code: string
  expiresAt: number
  attempts: number
}

const otpStore = new Map<string, OTPStore>()
const MAX_ATTEMPTS = 3
const OTP_EXPIRY_MS = 10 * 60 * 1000
const OTP_LENGTH = 6

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function isValidPhoneNumber(phone: string): boolean {
  const normalized = phone.replace(/\D/g, '')
  return normalized.length >= 10 && normalized.length <= 15
}

async function sendSMS(phoneNumber: string, code: string): Promise<boolean> {
  // Mock SMS service - in production replace with Twilio, AWS SNS, etc.
  console.log(`[OTP Service] Sending OTP ${code} to ${phoneNumber}`)

  // For development/testing, store OTP in response for demo purposes
  // In production, this would be sent via actual SMS service
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body: OTPRequest = await request.json()
    const { phoneNumber } = body

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'กรุณากรอกเบอร์โทรศัพท์' },
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

    const existing = otpStore.get(normalized)
    if (existing && existing.expiresAt > Date.now()) {
      return NextResponse.json(
        {
          success: true,
          message: 'รหัส OTP ได้ถูกส่งไปแล้ว กรุณาตรวจสอบข้อความ SMS',
          // For demo: expose the OTP (remove in production)
          _demo_otp: existing.code,
        },
        { status: 200 },
      )
    }

    const code = generateOTP()
    const sent = await sendSMS(normalized, code)

    if (!sent) {
      return NextResponse.json(
        { error: 'ไม่สามารถส่ง OTP ได้ กรุณาลองใหม่อีกครั้ง' },
        { status: 500 },
      )
    }

    otpStore.set(normalized, {
      code,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts: 0,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'รหัส OTP ได้ถูกส่งไปแล้ว กรุณาตรวจสอบข้อความ SMS',
        // For demo: expose the OTP (remove in production)
        _demo_otp: code,
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
