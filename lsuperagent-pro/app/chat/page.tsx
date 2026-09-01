import { RequireAuth } from '@/components/v11/components/auth/RequireAuth'
import { V11RouteView } from '@/components/v11/V11RouteView'

export default function ChatPage() {
  return (
    <RequireAuth>
      <V11RouteView route="smart_chat" />
    </RequireAuth>
  )
}
