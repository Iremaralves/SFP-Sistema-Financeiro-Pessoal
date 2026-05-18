export default function RelatoriosLoading() {
  return (
    <div className="min-h-screen px-4 pt-14 pb-28 md:pl-60 animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-3 w-20 rounded bg-white/06 mb-1.5" />
        <div className="h-6 w-28 rounded-lg bg-white/10" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[0, 1].map(i => (
          <div key={i} className="h-8 w-32 rounded-full bg-white/08" />
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="rounded-2xl p-4 bg-white/04 border border-white/07">
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-24 rounded bg-white/10" />
              <div className="h-3 w-16 rounded bg-white/08" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map(j => (
                <div key={j} className="h-8 rounded-xl bg-white/06" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
