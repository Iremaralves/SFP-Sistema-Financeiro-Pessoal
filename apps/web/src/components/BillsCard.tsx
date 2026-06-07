'use client';

import Link from 'next/link';

type BillStatus = 'overdue' | 'today' | 'upcoming';

export interface Bill {
  id: string;
  description: string;
  due_day: number;
  amount: number;
  dueDateStr: string;
  status: BillStatus;
  responsible: string;
  paid_by: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

const STATUS_CFG: Record<BillStatus, { label: string; emoji: string; color: string; bg: string }> = {
  overdue:  { label: 'Atrasado',  emoji: '🔴', color: '#f87171', bg: 'rgba(239,68,68,0.10)' },
  today:    { label: 'Vence hoje', emoji: '🟡', color: '#fbbf24', bg: 'rgba(251,191,36,0.10)' },
  upcoming: { label: 'A vencer',   emoji: '🟢', color: '#34d399', bg: 'rgba(16,185,129,0.10)' },
};

export function BillsCard({ bills, accent = '#3b82f6' }: { bills: Bill[]; accent?: string }) {
  if (!bills || bills.length === 0) {
    return (
      <Link href="/compromissos"
        className="block rounded-2xl p-4 transition-all active:scale-[0.98]"
        style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-emerald-300 text-sm">Tudo em dia!</p>
            <p className="text-emerald-400/60 text-xs mt-0.5">Sem contas pendentes este mês</p>
          </div>
        </div>
      </Link>
    );
  }

  const totalPendente = bills.reduce((s, b) => s + b.amount, 0);
  const atrasados = bills.filter(b => b.status === 'overdue');
  const venceHoje = bills.filter(b => b.status === 'today');
  const aVencer   = bills.filter(b => b.status === 'upcoming');

  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-white/40 text-[10px] uppercase tracking-widest">Contas a pagar este mês</p>
          <p className="text-white text-2xl font-bold tabular mt-0.5">{fmt(totalPendente)}</p>
        </div>
        <Link href="/compromissos"
          className="text-[10px] font-semibold px-3 py-2 rounded-xl flex-shrink-0 transition-all active:scale-95"
          style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}40` }}>
          Ver todas ›
        </Link>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { count: atrasados.length, total: atrasados.reduce((s,b)=>s+b.amount,0), cfg: STATUS_CFG.overdue,  show: atrasados.length > 0 },
          { count: venceHoje.length, total: venceHoje.reduce((s,b)=>s+b.amount,0), cfg: STATUS_CFG.today,    show: venceHoje.length > 0 },
          { count: aVencer.length,   total: aVencer.reduce((s,b)=>s+b.amount,0),   cfg: STATUS_CFG.upcoming, show: aVencer.length > 0 },
        ].filter(g => g.show).map((g, i) => (
          <div key={i} className="rounded-xl p-2 text-center" style={{ background: g.cfg.bg }}>
            <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: g.cfg.color }}>
              {g.cfg.emoji} {g.cfg.label}
            </p>
            <p className="text-white text-sm font-bold tabular mt-0.5">{g.count}</p>
            <p className="text-white/40 text-[10px] tabular">{fmt(g.total)}</p>
          </div>
        ))}
      </div>

      {/* Lista compacta — top 5 mais urgentes */}
      <div className="space-y-1.5">
        {bills.slice(0, 5).map(b => {
          const cfg = STATUS_CFG[b.status];
          return (
            <Link key={b.id} href="/compromissos"
              className="flex items-center gap-2 py-2 px-2 rounded-lg transition-all active:scale-[0.98] hover:bg-white/04">
              <span
                className="flex-shrink-0 w-9 h-9 rounded-lg flex flex-col items-center justify-center"
                style={{ background: cfg.bg, border: `1px solid ${cfg.color}33` }}>
                <span className="text-[8px] font-bold leading-none" style={{ color: cfg.color }}>dia</span>
                <span className="text-xs font-bold leading-none" style={{ color: cfg.color }}>{b.due_day}</span>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{b.description}</p>
                <p className="text-[10px]" style={{ color: cfg.color }}>{cfg.label}</p>
              </div>
              <span className="text-white text-xs font-semibold tabular flex-shrink-0">{fmt(b.amount)}</span>
            </Link>
          );
        })}
        {bills.length > 5 && (
          <Link href="/compromissos"
            className="block text-center text-[10px] text-white/40 hover:text-white/70 py-1">
            + {bills.length - 5} {bills.length - 5 === 1 ? 'outra conta' : 'outras contas'}
          </Link>
        )}
      </div>
    </div>
  );
}
