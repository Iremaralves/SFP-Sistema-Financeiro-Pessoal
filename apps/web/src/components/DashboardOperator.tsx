'use client';

import { calculateSettlement } from '@i2fin/core';
import type { Transaction } from '@i2fin/schema';
import { BottomNav } from './BottomNav';
import { TransactionList } from './TransactionList';
import { LogoutButton } from './LogoutButton';
import Link from 'next/link';

interface Props {
  profile: { name: string; role: string; household_id: string };
  transactions: Transaction[];
  month: string;
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

export function DashboardOperator({ profile, transactions, month }: Props) {
  const settlement = calculateSettlement(transactions, month);
  const [lbl_y, lbl_m] = month.split('-').map(Number);
  const monthLabel = new Date(lbl_y, lbl_m - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  const firstName = profile.name.split(' ')[0];

  // Derivados
  const casalHalf = settlement.casalTotal / 2;
  const julianaOwn = Math.max(0, settlement.julianaPart - casalHalf);
  const julianaRatio = settlement.totalFatura > 0 ? (settlement.julianaPart / settlement.totalFatura) * 100 : 0;

  return (
    <>
      {/* Header */}
      <div className="relative px-5 pt-14 pb-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(236,72,153,0.18) 0%, transparent 70%)' }} />
        <div className="flex items-center justify-between">
          <span className="text-white/40 text-xs uppercase tracking-widest capitalize">{monthLabel}</span>
          <LogoutButton />
        </div>
        <h1 className="text-2xl font-bold text-white mt-1">Olá, {firstName} 👋</h1>
      </div>

      <div className="px-4 pb-28 space-y-3">

        {/* Hero — total fatura + barra */}
        <div className="rounded-3xl p-5 relative overflow-hidden" style={glass}>
          <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(236,72,153,0.12), transparent 70%)' }} />
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Total da fatura</p>
          <p className="text-4xl font-bold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(settlement.totalFatura)}</p>
          <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(julianaRatio, 100).toFixed(0)}%`, background: 'linear-gradient(90deg, #ec4899, #f472b6)' }}
            />
          </div>
          <p className="text-white/30 text-xs mt-2">Sua parte: {julianaRatio.toFixed(0)}% da fatura</p>
        </div>

        {/* Equação Juliana — destaque principal */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)' }}>
          {/* Total em destaque */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: '#ec4899' }}>Sua parte a pagar</p>
            <p className="text-2xl font-bold" style={{ color: '#f9a8d4', fontVariantNumeric: 'tabular-nums' }}>{fmt(settlement.julianaPart)}</p>
          </div>

          {/* Equação: pessoal + casal÷2 = total */}
          <div className="flex items-center gap-1.5">
            {/* Gastos pessoais */}
            <div className="flex-1 rounded-xl px-3 py-2.5 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <p className="text-[9px] text-white/35 uppercase tracking-wider mb-1">Seus gastos</p>
              <p className="text-sm font-semibold" style={{ color: '#f9a8d4', fontVariantNumeric: 'tabular-nums' }}>{fmt(julianaOwn)}</p>
            </div>

            {/* + */}
            <span className="text-white/30 text-base font-light flex-shrink-0">+</span>

            {/* Metade casal */}
            <div className="flex-1 rounded-xl px-3 py-2.5 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <p className="text-[9px] text-white/35 uppercase tracking-wider mb-1">Casal ÷ 2</p>
              <p className="text-sm font-semibold" style={{ color: '#67e8f9', fontVariantNumeric: 'tabular-nums' }}>{fmt(casalHalf)}</p>
            </div>

            {/* = */}
            <span className="text-white/30 text-base font-light flex-shrink-0">=</span>

            {/* Total */}
            <div className="flex-1 rounded-xl px-3 py-2.5 text-center" style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.25)' }}>
              <p className="text-[9px] text-white/35 uppercase tracking-wider mb-1">Total</p>
              <p className="text-sm font-bold" style={{ color: '#f9a8d4', fontVariantNumeric: 'tabular-nums' }}>{fmt(settlement.julianaPart)}</p>
            </div>
          </div>

          {/* Info casal total */}
          <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-white/30 text-xs">Casal (total)</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold" style={{ color: '#67e8f9', fontVariantNumeric: 'tabular-nums' }}>{fmt(settlement.casalTotal)}</span>
              <span className="text-white/20 text-xs">÷ 2 =</span>
              <span className="text-xs font-semibold" style={{ color: '#67e8f9', fontVariantNumeric: 'tabular-nums' }}>{fmt(casalHalf)}</span>
              <span className="text-white/20 text-xs">p/ pessoa</span>
            </div>
          </div>
        </div>

        {/* Add transaction CTA */}
        <Link
          href="/lancamentos/novo"
          className="flex items-center justify-center gap-2 rounded-2xl py-4 font-semibold text-white transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #ec4899, #f472b6)' }}
        >
          <span className="text-xl font-light">+</span>
          <span>Adicionar lançamento</span>
        </Link>

        {/* Lançamentos recentes */}
        <div>
          <p className="text-white/30 text-xs uppercase tracking-widest px-1 mb-3">Lançamentos recentes</p>
          <TransactionList transactions={transactions.slice(0, 10)} />
        </div>
      </div>

      <BottomNav role="operator" />
    </>
  );
}
