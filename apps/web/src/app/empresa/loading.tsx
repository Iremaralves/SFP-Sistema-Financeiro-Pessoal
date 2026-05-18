export default function EmpresaLoading() {
  return (
    <div className="min-h-screen px-4 pt-14 pb-28 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-white/10" />
        <div>
          <div className="h-5 w-32 rounded-lg bg-white/10 mb-1.5" />
          <div className="h-3 w-20 rounded bg-white/06" />
        </div>
      </div>

      {/* Mês selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-7 rounded-lg bg-white/10" />
        <div className="h-5 w-32 rounded bg-white/10" />
        <div className="h-7 w-7 rounded-lg bg-white/10" />
      </div>

      {/* DRE card */}
      <div className="rounded-3xl p-5 mb-5 bg-white/05 border border-white/08">
        <div className="h-4 w-20 rounded bg-white/10 mb-4" />
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="flex justify-between mb-3">
            <div className="h-3 w-28 rounded bg-white/08" />
            <div className="h-3 w-20 rounded bg-white/10" />
          </div>
        ))}
        <div className="mt-4 pt-4 border-t border-white/08 flex justify-between">
          <div className="h-4 w-20 rounded bg-white/10" />
          <div className="h-4 w-24 rounded bg-white/10" />
        </div>
      </div>

      {/* Contas fixas */}
      <div className="rounded-2xl p-4 bg-white/04 border border-white/08">
        <div className="h-4 w-24 rounded bg-white/10 mb-3" />
        <div className="space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex justify-between">
              <div className="h-3 w-32 rounded bg-white/08" />
              <div className="h-3 w-16 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
