export default function CompromissosLoading() {
  return (
    <div className="min-h-screen px-4 pt-14 pb-28 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-36 rounded-lg bg-white/10" />
        <div className="h-7 w-7 rounded-lg bg-white/10" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 mb-6">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-8 rounded-full bg-white/08 ${i === 0 ? 'w-16' : 'w-20'}`} />
        ))}
      </div>

      {/* Mês selector */}
      <div className="flex items-center justify-between mb-5">
        <div className="h-5 w-5 rounded bg-white/10" />
        <div className="h-4 w-32 rounded bg-white/10" />
        <div className="h-5 w-5 rounded bg-white/10" />
      </div>

      {/* Cards de compromisso */}
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-2xl p-4 bg-white/04 border border-white/08">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="h-3.5 w-32 rounded bg-white/10 mb-1.5" />
                <div className="h-2.5 w-20 rounded bg-white/06" />
              </div>
              <div className="h-6 w-16 rounded-full bg-white/10" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 rounded bg-white/10" />
              <div className="h-7 w-20 rounded-xl bg-white/08" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
