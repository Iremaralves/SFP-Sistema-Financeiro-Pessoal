'use client';

import Link from 'next/link';

export interface WeekItem {
  id: string;
  description: string;
  due_day: number;
  amount: number;
}

interface Props {
  items: WeekItem[];        // contas que vencem nos próximos 7 dias
  overdueTotal?: number;    // total atrasado (mostrado como aviso ao lado)
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

/**
 * "Esta semana" — total que vence nos próximos 7 dias + chips por dia.
 * Responde a pergunta órfã "total de pagamentos da semana".
 */
export function WeekStrip({ items, overdueTotal = 0 }: Props) {
  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <Link href="/compromissos"
      className="block rounded-2xl p-4 transition-all active:scale-[0.99]"
      style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-indigo-300/60 text-[10px] uppercase tracking-widest font-semibold">Esta semana · próximos 7 dias</p>
          <p className="text-2xl font-bold text-white tabular mt-0.5">{fmt(total)}</p>
        </div>
        <span className="text-white/40 text-xs flex-shrink-0">
          {items.length} conta{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {items.length > 0 ? (
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {items.map(i => (
            <span key={i.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px]"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-white/40">dia {i.due_day}</span>
              <span className="text-white/80 truncate max-w-[90px]">{i.description}</span>
              <span className="text-indigo-300 font-semibold tabular">{fmt(i.amount)}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-white/35 text-xs mt-2">Nada vence esta semana 🎉</p>
      )}

      {overdueTotal > 0 && (
        <p className="text-red-300/80 text-[11px] mt-2.5 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          🔴 + {fmt(overdueTotal)} atrasado (fora desta semana)
        </p>
      )}
    </Link>
  );
}
