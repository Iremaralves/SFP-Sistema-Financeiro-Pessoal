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

export function DashboardOperator({ profile, transactions, month }: Props) {
  const settlement = calculateSettlement(transactions, month);
  const monthLabel = new Date(`${month}-01`).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  // Juliana's indicator: how is spending trending?
  const julianaRatio = settlement.totalFatura > 0 ? (settlement.julianaPart / settlement.totalFatura) * 100 : 0;

  return (
    <>
      {/* Header */}
      <div className="bg-slate-900 px-4 pt-12 pb-6 border-b border-slate-800">
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-400 text-sm capitalize">{monthLabel}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Olá, {profile.name.split(' ')[0]} 👋</h1>
      </div>

      <div className="px-4 py-4 space-y-3">

        {/* Total fatura */}
        <div className="bg-slate-800/50 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Total da fatura</p>
          <p className="text-3xl font-bold text-slate-100">{fmt(settlement.totalFatura)}</p>
          <div className="mt-3 bg-slate-700/50 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full transition-all"
              style={{ width: `${julianaRatio.toFixed(0)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">Sua parte: {julianaRatio.toFixed(0)}% da fatura</p>
        </div>

        {/* Juliana's part */}
        <div className="bg-pink-900/20 border border-pink-800/30 rounded-2xl p-4">
          <p className="text-pink-400/70 text-xs mb-1 uppercase tracking-wider">Sua parte a pagar</p>
          <p className="text-2xl font-bold text-pink-300">{fmt(settlement.julianaPart)}</p>
          <p className="text-xs text-pink-400/60 mt-1">
            Seus gastos {fmt(settlement.iremarPart > 0 ? settlement.julianaPart - settlement.casalTotal / 2 : settlement.julianaPart)} + metade do casal {fmt(settlement.casalTotal / 2)}
          </p>
        </div>

        {/* Breakdown */}
        <div className="bg-slate-800/50 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-3 uppercase tracking-wider">Divisão da fatura</p>
          <div className="space-y-2">
            <BreakdownRow label="Seus gastos" amount={settlement.julianaPart - settlement.casalTotal / 2} color="text-pink-400" />
            <BreakdownRow label="Casal (sua metade)" amount={settlement.casalTotal / 2} color="text-cyan-400" />
            <BreakdownRow label="Gastos Iremar" amount={settlement.iremarPart} color="text-blue-400" />
            <BreakdownRow label="i2 Soluções" amount={settlement.i2Part} color="text-yellow-400" />
          </div>
        </div>

        {/* Add transaction CTA */}
        <Link
          href="/lancamentos/novo"
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-2xl py-4 font-semibold text-white transition-colors"
        >
          <span className="text-xl">+</span>
          <span>Adicionar lançamento</span>
        </Link>

        {/* Recent transactions (only Juliana's view) */}
        <div>
          <p className="text-slate-400 text-xs mb-3 uppercase tracking-wider px-1">Lançamentos recentes</p>
          <TransactionList transactions={transactions.slice(0, 10)} />
        </div>
      </div>

      <BottomNav role="operator" />
    </>
  );
}

function BreakdownRow({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className={`font-medium text-sm ${color}`}>
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(amount))}
      </span>
    </div>
  );
}
