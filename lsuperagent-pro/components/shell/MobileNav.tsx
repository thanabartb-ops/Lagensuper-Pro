import Link from 'next/link'
import { navItems } from './nav-items'

export function MobileNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="grid grid-cols-4 gap-1 border-t border-zinc-800 bg-black/95 p-2 md:hidden"
    >
      {navItems.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] text-zinc-400 hover:bg-zinc-900 hover:text-white"
        >
          <Icon aria-hidden="true" className="size-4" />
          <span className="truncate">{label}</span>
        </Link>
      ))}
    </nav>
  )
}
