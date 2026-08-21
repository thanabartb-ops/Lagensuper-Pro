export default function ChatPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
          LSUPERAGENT PRO
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Chat</h1>
        <p className="text-sm leading-6 text-zinc-400">
          Commands require an authenticated Supabase session before they can
          reach the trusted gateway.
        </p>
      </header>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
        <p className="text-sm text-zinc-400">Use the existing owner account.</p>
        <a
          href="/login"
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-100"
        >
          Sign in
        </a>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-200">Message</span>
        <textarea
          aria-label="Message"
          rows={6}
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-100 outline-none"
          placeholder="Ask LSUPERAGENT…"
        />
      </label>
    </div>
  )
}
