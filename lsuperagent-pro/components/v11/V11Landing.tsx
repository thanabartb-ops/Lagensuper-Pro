'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClosingCtaSection } from './components/landing/ClosingCtaSection'
import { DashboardSection } from './components/landing/DashboardSection'
import { HeroSection } from './components/landing/HeroSection'
import { ServicesSection } from './components/landing/ServicesSection'
import { ToolDetailSection } from './components/landing/ToolDetailSection'
import { routeToPath } from './route-map'
import type { AppRoute } from './types'

export function V11Landing() {
  const router = useRouter()
  const [selectedToolId, setSelectedToolId] = useState('ai_writer')

  const navigate = (route: AppRoute) => router.push(routeToPath[route])

  const handleStart = () => {
    document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSelectTool = (toolId: string) => {
    setSelectedToolId(toolId)
    requestAnimationFrame(() => {
      document.getElementById('tool-detail')?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  return (
    <div className="w-full space-y-4">
      <HeroSection onStartClick={handleStart} onRouteChange={navigate} />
      <DashboardSection onRouteChange={navigate} onSearchSubmit={() => navigate('smart_chat')} />
      <ServicesSection
        selectedToolId={selectedToolId}
        onSelectTool={handleSelectTool}
      />
      <ToolDetailSection selectedToolId={selectedToolId} onRouteChange={navigate} />
      <ClosingCtaSection onStartClick={handleStart} />
    </div>
  )
}
