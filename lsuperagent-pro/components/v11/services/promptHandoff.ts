/**
 * Carries a prompt typed on the landing page across the route change into
 * Smart Chat.
 *
 * The landing hero and Smart Chat are separate Next.js routes, so component
 * state cannot survive the navigation. sessionStorage is used rather than a
 * query string so long prompts are not truncated or leaked into the URL bar,
 * browser history, or server access logs.
 *
 * The value is consumed exactly once — `takePendingPrompt` clears it — so a
 * later visit to Smart Chat does not silently resend an old prompt.
 */

const PENDING_PROMPT_KEY = 'lsuperagent.v11.pendingPrompt';

export function setPendingPrompt(prompt: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = prompt.trim();
  if (!trimmed) return;
  try {
    window.sessionStorage.setItem(PENDING_PROMPT_KEY, trimmed);
  } catch {
    // Storage unavailable (private mode, blocked cookies). The navigation
    // still happens; the user just retypes. Never break the route change.
  }
}

/** Returns the pending prompt and clears it, so it is delivered only once. */
export function takePendingPrompt(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.sessionStorage.getItem(PENDING_PROMPT_KEY);
    if (value) window.sessionStorage.removeItem(PENDING_PROMPT_KEY);
    return value && value.trim() ? value : null;
  } catch {
    return null;
  }
}
