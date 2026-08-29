'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { BottomNav } from './components/common/BottomNav'
import { Header } from './components/common/Header'
import { pathToRoute, routeToPath } from './route-map'
import type { AppRoute } from './types'

const SETTINGS_STORAGE_KEY = 'lsuperagent.v11.settings'

export function V11Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const currentRoute = pathToRoute(pathname)
  const isChatRoute = currentRoute === 'smart_chat'

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
      const parsed = stored ? (JSON.parse(stored) as { reducedMotion?: unknown }) : null
      document.documentElement.classList.toggle('reduce-motion', parsed?.reducedMotion === true)
    } catch {
      document.documentElement.classList.remove('reduce-motion')
    }
  }, [])

  const navigate = (route: AppRoute) => {
    router.push(routeToPath[route])
  }

  return (
    <div
      className={`flex flex-col bg-[#0A0B14] font-sans text-white selection:bg-[#7B2CFE]/40 selection:text-white ${
        isChatRoute ? 'h-dvh overflow-hidden' : 'min-h-screen'
      }`}
    >
      <Header currentRoute={currentRoute} onRouteChange={navigate} />
      <main className={`w-full flex-1 ${isChatRoute ? 'min-h-0 overflow-hidden' : ''}`}>
        {children}
      </main>
      {!isChatRoute && (
        <footer className="mb-14 border-t border-[#312E81]/30 bg-[#0C0D1A] py-8 text-center text-xs text-white/40 md:mb-0">
          <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-3 px-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white/80">LSUPERAGENT</span>
              <span>· V11 Public Beta Preview</span>
            </div>
            <div>
              <span>Canonical Marketing: </span>
              <a
                href="https://www.wokers-wise.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7B2CFE] hover:underline"
              >
                https://www.wokers-wise.com/
              </a>
            </div>
            <div>
              <span className="font-mono text-red-400">Gateway: NOT_CONNECTED (Mock Mode)</span>
            </div>
          </div>
        </footer>
      )}
      <BottomNav currentRoute={currentRoute} onRouteChange={navigate} />
    </div>
  )
}
