'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClosingCtaSection } from './components/landing/ClosingCtaSection'
import { DashboardSection } from './components/landing/DashboardSection'
import { HeroSection } from './components/landing/HeroSection'
import { ServicesSection } from './components/landing/ServicesSection'
import { ToolDetailSection } from './components/landing/ToolDetailSection'
import { routeToPath } from './route-map'
import { setPendingPrompt } from './services/promptHandoff'
import type { AppRoute } from './types'

export function V11Landing() {
  const router = useRouter()
  const [selectedToolId, setSelectedToolId] = useState('ai_writer')

  const navigate = (route: AppRoute) => router.push(routeToPath[route])

  const handleStart = () => {
    document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' })
  }

  // Carry the typed prompt across the route change instead of dropping it.
  const handleSearchSubmit = (query: string) => {
    setPendingPrompt(query)
    navigate('smart_chat')
  }

  const handleSelectTool = (toolId: string) => {
    setSelectedToolId(toolId)
    requestAnimationFrame(() => {
      document.getElementById('tool-detail')?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  return (
    <div className="w-full space-y-4">
      <HeroSection onStartClick={handleStart} />
      <DashboardSection onRouteChange={navigate} onSearchSubmit={handleSearchSubmit} />
      <ServicesSection
        selectedToolId={selectedToolId}
        onSelectTool={handleSelectTool}
      />
      <ToolDetailSection selectedToolId={selectedToolId} onRouteChange={navigate} />
      <ClosingCtaSection onStartClick={handleStart} />
    </div>
  )
}
