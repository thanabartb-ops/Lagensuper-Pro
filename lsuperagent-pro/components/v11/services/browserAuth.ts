export type BrowserSession =
  | { status: 'authenticated'; phoneNumber: string; name: string }
  | { status: 'unauthenticated' }
  | { status: 'unavailable' }

export type OTPRequestResult =
  | { status: 'sent'; message: string; demoOtp?: string }
  | { status: 'invalid_phone' }
  | { status: 'unavailable' }

export type OTPVerifyResult =
  | { status: 'authenticated'; phoneNumber: string; name: string }
  | { status: 'invalid_otp' }
  | { status: 'expired' }
  | { status: 'invalid_input' }
  | { status: 'unavailable' }

export async function getCurrentSession(): Promise<BrowserSession> {
  try {
    const response = await fetch('/api/auth/verify-session', {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      return { status: 'unauthenticated' }
    }

    const data = await response.json()
    if (data.authenticated && data.user) {
      return {
        status: 'authenticated',
        phoneNumber: data.user.phoneNumber,
        name: data.user.name,
      }
    }

    return { status: 'unauthenticated' }
  } catch {
    return { status: 'unavailable' }
  }
}

export async function requestOTP(phoneNumber: string): Promise<OTPRequestResult> {
  const normalizedPhone = phoneNumber.trim()
  if (!normalizedPhone) return { status: 'invalid_phone' }

  try {
    const response = await fetch('/api/auth/request-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phoneNumber: normalizedPhone }),
      credentials: 'include',
    })

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 400) {
        return { status: 'invalid_phone' }
      }
      return { status: 'unavailable' }
    }

    return {
      status: 'sent',
      message: data.message,
      demoOtp: data._demo_otp,
    }
  } catch {
    return { status: 'unavailable' }
  }
}

export async function verifyOTP(
  phoneNumber: string,
  otp: string,
  name: string,
  termsAccepted: boolean,
): Promise<OTPVerifyResult> {
  const normalizedPhone = phoneNumber.trim()
  const normalizedOtp = otp.trim()
  const normalizedName = name.trim()

  if (!normalizedPhone || !normalizedOtp || !normalizedName) {
    return { status: 'invalid_input' }
  }

  if (!termsAccepted) {
    return { status: 'invalid_input' }
  }

  try {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: normalizedPhone,
        otp: normalizedOtp,
        name: normalizedName,
        termsAccepted,
      }),
      credentials: 'include',
    })

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 400) {
        if (data.error?.includes('หมดอายุ')) {
          return { status: 'expired' }
        }
        return { status: 'invalid_otp' }
      }
      return { status: 'unavailable' }
    }

    if (data.success && data.user) {
      return {
        status: 'authenticated',
        phoneNumber: data.user.phoneNumber,
        name: data.user.name,
      }
    }

    return { status: 'unavailable' }
  } catch {
    return { status: 'unavailable' }
  }
}

export async function clearBrowserSession(): Promise<void> {
  try {
    await fetch('/api/auth/verify-session', {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    // Fail closed
  }
}

export function subscribeToAuthChanges(
  listener: (authenticated: boolean) => void,
): () => void {
  let isSubscribed = true
  let checkInterval: NodeJS.Timeout | null = null

  const checkAuth = async () => {
    if (!isSubscribed) return

    const session = await getCurrentSession()
    listener(session.status === 'authenticated')

    if (isSubscribed) {
      checkInterval = setTimeout(checkAuth, 60000)
    }
  }

  checkAuth()

  return () => {
    isSubscribed = false
    if (checkInterval) clearTimeout(checkInterval)
  }
}
