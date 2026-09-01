// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearBrowserSession,
  getCurrentSession,
  requestOTP,
  verifyOTP,
  subscribeToAuthChanges,
  type OTPRequestResult,
  type OTPVerifyResult,
} from '../components/v11/services/browserAuth'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('browser auth service - phone/OTP', () => {
  it('returns an authenticated session with phone and name', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        authenticated: true,
        user: { phoneNumber: '0812345678', name: 'Test User' },
      }),
    })

    const result = await getCurrentSession()
    expect(result).toEqual({
      status: 'authenticated',
      phoneNumber: '0812345678',
      name: 'Test User',
    })
  })

  it('returns unauthenticated when there is no session', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    })

    const result = await getCurrentSession()
    expect(result).toEqual({ status: 'unauthenticated' })
  })

  it('returns unavailable when auth cannot be reached', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down'))

    const result = await getCurrentSession()
    expect(result).toEqual({ status: 'unavailable' })
  })

  it('requests OTP for a valid phone number', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: 'OTP sent',
        _demo_otp: '123456',
      }),
    })

    const result = await requestOTP('0812345678')
    expect(result.status).toBe('sent')
    if (result.status === 'sent') {
      expect(result.demoOtp).toBe('123456')
    }
  })

  it('returns invalid_phone for empty phone number', async () => {
    const result = await requestOTP('')
    expect(result).toEqual({ status: 'invalid_phone' })
  })

  it('verifies OTP and creates authenticated session', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        user: { phoneNumber: '0812345678', name: 'Test User' },
      }),
    })

    const result = await verifyOTP('0812345678', '123456', 'Test User', true)
    expect(result).toEqual({
      status: 'authenticated',
      phoneNumber: '0812345678',
      name: 'Test User',
    })
  })

  it('returns invalid_otp for wrong code', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'OTP incorrect' }),
    })

    const result = await verifyOTP('0812345678', '000000', 'Test User', true)
    expect(result).toEqual({ status: 'invalid_otp' })
  })

  it('returns expired when OTP has expired', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'OTP has expired' }),
    })

    const result = await verifyOTP('0812345678', '123456', 'Test User', true)
    expect(result).toEqual({ status: 'expired' })
  })

  it('returns invalid_input when terms not accepted', async () => {
    const result = await verifyOTP('0812345678', '123456', 'Test User', false)
    expect(result).toEqual({ status: 'invalid_input' })
  })

  it('clears browser session on logout', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    await expect(clearBrowserSession()).resolves.toBeUndefined()
  })

  it('subscribes to auth changes and disposes subscription', () => {
    let isSubscribed = true
    const listener = vi.fn()

    const dispose = subscribeToAuthChanges(listener)
    expect(listener).toHaveBeenCalled()

    dispose()
    isSubscribed = false
  })
})
