/**
 * Carries a prompt typed on the landing page across the route change into
 * Smart Chat.
 *
 * sessionStorage keeps long prompts out of the URL, browser history, and
 * server access logs. Delivery is split into peek + clear so React Strict Mode
 * can replay an effect without deleting the prompt before the surviving setup
 * gets a chance to send it.
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

/** Read without consuming. The caller clears only when delivery really starts. */
export function peekPendingPrompt(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.sessionStorage.getItem(PENDING_PROMPT_KEY);
    return value && value.trim() ? value : null;
  } catch {
    return null;
  }
}

/** Clear the pending prompt, optionally only if it still matches `expected`. */
export function clearPendingPrompt(expected?: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (expected !== undefined) {
      const current = window.sessionStorage.getItem(PENDING_PROMPT_KEY);
      if (current !== expected) return;
    }
    window.sessionStorage.removeItem(PENDING_PROMPT_KEY);
  } catch {
    // Best effort only; a later visit may retry the handoff if storage is
    // unreadable, which is safer than deleting an unrelated value.
  }
}

/** Backward-compatible one-shot helper used by focused storage tests. */
export function takePendingPrompt(): string | null {
  const value = peekPendingPrompt();
  if (value) clearPendingPrompt(value);
  return value;
}
