'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentSession, subscribeToAuthChanges } from '../../services/browserAuth'

const LOGIN_PATH = '/login?next=/chat'

type GateState = 'checking' | 'authenticated' | 'redirecting'

export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [state, setState] = useState<GateState>('checking')

  useEffect(() => {
    let active = true

    const redirectToLogin = () => {
      if (!active) return
      setState('redirecting')
      router.replace(LOGIN_PATH)
    }

    const dispose = subscribeToAuthChanges((authenticated) => {
      if (!active) return
      if (authenticated) {
        setState('authenticated')
      } else {
        redirectToLogin()
      }
    })

    void getCurrentSession().then((session) => {
      if (!active) return
      if (session.status === 'authenticated') {
        setState('authenticated')
      } else {
        redirectToLogin()
      }
    })

    return () => {
      active = false
      dispose()
    }
  }, [router])

  if (state !== 'authenticated') {
    return (
      <div className="flex min-h-[50dvh] w-full items-center justify-center px-4" aria-live="polite">
        <p className="text-sm text-white/50">
          {state === 'checking' ? 'กำลังตรวจสอบการเข้าสู่ระบบ...' : 'กำลังไปหน้าลงชื่อเข้าใช้...'}
        </p>
      </div>
    )
  }

  return <>{children}</>
}
