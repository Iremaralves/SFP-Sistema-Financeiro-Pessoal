'use client';

import { calculateSettlement } from '@i2fin/core';
import type { Transaction } from '@i2fin/schema';
import { BottomNav } from './BottomNav';
import { TransactionList } from './TransactionList';
import { LogoutButton } from './LogoutButton';

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

  // Gastos pessoais derivados
  const casalHalf = settlement.casalTotal / 2;
  const iremarOwn = Math.max(0, settlement.iremarPart - casalHalf);
  const julianaOwn = Math.max(0, settlement.julianaPart - casalHalf);

  return (
    <>
      {/* Header */}
      <div className="relative px-5 pt-14 pb-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.18) 0%, transparent 70%)' }} />
        <div className="flex items-center justify-between mb-1">
          <span className="text-white/40 text-xs uppercase tracking-widest capitalize">{monthLabel}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.25)' }}>
              admin
            </span>
            <LogoutButton />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mt-1">Olá, {firstName} 👋</h1>
      </div>

      <div className="px-4 pb-28 space-y-3">

        {/* Alerta sem responsável */}
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
          <p className="text-4xl font-bold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(settlement.totalFatura)}</p>
          <p className="text-white/30 text-xs mt-2">{transactions.filter(t => t.responsible !== 'unassigned').length} lançamentos categorizados</p>
        </div>

        {/* Equação Iremar */}
        <EquacaoCard
          nome="Iremar"
          pessoal={iremarOwn}
          casalHalf={casalHalf}
          total={settlement.iremarPart}
          accentColor="#3b82f6"
          accentBg="rgba(59,130,246,0.08)"
          accentBorder="rgba(59,130,246,0.2)"
        />

        {/* Equação Juliana */}
        <EquacaoCard
          nome="Juliana"
          pessoal={julianaOwn}
          casalHalf={casalHalf}
          total={settlement.julianaPart}
          accentColor="#ec4899"
          accentBg="rgba(236,72,153,0.08)"
          accentBorder="rgba(236,72,153,0.2)"
        />

        {/* Casal + i2 */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Casal */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'rgba(103,232,249,0.7)' }}>Casal</p>
            <p className="text-base font-bold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(settlement.casalTotal)}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-[10px] text-white/30">÷ 2 =</span>
              <span className="text-xs font-semibold" style={{ color: '#67e8f9', fontVariantNumeric: 'tabular-nums' }}>{fmt(casalHalf)}</span>
              <span className="text-[10px] text-white/30">p/ pessoa</span>
            </div>
          </div>
          {/* i2 — clicável para /empresa */}
          <a href="/empresa" className="rounded-2xl p-4 block transition-all active:scale-[0.97]" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'rgba(252,211,77,0.7)' }}>i2 Soluções 🏢</p>
            <p className="text-base font-bold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(settlement.i2Part)}</p>
            <p className="text-[10px] mt-1.5" style={{ color: 'rgba(245,158,11,0.5)' }}>Ver empresa ›</p>
          </a>
        </div>

        {/* Juliana deve transferir */}
        <div className="rounded-2xl p-4" style={glass}>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Juliana deve transferir</p>
          <p className="text-2xl font-bold" style={{ color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>{fmt(settlement.julianaPart)}</p>
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

        {/* Lançamentos recentes */}
        <div>
          <p className="text-white/30 text-xs uppercase tracking-widest px-1 mb-3">Últimos lançamentos</p>
          <TransactionList transactions={transactions.slice(0, 15)} />
        </div>
      </div>

      <BottomNav role="admin" />
    </>
  );
}

// ─── Equação visual por pessoa ─────────────────────────────────────────────

function EquacaoCard({
  nome, pessoal, casalHalf, total, accentColor, accentBg, accentBorder,
}: {
  nome: string;
  pessoal: number;
  casalHalf: number;
  total: number;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
}) {
  function fmt(n: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: accentBg, border: `1px solid ${accentBorder}` }}>
      {/* Nome + total em destaque */}
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: accentColor }}>{nome}</p>
        <p className="text-xl font-bold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(total)}</p>
      </div>

      {/* Equação: pessoal + casal÷2 = total */}
      <div className="flex items-center gap-1.5">
        {/* Gastos pessoais */}
        <div className="flex-1 rounded-xl px-3 py-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <p className="text-[9px] text-white/35 uppercase tracking-wider mb-0.5">Pessoal</p>
          <p className="text-sm font-semibold" style={{ color: accentColor, fontVariantNumeric: 'tabular-nums' }}>{fmt(pessoal)}</p>
        </div>

        {/* + */}
        <span className="text-white/30 text-base font-light flex-shrink-0">+</span>

        {/* Metade casal */}
        <div className="flex-1 rounded-xl px-3 py-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <p className="text-[9px] text-white/35 uppercase tracking-wider mb-0.5">Casal ÷ 2</p>
          <p className="text-sm font-semibold" style={{ color: '#67e8f9', fontVariantNumeric: 'tabular-nums' }}>{fmt(casalHalf)}</p>
        </div>

        {/* = */}
        <span className="text-white/30 text-base font-light flex-shrink-0">=</span>

        {/* Total */}
        <div className="flex-1 rounded-xl px-3 py-2 text-center" style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${accentBorder}` }}>
          <p className="text-[9px] text-white/35 uppercase tracking-wider mb-0.5">Total</p>
          <p className="text-sm font-bold" style={{ color: 'white', fontVariantNumeric: 'tabular-nums' }}>{fmt(total)}</p>
        </div>
      </div>
    </div>
  );
}

function IncomeRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/50 text-sm">{label}</span>
      <span className="text-sm font-semibold" style={{ color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
      </span>
    </div>
  );
}
