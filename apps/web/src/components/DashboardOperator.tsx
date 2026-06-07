'use client';

import { calculateInvoiceSettlement } from '@i2fin/core';
import type { Transaction } from '@i2fin/schema';
import { BottomNav } from './BottomNav';
import { TransactionList } from './TransactionList';
import { LogoutButton } from './LogoutButton';
import { BillsCard, type Bill } from './BillsCard';
import Link from 'next/link';
import type { ProfileScope } from '@/lib/profile-scope';

interface Props {
  profile: { name: string; role: string; household_id: string };
  transactions: Transaction[];
  month: string;
  bills?: Bill[];
  scope?: ProfileScope;
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

const glass = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
} as React.CSSProperties;

export function DashboardOperator({ profile, transactions, month, bills = [], scope = 'pessoal' }: Props) {
  const settlement = calculateInvoiceSettlement(transactions, month);
  const [lbl_y, lbl_m] = month.split('-').map(Number);
  const monthLabel = new Date(lbl_y, lbl_m - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  const firstName = profile.name.split(' ')[0];
  const unassigned = transactions.filter(t => t.responsible === 'unassigned').length;

  // Derivados
  const casalHalf = settlement.casalTotal / 2;
  const julianaOwn = Math.max(0, settlement.julianaPart - casalHalf);
  const julianaRatio = settlement.totalFatura > 0 ? (settlement.julianaPart / settlement.totalFatura) * 100 : 0;

  return (
    <>
      {/* Header */}
      <div className="relative px-5 md:px-8 pt-14 md:pt-8 pb-6 overflow-hidden page-container">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(236,72,153,0.18) 0%, transparent 70%)' }} />
        <div className="flex items-center justify-between mb-1">
          <span className="text-white/40 text-xs uppercase tracking-widest capitalize">Fatura {monthLabel}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(236,72,153,0.15)', color: '#f9a8d4', border: '1px solid rgba(236,72,153,0.25)' }}>
              operator
            </span>
            <LogoutButton />
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">Olá, {firstName} 👋</h1>
      </div>

      <div className="px-4 md:px-8 pb-28 md:pb-12 space-y-3 page-container fade-up-stagger">

        {/* Alerta sem responsável — CTA principal pra Juliana */}
        {unassigned > 0 && (
          <Link href="/categorizar"
            className="rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-[0.98]"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <span className="text-2xl">📥</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-300 text-sm">{unassigned} lançamentos para categorizar</p>
              <p className="text-amber-400/60 text-xs mt-0.5">Toque para começar →</p>
            </div>
            <span className="text-amber-300 text-base flex-shrink-0">›</span>
          </Link>
        )}

        {/* Hero — total fatura + barra */}
        <div className="rounded-3xl p-5 md:p-7 relative overflow-hidden" style={glass}>
          <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(236,72,153,0.12), transparent 70%)' }} />
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Total da fatura</p>
          <p className="text-4xl md:text-5xl font-bold text-white tabular">{fmt(settlement.totalFatura)}</p>
          <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(julianaRatio, 100).toFixed(0)}%`, background: 'linear-gradient(90deg, #ec4899, #f472b6)' }}
            />
          </div>
          <p className="text-white/30 text-xs mt-2">Sua parte: {julianaRatio.toFixed(0)}% da fatura</p>
        </div>

        {/* Equação Juliana — destaque principal */}
        <div className="rounded-2xl p-4 overflow-hidden" style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)' }}>
          {/* Total em destaque */}
          <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
            <p className="text-xs uppercase tracking-wider font-semibold flex-shrink-0" style={{ color: '#ec4899' }}>Sua parte a pagar</p>
            <p className="text-xl font-bold truncate" style={{ color: '#f9a8d4', fontVariantNumeric: 'tabular-nums' }}>{fmt(settlement.julianaPart)}</p>
          </div>

          {/* Equação: pessoal + casal÷2 = total (com min-w-0 + truncate como no Admin) */}
          <div className="flex items-stretch gap-1">
            {/* Gastos pessoais */}
            <div className="flex-1 min-w-0 rounded-xl px-2 py-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <p className="text-[9px] text-white/35 uppercase tracking-wider mb-0.5">Seus gastos</p>
              <p className="text-xs font-semibold truncate" style={{ color: '#f9a8d4', fontVariantNumeric: 'tabular-nums' }}>{fmt(julianaOwn)}</p>
            </div>

            <span className="text-white/25 text-xs font-light flex-shrink-0 self-center px-0.5">+</span>

            {/* Metade casal */}
            <div className="flex-1 min-w-0 rounded-xl px-2 py-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <p className="text-[9px] text-white/35 uppercase tracking-wider mb-0.5">Casal ÷ 2</p>
              <p className="text-xs font-semibold truncate" style={{ color: '#67e8f9', fontVariantNumeric: 'tabular-nums' }}>{fmt(casalHalf)}</p>
            </div>

            <span className="text-white/25 text-xs font-light flex-shrink-0 self-center px-0.5">=</span>

            {/* Total */}
            <div className="flex-1 min-w-0 rounded-xl px-2 py-2 text-center" style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.25)' }}>
              <p className="text-[9px] text-white/35 uppercase tracking-wider mb-0.5">Total</p>
              <p className="text-xs font-bold truncate" style={{ color: '#f9a8d4', fontVariantNumeric: 'tabular-nums' }}>{fmt(settlement.julianaPart)}</p>
            </div>
          </div>

          {/* Info casal total */}
          <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-white/30 text-xs flex-shrink-0">Casal (total)</span>
            <div className="flex items-center gap-1 min-w-0 flex-wrap justify-end">
              <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: '#67e8f9', fontVariantNumeric: 'tabular-nums' }}>{fmt(settlement.casalTotal)}</span>
              <span className="text-white/20 text-[10px] flex-shrink-0">÷2=</span>
              <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: '#67e8f9', fontVariantNumeric: 'tabular-nums' }}>{fmt(casalHalf)}</span>
            </div>
          </div>
        </div>

        {/* Contas a pagar do mês (Juliana paga 3: plano saúde, apartamento, feira) */}
        <BillsCard bills={bills} accent="var(--accent-juliana)" />

        {/* Add transaction CTA */}
        <Link
          href="/lancamentos/novo"
          className="flex items-center justify-center gap-2 rounded-2xl py-4 font-semibold text-white transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #ec4899, #f472b6)' }}
        >
          <span className="text-xl font-light">+</span>
          <span>Adicionar lançamento</span>
        </Link>

        {/* Atalhos rápidos */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/categorizar"
            className="rounded-2xl p-3.5 flex items-center gap-2.5 transition-all active:scale-95"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)' }}
          >
            <span className="text-xl">📥</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#fcd34d' }}>Categorizar</p>
              <p className="text-[10px]" style={{ color: 'rgba(252,211,77,0.55)' }}>Definir responsável</p>
            </div>
          </Link>
          <Link
            href="/acerto"
            className="rounded-2xl p-3.5 flex items-center gap-2.5 transition-all active:scale-95"
            style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.18)' }}
          >
            <span className="text-xl">⚖️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#67e8f9' }}>Acerto Casal</p>
              <p className="text-[10px]" style={{ color: 'rgba(103,232,249,0.55)' }}>Fechamento do mês</p>
            </div>
          </Link>
        </div>

        {/* Lançamentos recentes */}
        <div>
          <p className="text-white/30 text-xs uppercase tracking-widest px-1 mb-3">Lançamentos recentes</p>
          <TransactionList transactions={transactions.slice(0, 10)} />
        </div>
      </div>

      <BottomNav role="operator" name={profile.name} scope={scope} />
    </>
  );
}
