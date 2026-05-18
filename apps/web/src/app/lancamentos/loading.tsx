export default function LancamentosLoading() {
  return (
    <div className="min-h-screen px-4 pt-14 pb-28 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="h-6 w-28 rounded-lg bg-white/10" />
        <div className="h-8 w-20 rounded-xl bg-white/10" />
      </div>

      {/* Filtros skeleton */}
      <div className="flex gap-2 mb-5 overflow-hidden">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-8 w-20 rounded-full bg-white/08 flex-shrink-0" />
        ))}
      </div>

      {/* Total skeleton */}
      <div className="rounded-2xl p-4 mb-5 bg-white/05 border border-white/08 flex justify-between">
        <div className="h-3 w-24 rounded bg-white/10" />
        <div className="h-4 w-20 rounded bg-white/10" />
      </div>

      {/* Lista de lançamentos */}
      <div className="space-y-2">
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/04">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-3 w-36 rounded bg-white/10 mb-1.5" />
              <div className="h-2.5 w-20 rounded bg-white/06" />
            </div>
            <div className="text-right">
              <div className="h-3.5 w-16 rounded bg-white/10 mb-1" />
              <div className="h-2 w-10 rounded bg-white/06" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
