'use client';

interface Props {
  iremarOwn: number;
  julianaOwn: number;
  casalTotal: number;
  i2: number;
  total: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

const SEG = [
  { key: 'iremar',  label: 'Iremar',  sub: 'só dele',  color: '#93c5fd', grad: 'linear-gradient(90deg,#3b82f6,#6366f1)' },
  { key: 'juliana', label: 'Juliana', sub: 'só dela',  color: '#f9a8d4', grad: 'linear-gradient(90deg,#ec4899,#f472b6)' },
  { key: 'casal',   label: 'Casal',   sub: 'dividido', color: '#67e8f9', grad: 'linear-gradient(90deg,#06b6d4,#22d3ee)' },
  { key: 'i2',      label: 'i2',      sub: 'reembolso', color: '#fbbf24', grad: 'linear-gradient(90deg,#f59e0b,#d97706)' },
] as const;

/**
 * Barra 100% empilhada da divisão da fatura por responsável (4 segmentos que
 * somam o total). Mais legível que donut no mobile. Reaproveitável.
 */
export function SplitBar({ iremarOwn, julianaOwn, casalTotal, i2, total }: Props) {
  const vals: Record<string, number> = { iremar: iremarOwn, juliana: julianaOwn, casal: casalTotal, i2 };
  const pct = (v: number) => (total > 0 ? (v / total) * 100 : 0);
  const segs = SEG.filter(s => vals[s.key]! > 0);

  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }}>
        {segs.map(s => (
          <span key={s.key} style={{ width: `${pct(vals[s.key]!)}%`, background: s.grad }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
        {segs.map(s => (
          <div key={s.key} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.grad }} />
            <span className="text-white/60 text-xs flex-1 min-w-0">{s.label} <span className="text-white/30">· {s.sub}</span></span>
            <span className="text-xs font-semibold tabular flex-shrink-0" style={{ color: s.color }}>{fmt(vals[s.key]!)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
