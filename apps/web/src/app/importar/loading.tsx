export default function ImportarLoading() {
  return (
    <div className="min-h-screen px-4 pt-14 pb-28 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-6 w-28 rounded-lg bg-white/10 mb-1.5" />
          <div className="h-3 w-44 rounded bg-white/06" />
        </div>
      </div>

      {/* Upload area skeleton */}
      <div className="rounded-3xl p-8 mb-5 bg-white/04 border-2 border-dashed border-white/12 flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white/10" />
        <div className="h-4 w-40 rounded bg-white/10" />
        <div className="h-3 w-28 rounded bg-white/06" />
        <div className="h-9 w-32 rounded-xl bg-white/10 mt-2" />
      </div>

      {/* Google Drive section */}
      <div className="mb-5">
        <div className="h-3.5 w-24 rounded bg-white/10 mb-3" />
        <div className="space-y-2">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/04 border border-white/08">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3 w-36 rounded bg-white/10 mb-1.5" />
                <div className="h-2.5 w-20 rounded bg-white/06" />
              </div>
              <div className="h-7 w-16 rounded-lg bg-white/08" />
            </div>
          ))}
        </div>
      </div>

      {/* Histórico section */}
      <div>
        <div className="h-3.5 w-28 rounded bg-white/10 mb-3" />
        <div className="space-y-2">
          {[0, 1].map(i => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/04 border border-white/08">
              <div>
                <div className="h-3 w-32 rounded bg-white/10 mb-1.5" />
                <div className="h-2.5 w-24 rounded bg-white/06" />
              </div>
              <div className="h-5 w-12 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
