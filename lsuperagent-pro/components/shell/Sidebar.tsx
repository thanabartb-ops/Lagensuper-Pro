import Link from 'next/link'
import { navItems } from './nav-items'

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-800 bg-black/70 p-4 md:block">
      <nav aria-label="Primary navigation" className="space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
