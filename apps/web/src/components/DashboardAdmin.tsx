'use client';

import { calculateSettlement } from '@i2fin/core';
import type { Transaction } from '@i2fin/schema';
import { BottomNav } from './BottomNav';
import { TransactionList } from './TransactionList';

interface Props {
  profile: { name: string; role: string; household_id: string };
  transactions: Transaction[];
  incomeRecords: Array<{ kind: string; amount: number }>;
  month: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export function DashboardAdmin({ profile, transactions, incomeRecords, month }: Props) {
  const settlement = calculateSettlement(transactions, month);

  const proLabore = incomeRecords.filter((r) => r.kind === 'pro_labore').reduce((s, r) => s + r.amount, 0);
  const julianaTransf = incomeRecords.filter((r) => r.kind === 'juliana_transfer').reduce((s, r) => s + r.amount, 0);
  const otherIncome = incomeRecords.filter((r) => r.kind !== 'pro_labore' && r.kind !== 'juliana_transfer').reduce((s, r) => s + r.amount, 0);

  const unassigned = transactions.filter((t) => t.responsible === 'unassigned').length;

  const monthLabel = new Date(`${month}-01`).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <>
      {/* Header */}
      <div className="bg-slate-900 px-4 pt-12 pb-6 border-b border-slate-800">
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-400 text-sm capitalize">{monthLabel}</span>
          <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full">admin</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Olá, {profile.name.split(' ')[0]} 👋</h1>
      </div>

      <div className="px-4 py-4 space-y-3">

        {/* Unassigned alert */}
        {unassigned > 0 && (
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-300 text-sm">{unassigned} sem responsável</p>
              <p className="text-amber-400/70 text-xs">Categorize via CLI: i2fin categorizar</p>
            </div>
          </div>
        )}

        {/* Fatura split */}
        <div className="bg-slate-800/50 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-3 uppercase tracking-wider">Fatura do mês</p>
          <div className="text-3xl font-bold text-slate-100 mb-4">{fmt(settlement.totalFatura)}</div>
          <div className="grid grid-cols-2 gap-3">
            <SplitCard label="Iremar" amount={settlement.iremarPart} color="blue" />
            <SplitCard label="Juliana" amount={settlement.julianaPart} color="pink" />
            <SplitCard label="Casal" amount={settlement.casalTotal} color="cyan" subtitle="total" />
            <SplitCard label="i2 Soluções" amount={settlement.i2Part} color="yellow" />
          </div>
        </div>

        {/* Juliana deve */}
        <div className="bg-slate-800/50 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-2 uppercase tracking-wider">Juliana deve transferir</p>
          <p className="text-2xl font-bold text-emerald-400">{fmt(settlement.julianaPart)}</p>
          {julianaTransf > 0 && (
            <p className="text-sm text-emerald-600 mt-1">
              Transferido: {fmt(julianaTransf)} {julianaTransf >= settlement.julianaPart ? '✅' : '⏳'}
            </p>
          )}
        </div>

        {/* Iremar income */}
        {(proLabore > 0 || otherIncome > 0) && (
          <div className="bg-slate-800/50 rounded-2xl p-4">
            <p className="text-slate-400 text-xs mb-3 uppercase tracking-wider">Entradas Iremar</p>
            {proLabore > 0 && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-400">Pró-labore i2</span>
                <span className="text-emerald-400 font-medium">{fmt(proLabore)}</span>
              </div>
            )}
            {julianaTransf > 0 && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-400">Recebido Juliana</span>
                <span className="text-emerald-400 font-medium">{fmt(julianaTransf)}</span>
              </div>
            )}
            {otherIncome > 0 && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-400">Outras receitas</span>
                <span className="text-emerald-400 font-medium">{fmt(otherIncome)}</span>
              </div>
            )}
          </div>
        )}

        {/* Recent transactions */}
        <div>
          <p className="text-slate-400 text-xs mb-3 uppercase tracking-wider px-1">Últimos lançamentos</p>
          <TransactionList transactions={transactions.slice(0, 15)} />
        </div>
      </div>

      <BottomNav role="admin" />
    </>
  );
}

function SplitCard({ label, amount, color, subtitle }: {
  label: string;
  amount: number;
  color: 'blue' | 'pink' | 'cyan' | 'yellow';
  subtitle?: string;
}) {
  const colors = {
    blue: 'text-blue-400 bg-blue-900/20',
    pink: 'text-pink-400 bg-pink-900/20',
    cyan: 'text-cyan-400 bg-cyan-900/20',
    yellow: 'text-yellow-400 bg-yellow-900/20',
  };

  return (
    <div className={`rounded-xl p-3 ${colors[color]}`}>
      <p className="text-xs opacity-70 mb-1">{label}{subtitle ? ` (${subtitle})` : ''}</p>
      <p className="font-bold text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}</p>
    </div>
  );
}
