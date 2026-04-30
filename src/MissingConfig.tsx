export function MissingConfig() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b] p-6 text-stone-200">
      <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-semibold text-white">Missing Convex config</h1>
        <p className="mt-3 text-sm text-stone-400">
          Set <code className="rounded bg-black/30 px-2 py-1 text-stone-200">VITE_CONVEX_URL</code> before running the app.
        </p>
      </div>
    </div>
  );
}
