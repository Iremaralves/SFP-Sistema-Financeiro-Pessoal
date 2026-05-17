'use client';

import { calculateSettlement } from '@i2fin/core';
import type { Transaction } from '@i2fin/schema';
import { BottomNav } from './BottomNav';
import { TransactionList } from './TransactionList';
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

  const julianaRatio = settlement.totalFatura > 0 ? (settlement.julianaPart / settlement.totalFatura) * 100 : 0;
  const firstName = profile.name.split(' ')[0];

  // juliana-only expenses = julianaPart - casalTotal/2
  const julianaOwn = Math.max(0, settlement.julianaPart - settlement.casalTotal / 2);

  return (
    <>
      {/* Header */}
      <div className="relative px-5 pt-14 pb-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(236,72,153,0.18) 0%, transparent 70%)' }} />
        <span className="text-white/40 text-xs uppercase tracking-widest capitalize">{monthLabel}</span>
        <h1 className="text-2xl font-bold text-white mt-1">Olá, {firstName} 👋</h1>
      </div>

      <div className="px-4 pb-28 space-y-3">

        {/* Hero — total fatura */}
        <div className="rounded-3xl p-5 relative overflow-hidden" style={glass}>
          <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(236,72,153,0.12), transparent 70%)' }} />
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Total da fatura</p>
          <p className="text-4xl font-bold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(settlement.totalFatura)}</p>
          {/* Progress bar */}
          <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(julianaRatio, 100).toFixed(0)}%`, background: 'linear-gradient(90deg, #ec4899, #f472b6)' }}
            />
          </div>
          <p className="text-white/30 text-xs mt-2">Sua parte: {julianaRatio.toFixed(0)}% da fatura</p>
        </div>

        {/* Sua parte — destaque */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)' }}>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(244,114,182,0.7)' }}>Sua parte a pagar</p>
          <p className="text-3xl font-bold" style={{ color: '#f9a8d4', fontVariantNumeric: 'tabular-nums' }}>{fmt(settlement.julianaPart)}</p>
          <div className="flex gap-4 mt-3">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Seus gastos</p>
              <p className="text-sm font-semibold text-pink-300" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(julianaOwn)}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Metade casal</p>
              <p className="text-sm font-semibold text-cyan-300" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(settlement.casalTotal / 2)}</p>
            </div>
          </div>
        </div>

        {/* Divisão breakdown */}
        <div className="rounded-2xl p-4" style={glass}>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Divisão da fatura</p>
          <div className="space-y-3">
            <BreakdownRow label="Seus gastos" amount={julianaOwn} accent="#ec4899" />
            <BreakdownRow label="Casal (sua metade)" amount={settlement.casalTotal / 2} accent="#06b6d4" />
            <BreakdownRow label="Gastos Iremar" amount={settlement.iremarPart} accent="#3b82f6" />
            <BreakdownRow label="i2 Soluções" amount={settlement.i2Part} accent="#f59e0b" />
          </div>
        </div>

        {/* Add transaction CTA */}
        <Link
          href="/lancamentos/novo"
          className="flex items-center justify-center gap-2 rounded-2xl py-4 font-semibold text-white transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
        >
          <span className="text-xl font-light">+</span>
          <span>Adicionar lançamento</span>
        </Link>

        {/* Recent transactions */}
        <div>
          <p className="text-white/30 text-xs uppercase tracking-widest px-1 mb-3">Lançamentos recentes</p>
          <TransactionList transactions={transactions.slice(0, 10)} />
        </div>
      </div>

      <BottomNav role="operator" />
    </>
  );
}

function BreakdownRow({ label, amount, accent }: { label: string; amount: number; accent: string }) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
        <span className="text-white/60 text-sm">{label}</span>
      </div>
      <span className="font-semibold text-sm text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(amount))}
      </span>
    </div>
  );
}
