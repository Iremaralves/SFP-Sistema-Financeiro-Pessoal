export default function DashboardLoading() {
  return (
    <div className="min-h-screen px-4 pt-14 pb-28 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-5 w-32 rounded-lg bg-white/10 mb-2" />
          <div className="h-3 w-20 rounded-lg bg-white/06" />
        </div>
        <div className="h-8 w-8 rounded-full bg-white/10" />
      </div>

      {/* Saldo card skeleton */}
      <div className="rounded-3xl p-6 mb-6 bg-white/05 border border-white/08">
        <div className="h-3 w-24 rounded bg-white/10 mb-3" />
        <div className="h-10 w-40 rounded-lg bg-white/10 mb-1" />
        <div className="h-3 w-28 rounded bg-white/06" />
      </div>

      {/* Dois cards menores */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[0, 1].map(i => (
          <div key={i} className="rounded-2xl p-4 bg-white/05 border border-white/08">
            <div className="h-3 w-16 rounded bg-white/10 mb-3" />
            <div className="h-7 w-24 rounded-lg bg-white/10" />
          </div>
        ))}
      </div>

      {/* Lista de transações skeleton */}
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/04">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-3 w-32 rounded bg-white/10 mb-2" />
              <div className="h-2.5 w-20 rounded bg-white/06" />
            </div>
            <div className="h-4 w-16 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
