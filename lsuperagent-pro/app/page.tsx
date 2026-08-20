export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-16 sm:px-10">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Alternate Client
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            LSUPERAGENT PRO
          </h1>
          <p className="max-w-2xl text-zinc-400">
            Thin client for the existing trusted LSUPERAGENT gateway. No parallel core, memory, audit, or runtime authority is created here.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm text-zinc-500">Gateway / canonical backend</p>
          <p className="mt-2 font-mono text-sm tracking-wider">NOT_CONNECTED</p>
        </div>
      </section>
    </main>
  )
}
