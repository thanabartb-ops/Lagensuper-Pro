import { Suspense } from 'react'
import { LoginView } from '@/components/v11/components/auth/LoginView'

function LoginFallback() {
  return (
    <main className="flex min-h-[calc(100dvh-5rem)] w-full items-center justify-center px-4 py-8">
      <p className="text-sm text-white/50">กำลังเตรียมหน้าลงชื่อเข้าใช้...</p>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginView />
    </Suspense>
  )
}
