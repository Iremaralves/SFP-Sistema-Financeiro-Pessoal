'use client';

import Link from 'next/link';

export interface IncomeLine {
  label: string;
  amount: number;
  kind?: string; // pro_labore | juliana_transfer | outro
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

const KIND_META: Record<string, { emoji: string; color: string; bg: string }> = {
  pro_labore:       { emoji: '💼', color: '#a5b4fc', bg: 'rgba(99,102,241,0.10)' },
  juliana_transfer: { emoji: '👩', color: '#f9a8d4', bg: 'rgba(236,72,153,0.10)' },
  default:          { emoji: '📥', color: '#34d399', bg: 'rgba(16,185,129,0.10)' },
};

export function IncomeCard({
  lines,
  total,
  accent = '#34d399',
  hrefMore = '/empresa',
}: {
  lines: IncomeLine[];
  total: number;
  accent?: string;
  hrefMore?: string;
}) {
  if (!lines || lines.length === 0 || total === 0) {
    return (
      <Link href={hrefMore}
        className="block rounded-2xl p-4 transition-all active:scale-[0.98]"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl opacity-60">📥</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white/60 text-sm">Nenhuma receita registrada</p>
            <p className="text-white/30 text-xs mt-0.5">Toque para cadastrar →</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-emerald-300/60 text-[10px] uppercase tracking-widest">Contas a receber este mês</p>
          <p className="text-emerald-300 text-2xl font-bold tabular mt-0.5">{fmt(total)}</p>
        </div>
        <Link href={hrefMore}
          className="text-[10px] font-semibold px-3 py-2 rounded-xl flex-shrink-0 transition-all active:scale-95"
          style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}40` }}>
          Ver tudo ›
        </Link>
      </div>

      {/* Lista de linhas */}
      <div className="space-y-1.5">
        {lines.map((line, i) => {
          const meta = KIND_META[line.kind ?? ''] ?? KIND_META.default!;
          return (
            <div key={i}
              className="flex items-center gap-2 py-2 px-2 rounded-lg"
              style={{ background: meta.bg }}>
              <span className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-base"
                style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${meta.color}33` }}>
                {meta.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{line.label}</p>
              </div>
              <span className="text-xs font-semibold tabular flex-shrink-0" style={{ color: meta.color }}>
                + {fmt(line.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
