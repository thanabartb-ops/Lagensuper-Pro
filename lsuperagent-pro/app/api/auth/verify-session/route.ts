import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

interface SessionData {
  phoneNumber: string
  name: string
  authenticatedAt: number
}

const sessionStore = new Map<string, SessionData>()

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 },
      )
    }

    const sessionData = sessionStore.get(sessionToken)
    if (!sessionData) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 },
      )
    }

    const age = Date.now() - sessionData.authenticatedAt
    if (age > 30 * 24 * 60 * 60 * 1000) {
      sessionStore.delete(sessionToken)
      cookieStore.delete('session_token')
      return NextResponse.json(
        { authenticated: false },
        { status: 401 },
      )
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          phoneNumber: sessionData.phoneNumber,
          name: sessionData.name,
        },
      },
      { status: 200 },
    )
  } catch {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('session_token')
    return NextResponse.json(
      { success: true, message: 'ออกจากระบบสำเร็จ' },
      { status: 200 },
    )
  } catch {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
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
