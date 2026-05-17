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

const glass = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
} as React.CSSProperties;

export function DashboardAdmin({ profile, transactions, incomeRecords, month }: Props) {
  const settlement = calculateSettlement(transactions, month);

  const proLabore = incomeRecords.filter((r) => r.kind === 'pro_labore').reduce((s, r) => s + r.amount, 0);
  const julianaTransf = incomeRecords.filter((r) => r.kind === 'juliana_transfer').reduce((s, r) => s + r.amount, 0);
  const otherIncome = incomeRecords.filter((r) => r.kind !== 'pro_labore' && r.kind !== 'juliana_transfer').reduce((s, r) => s + r.amount, 0);

  const unassigned = transactions.filter((t) => t.responsible === 'unassigned').length;

  const [lbl_y, lbl_m] = month.split('-').map(Number);
  const monthLabel = new Date(lbl_y, lbl_m - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  const firstName = profile.name.split(' ')[0];

  return (
    <>
      {/* Header */}
      <div className="relative px-5 pt-14 pb-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.18) 0%, transparent 70%)' }} />
        <div className="flex items-center justify-between mb-1">
          <span className="text-white/40 text-xs uppercase tracking-widest capitalize">{monthLabel}</span>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.25)' }}>
            admin
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-1">Olá, {firstName} 👋</h1>
      </div>

      <div className="px-4 pb-28 space-y-3">

        {/* Unassigned alert */}
        {unassigned > 0 && (
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-300 text-sm">{unassigned} sem responsável</p>
              <p className="text-amber-400/60 text-xs mt-0.5">Categorize via CLI: i2fin categorizar</p>
            </div>
          </div>
        )}

        {/* Hero — total fatura */}
        <div className="rounded-3xl p-5 relative overflow-hidden" style={glass}>
          <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(59,130,246,0.12), transparent 70%)' }} />
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Total da fatura</p>
          <p className="text-4xl font-bold text-white tabular" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(settlement.totalFatura)}</p>
          <p className="text-white/30 text-xs mt-2">{transactions.filter(t => t.responsible !== 'unassigned').length} lançamentos categorizados</p>
        </div>

        {/* Bento 2×2 split grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <BentoCard label="Iremar" amount={settlement.iremarPart} accent="#3b82f6" accentBg="rgba(59,130,246,0.1)" />
          <BentoCard label="Juliana" amount={settlement.julianaPart} accent="#ec4899" accentBg="rgba(236,72,153,0.1)" />
          <BentoCard label="Casal" amount={settlement.casalTotal} accent="#06b6d4" accentBg="rgba(6,182,212,0.1)" subtitle="total" />
          <BentoCard label="i2 Soluções" amount={settlement.i2Part} accent="#f59e0b" accentBg="rgba(245,158,11,0.1)" />
        </div>

        {/* Juliana deve */}
        <div className="rounded-2xl p-4" style={glass}>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Juliana deve transferir</p>
          <p className="text-2xl font-bold tabular" style={{ color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>{fmt(settlement.julianaPart)}</p>
          {julianaTransf > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-white/50">Transferido:</span>
              <span className="text-sm font-semibold" style={{ color: julianaTransf >= settlement.julianaPart ? '#34d399' : '#f87171' }}>
                {fmt(julianaTransf)} {julianaTransf >= settlement.julianaPart ? '✅' : '⏳'}
              </span>
            </div>
          )}
        </div>

        {/* Entradas Iremar */}
        {(proLabore > 0 || otherIncome > 0) && (
          <div className="rounded-2xl p-4" style={glass}>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Entradas Iremar</p>
            <div className="space-y-2">
              {proLabore > 0 && <IncomeRow label="Pró-labore i2" amount={proLabore} />}
              {julianaTransf > 0 && <IncomeRow label="Recebido de Juliana" amount={julianaTransf} />}
              {otherIncome > 0 && <IncomeRow label="Outras receitas" amount={otherIncome} />}
            </div>
          </div>
        )}

        {/* Recent transactions */}
        <div>
          <p className="text-white/30 text-xs uppercase tracking-widest px-1 mb-3">Últimos lançamentos</p>
          <TransactionList transactions={transactions.slice(0, 15)} />
        </div>
      </div>

      <BottomNav role="admin" />
    </>
  );
}

function BentoCard({ label, amount, accent, accentBg, subtitle }: {
  label: string; amount: number; accent: string; accentBg: string; subtitle?: string;
}) {
  return (
    <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: accentBg, border: `1px solid ${accent}25` }}>
      <p className="text-xs font-medium mb-2 opacity-70" style={{ color: accent }}>{label}{subtitle ? ` (${subtitle})` : ''}</p>
      <p className="font-bold text-base text-white tabular leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
      </p>
    </div>
  );
}

function IncomeRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/50 text-sm">{label}</span>
      <span className="text-sm font-semibold tabular" style={{ color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
      </span>
    </div>
  );
}
