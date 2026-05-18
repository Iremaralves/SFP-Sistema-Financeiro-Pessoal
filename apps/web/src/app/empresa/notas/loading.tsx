export default function NotasLoading() {
  return (
    <div className="min-h-screen px-4 pt-14 pb-28 md:pl-60 animate-pulse">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-white/10" />
        <div>
          <div className="h-3 w-20 rounded bg-white/06 mb-1.5" />
          <div className="h-5 w-28 rounded-lg bg-white/10" />
        </div>
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-2xl p-4 bg-white/04 border border-white/07">
            <div className="h-2.5 w-20 rounded bg-white/08 mb-2" />
            <div className="h-5 w-28 rounded-lg bg-white/10 mb-1.5" />
            <div className="h-2.5 w-40 rounded bg-white/06 mb-3" />
            <div className="h-8 w-full rounded-xl bg-white/06" />
          </div>
        ))}
      </div>
    </div>
  );
}
