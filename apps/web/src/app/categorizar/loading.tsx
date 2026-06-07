export default function CategorizarLoading() {
  return (
    <div className="min-h-screen px-4 pt-14 pb-28 md:pl-60 animate-pulse">
      <div className="mb-6">
        <div className="h-3 w-24 rounded bg-white/06 mb-1.5" />
        <div className="h-6 w-48 rounded-lg bg-white/10" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[0, 1].map(i => <div key={i} className="h-16 rounded-2xl bg-white/04" />)}
      </div>
      <div className="space-y-2.5">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="h-4 w-3/4 rounded bg-white/08 mb-3" />
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map(j => <div key={j} className="h-12 rounded-xl bg-white/05" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
