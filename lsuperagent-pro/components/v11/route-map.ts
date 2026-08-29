import type { AppRoute } from './types'

export const routeToPath: Record<AppRoute, string> = {
  landing: '/',
  smart_chat: '/chat',
  deep_research: '/tools/deep-research',
  create_image: '/tools/create-image',
  agent_mode: '/tools/agent-mode',
  memory: '/memory',
  settings: '/settings',
  projects: '/projects',
  runtime: '/runtime',
  audit: '/audit',
}

export function pathToRoute(pathname: string): AppRoute {
  const match = Object.entries(routeToPath).find(([, path]) => path === pathname)
  return (match?.[0] as AppRoute | undefined) ?? 'landing'
}
