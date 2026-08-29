'use client'

import { useRouter } from 'next/navigation'
import { AgentModeView } from './components/agent/AgentModeView'
import { AuditView } from './components/audit/AuditView'
import { SmartChatView } from './components/chat/SmartChatView'
import { ImageGenView } from './components/image/ImageGenView'
import { MemoryView } from './components/memory/MemoryView'
import { ProjectsHubView } from './components/projects/ProjectsHubView'
import { DeepResearchView } from './components/research/DeepResearchView'
import { RuntimeView } from './components/runtime/RuntimeView'
import { SettingsView } from './components/settings/SettingsView'
import { routeToPath } from './route-map'
import type { AppRoute } from './types'

type ViewRoute = Exclude<AppRoute, 'landing'>

export function V11RouteView({ route }: { route: ViewRoute }) {
  const router = useRouter()

  switch (route) {
    case 'smart_chat':
      return <SmartChatView />
    case 'deep_research':
      return <DeepResearchView />
    case 'create_image':
      return <ImageGenView />
    case 'agent_mode':
      return <AgentModeView />
    case 'memory':
      return <MemoryView />
    case 'settings':
      return <SettingsView />
    case 'projects':
      return <ProjectsHubView onRouteChange={(nextRoute) => router.push(routeToPath[nextRoute])} />
    case 'runtime':
      return <RuntimeView />
    case 'audit':
      return <AuditView />
  }
}
