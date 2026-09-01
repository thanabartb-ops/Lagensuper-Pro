'use client'

import type { ComponentType } from 'react'
import type { OAuthProvider } from '../../services/browserAuth'

/**
 * Sizes are tuned per mark rather than shared: the Microsoft tiles are solid
 * and read heavier than the open Google glyph at the same box size.
 */
const iconClass = 'shrink-0'

function GitHubIcon() {
  return (
    <svg className={`${iconClass} h-[18px] w-[18px]`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg className={`${iconClass} h-4 w-4`} viewBox="0 0 23 23" aria-hidden="true" focusable="false">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M12 1h10v10H12z" />
      <path fill="#00A4EF" d="M1 12h10v10H1z" />
      <path fill="#FFB900" d="M12 12h10v10H12z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg className={`${iconClass} -mt-px h-[18px] w-[18px]`} viewBox="0 0 384 512" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  )
}

const PROVIDERS: ReadonlyArray<{ id: OAuthProvider; label: string; Icon: ComponentType }> = [
  { id: 'github', label: 'GitHub', Icon: GitHubIcon },
  { id: 'microsoft', label: 'Microsoft', Icon: MicrosoftIcon },
  { id: 'apple', label: 'Apple', Icon: AppleIcon },
]

type OAuthProviderButtonsProps = {
  disabled: boolean
  pendingProvider: OAuthProvider | null
  onSelect: (provider: OAuthProvider) => void
}

/**
 * OAuth is one account action, so the same buttons serve login and signup.
 * The label says "continue with" rather than naming either mode.
 */
export function OAuthProviderButtons({
  disabled,
  pendingProvider,
  onSelect,
}: OAuthProviderButtonsProps) {
  return (
    <div className="mt-6 space-y-2.5">
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#0C0D1A] px-3 text-xs text-white/40">หรือ</span>
        </div>
      </div>

      {PROVIDERS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(id)}
          className="flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-[15px] font-medium text-white/90 transition-colors hover:border-white/20 hover:bg-white/[0.04] focus-visible:border-[#7B2CFE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B2CFE]/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon />
          <span>
            {pendingProvider === id ? `กำลังเปิด ${label}...` : `ดำเนินการต่อด้วย ${label}`}
          </span>
        </button>
      ))}
    </div>
  )
}
