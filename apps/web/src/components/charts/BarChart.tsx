'use client';

interface Series {
  label: string;
  values: number[];
  color: string;
}

interface Props {
  labels: string[];
  series: Series[];
  height?: number;
  format?: (n: number) => string;
}

/**
 * Bar chart SVG nativo — barras pareadas por categoria.
 * Sem libs. Suporta 1-3 séries por categoria.
 */
export function BarChart({
  labels,
  series,
  height = 220,
  format = (n) => n.toFixed(0),
}: Props) {
  if (!labels.length || !series.length) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-xs" >
        <span style={{ color: 'var(--text-4)' }}>sem dados</span>
      </div>
    );
  }

  const padL = 8;
  const padR = 8;
  const padT = 12;
  const padB = 28;
  const innerH = height - padT - padB;

  const allValues = series.flatMap((s) => s.values);
  const max = Math.max(...allValues, 1);

  // gridlines (4 linhas)
  const gridSteps = 4;

  const groupCount = labels.length;
  const groupGap = 0.25; // 25% gap entre grupos

  return (
    <div className="w-full">
      <svg viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none" width="100%" height={height} role="img" aria-label="Gráfico de barras">
        {/* Grid horizontal */}
        {Array.from({ length: gridSteps + 1 }).map((_, i) => {
          const y = padT + (innerH * i) / gridSteps;
          return (
            <line
              key={i}
              x1={padL}
              x2={1000 - padR}
              y1={y}
              y2={y}
              stroke="var(--border-soft)"
              strokeWidth={1}
              strokeDasharray={i === gridSteps ? '0' : '2 4'}
              opacity={i === gridSteps ? 1 : 0.6}
            />
          );
        })}

        {/* Bars */}
        {labels.map((label, gi) => {
          const groupW = (1000 - padL - padR) / groupCount;
          const groupX = padL + groupW * gi;
          const usableW = groupW * (1 - groupGap);
          const barW = usableW / series.length;
          const startX = groupX + (groupW - usableW) / 2;

          return (
            <g key={label}>
              {series.map((s, si) => {
                const v = s.values[gi] ?? 0;
                const h = (v / max) * innerH;
                const x = startX + barW * si;
                const y = padT + innerH - h;
                return (
                  <g key={s.label}>
                    <rect
                      x={x + 1}
                      y={y}
                      width={Math.max(barW - 2, 1)}
                      height={Math.max(h, 0)}
                      fill={s.color}
                      rx={2}
                      opacity={0.9}
                    >
                      <title>{`${label} · ${s.label}: ${format(v)}`}</title>
                    </rect>
                  </g>
                );
              })}
              {/* x-axis label */}
              <text
                x={groupX + groupW / 2}
                y={height - 8}
                textAnchor="middle"
                fontSize={11}
                fill="var(--text-3)"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 px-1">
        {series.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: s.color }}
            />
            <span className="text-[11px]" style={{ color: 'var(--text-2)' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
