export default function ContasLoading() {
  return (
    <div className="min-h-screen px-4 pt-14 pb-28 animate-pulse">
      {/* Header */}
      <div className="h-6 w-28 rounded-lg bg-white/10 mb-8" />

      {/* Saldo total card */}
      <div className="rounded-3xl p-6 mb-6 bg-white/05 border border-white/08 text-center">
        <div className="h-3 w-24 rounded bg-white/10 mb-3 mx-auto" />
        <div className="h-10 w-36 rounded-lg bg-white/10 mx-auto" />
      </div>

      {/* Cards de conta */}
      <div className="space-y-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-2xl p-4 bg-white/04 border border-white/08">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-white/10" />
              <div>
                <div className="h-3.5 w-28 rounded bg-white/10 mb-1.5" />
                <div className="h-2.5 w-16 rounded bg-white/06" />
              </div>
            </div>
            <div className="h-6 w-32 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
