export default function TransferenciasLoading() {
  return (
    <div className="min-h-screen px-4 pt-14 pb-28 md:pl-60 animate-pulse">
      <div className="mb-6">
        <div className="h-3 w-24 rounded bg-white/06 mb-1.5" />
        <div className="h-6 w-40 rounded-lg bg-white/10" />
      </div>
      <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="mb-3">
            <div className="h-3 w-16 rounded bg-white/06 mb-1.5" />
            <div className="h-10 rounded-xl bg-white/05" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-14 rounded-xl bg-white/04" />
        ))}
      </div>
    </div>
  );
}
