import type { ReactNode } from 'react'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-6">
          {children}
        </main>
      </div>
      <div className="fixed inset-x-0 bottom-0 md:hidden">
        <MobileNav />
      </div>
    </div>
  )
}
