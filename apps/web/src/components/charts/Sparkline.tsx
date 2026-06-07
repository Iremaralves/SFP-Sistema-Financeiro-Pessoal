'use client';

interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
}

/**
 * Sparkline SVG nativa — sem libs.
 * Aceita array de números (≥2). Normaliza min/max automaticamente.
 */
export function Sparkline({
  data,
  width = 200,
  height = 56,
  color = 'var(--accent-iremar)',
  fillOpacity = 0.18,
}: Props) {
  if (!data || data.length < 2) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-xs"
      >
        <span style={{ color: 'var(--text-4)' }}>sem dados</span>
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 4;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * w;
    const y = pad + h - ((v - min) / range) * h;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${pad + h} L ${points[0].x} ${pad + h} Z`;

  const lastPoint = points[points.length - 1];
  const uid = `spark-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Tendência">
      <defs>
        <linearGradient id={uid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${uid})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPoint.x} cy={lastPoint.y} r={3} fill={color} />
      <circle cx={lastPoint.x} cy={lastPoint.y} r={6} fill={color} opacity={0.25} />
    </svg>
  );
}
