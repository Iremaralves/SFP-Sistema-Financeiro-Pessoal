'use client';

interface Slice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: Slice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

/**
 * Donut chart SVG nativo. Suporta N fatias.
 * Mostra label central + valor.
 */
export function DonutSplit({
  slices,
  size = 160,
  thickness = 22,
  centerLabel,
  centerValue,
}: Props) {
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;

  let acc = 0;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Distribuição">
        {/* Track */}
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={thickness}
        />
        {/* Slices */}
        {total > 0 &&
          slices.map((s) => {
            const v = Math.max(0, s.value);
            const frac = v / total;
            const len = frac * circ;
            const offset = -acc;
            acc += len;
            return (
              <circle
                key={s.label}
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${c} ${c})`}
                strokeLinecap="butt"
              >
                <title>{`${s.label}: ${v.toFixed(2)}`}</title>
              </circle>
            );
          })}
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {centerLabel && (
          <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
            {centerLabel}
          </span>
        )}
        {centerValue && (
          <span className="text-base font-bold tabular mt-0.5" style={{ color: 'var(--text-1)' }}>
            {centerValue}
          </span>
        )}
      </div>
    </div>
  );
}
