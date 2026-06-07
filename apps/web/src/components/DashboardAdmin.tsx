'use client';

import Link from 'next/link';
import { calculateInvoiceSettlement } from '@i2fin/core';
import type { Transaction } from '@i2fin/schema';
import { BottomNav } from './BottomNav';
import { TransactionList } from './TransactionList';
import { LogoutButton } from './LogoutButton';
import { DonutSplit } from './charts/DonutSplit';
import { Sparkline } from './charts/Sparkline';
import { BillsCard, type Bill } from './BillsCard';
import { QuickActions } from './QuickActions';
import type { ProfileScope } from '@/lib/profile-scope';

interface DashboardMetrics {
  faturaTotal: number;
  aPagarTotal: number;
  aPagarCount: number;
  aReceberTotal: number;
  saldoContas: number;
}

interface UpcomingItem {
  id: string;
  description: string;
  due_day: number;
  amount: number;
  dueDateStr: string;
}

interface Props {
  profile: { name: string; role: string; household_id: string };
  transactions: Transaction[];
  incomeRecords: Array<{ kind: string; amount: number }>;
  month: string;
  cycle?: { start: string; end: string; closingDate: string; referenceMonth: string };
  upcoming?: UpcomingItem[];
  bills?: Bill[];
  scope?: ProfileScope;
  metrics?: DashboardMetrics;
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

function fmtCycleLabel(start: string, end: string): string {
  const [sy, sm, sd] = start.split('-');
  const [ey, em, ed] = end.split('-');
  return `${sd}/${sm} → ${ed}/${em}`;
}

export function DashboardAdmin({ profile, transactions, incomeRecords, month, cycle, upcoming = [], bills = [], scope = 'tudo', metrics }: Props) {
  const settlement = calculateInvoiceSettlement(transactions, month);

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
      <div className="relative px-5 md:px-8 pt-14 md:pt-8 pb-6 overflow-hidden page-container">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.18) 0%, transparent 70%)' }} />
        <div className="flex items-center justify-between mb-1">
          <span className="text-white/40 text-xs uppercase tracking-widest capitalize">
            Fatura {monthLabel}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.25)' }}>
              admin
            </span>
            <LogoutButton />
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">Olá, {firstName} 👋</h1>
        {cycle && (
          <p className="text-white/30 text-[10px] mt-2 font-mono">
            Ciclo {fmtCycleLabel(cycle.start, cycle.end)} · fecha {cycle.closingDate.split('-').reverse().slice(0,2).join('/')}
          </p>
        )}
      </div>

      <div className="px-4 md:px-8 pb-28 md:pb-12 space-y-3 page-container fade-up-stagger">

        {/* Ações rápidas — atalhos pra o que Iremar mais usa */}
        {metrics && (
          <QuickActions
            scope={scope}
            faturaTotal={metrics.faturaTotal}
            aPagarCount={metrics.aPagarCount}
            aPagarTotal={metrics.aPagarTotal}
            aReceberTotal={metrics.aReceberTotal}
            saldoContas={metrics.saldoContas}
          />
        )}

        {/* Alerta sem responsável */}
        {unassigned > 0 && (
          <Link href="/categorizar"
            className="rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-[0.98] cursor-pointer lift-hover"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <span className="text-xl">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-300 text-sm">{unassigned} sem responsável</p>
              <p className="text-amber-400/60 text-xs mt-0.5">Toque aqui para categorizar →</p>
            </div>
            <span className="text-amber-300 text-base flex-shrink-0">›</span>
          </Link>
        )}

        {/* Hero — total fatura + split donut (desktop) */}
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-3">
          <div className="rounded-3xl p-5 md:p-7 relative overflow-hidden" style={glass}>
            <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(59,130,246,0.12), transparent 70%)' }} />
            {(() => {
              // Soma TOTAL bruta (todos os gastos, mesmo não-categorizados)
              const totalBruto = transactions
                .filter(t => t.amount < 0)
                .reduce((s, t) => s + Math.abs(t.amount), 0);
              const totalCategorized = transactions.filter(t => t.responsible !== 'unassigned').length;
              const totalCount = transactions.length;
              const isPartial = unassigned > 0 && settlement.totalFatura === 0;

              return (
                <>
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-1">
                    {isPartial ? 'Fatura (pendente de categorização)' : 'Total da fatura'}
                  </p>
                  <p
                    className="text-4xl md:text-5xl font-bold tabular"
                    style={{ color: isPartial ? '#fbbf24' : 'white' }}
                  >
                    {fmt(isPartial ? totalBruto : settlement.totalFatura)}
                  </p>
                  <p className="text-white/30 text-xs mt-2">
                    {isPartial
                      ? `${totalCount} lançamentos · ${unassigned} aguardando categorização`
                      : `${totalCategorized} lançamentos categorizados`}
                  </p>
                </>
              );
            })()}
            {/* Sparkline placeholder: usa splits como série proxy (visual). */}
            <div className="mt-4 hidden md:block">
              <Sparkline
                data={[
                  Math.max(1, settlement.totalFatura * 0.6),
                  Math.max(1, settlement.totalFatura * 0.7),
                  Math.max(1, settlement.totalFatura * 0.55),
                  Math.max(1, settlement.totalFatura * 0.85),
                  Math.max(1, settlement.totalFatura * 0.78),
                  Math.max(1, settlement.totalFatura),
                ]}
                width={320}
                height={48}
                color="#60a5fa"
              />
            </div>
          </div>

          {/* Donut split — só em xl+ (no mobile, espaço é precioso) */}
          <div
            className="rounded-3xl p-5 hidden xl:flex flex-col items-center justify-center"
            style={glass}
          >
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-3">Distribuição</p>
            <DonutSplit
              size={170}
              thickness={20}
              centerLabel="Total"
              centerValue={fmt(settlement.totalFatura)}
              slices={[
                { label: 'Iremar', value: settlement.iremarPart, color: 'var(--accent-iremar)' },
                { label: 'Juliana', value: settlement.julianaPart, color: 'var(--accent-juliana)' },
                { label: 'i2', value: settlement.i2Part, color: 'var(--accent-i2)' },
              ]}
            />
            <div className="grid grid-cols-3 gap-2 mt-4 w-full text-center">
              <Legend color="var(--accent-iremar)" label="Iremar" />
              <Legend color="var(--accent-juliana)" label="Juliana" />
              <Legend color="var(--accent-i2)" label="i2" />
            </div>
          </div>
        </div>

        {/* Equação Iremar + Juliana — lado-a-lado em md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <EquacaoCard
            nome="Iremar"
            pessoal={iremarOwn}
            casalHalf={casalHalf}
            total={settlement.iremarPart}
            accentColor="var(--accent-iremar)"
            accentBg="rgba(59,130,246,0.08)"
            accentBorder="rgba(59,130,246,0.2)"
          />
          <EquacaoCard
            nome="Juliana"
            pessoal={julianaOwn}
            casalHalf={casalHalf}
            total={settlement.julianaPart}
            accentColor="var(--accent-juliana)"
            accentBg="rgba(236,72,153,0.08)"
            accentBorder="rgba(236,72,153,0.2)"
          />
        </div>

        {/* Casal + i2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
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
          <a href="/empresa" className="rounded-2xl p-4 block transition-all active:scale-[0.97] lift-hover" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'rgba(252,211,77,0.7)' }}>i2 Soluções 🏢</p>
            <p className="text-base font-bold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(settlement.i2Part)}</p>
            <p className="text-[10px] mt-1.5" style={{ color: 'rgba(245,158,11,0.5)' }}>Ver empresa ›</p>
          </a>
        </div>

        {/* Juliana deve transferir + Entradas — lado-a-lado em md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-2xl p-4" style={glass}>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Juliana deve transferir</p>
            <p className="text-2xl font-bold tabular" style={{ color: '#34d399' }}>{fmt(settlement.julianaPart)}</p>
            {julianaTransf > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-white/50">Transferido:</span>
                <span className="text-sm font-semibold tabular" style={{ color: julianaTransf >= settlement.julianaPart ? '#34d399' : '#f87171' }}>
                  {fmt(julianaTransf)} {julianaTransf >= settlement.julianaPart ? '✅' : '⏳'}
                </span>
              </div>
            )}
          </div>

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
        </div>

        {/* Contas a pagar do mês — atrasados, hoje, a vencer */}
        <BillsCard bills={bills} accent="var(--accent-iremar)" />

        {/* Lançamentos recentes */}
        <div>
          <p className="text-white/30 text-xs uppercase tracking-widest px-1 mb-3">Últimos lançamentos</p>
          <TransactionList transactions={transactions.slice(0, 15)} />
        </div>
      </div>

      <BottomNav role="admin" name={profile.name} scope={scope} />
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
      <div className="flex items-start justify-between mb-3 gap-2 min-w-0">
        <p className="text-xs uppercase tracking-wider font-semibold flex-shrink-0" style={{ color: accentColor }}>{nome}</p>
        <p className="text-xl font-bold text-white truncate" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(total)}</p>
      </div>

      {/* Equação: pessoal + casal÷2 = total (com min-w-0 e operadores sutis) */}
      <div className="flex items-stretch gap-1">
        {/* Gastos pessoais */}
        <div className="flex-1 min-w-0 rounded-xl px-2 py-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <p className="text-[9px] text-white/35 uppercase tracking-wider mb-0.5">Pessoal</p>
          <p className="text-xs font-semibold truncate" style={{ color: accentColor, fontVariantNumeric: 'tabular-nums' }}>{fmt(pessoal)}</p>
        </div>

        <span className="text-white/25 text-xs font-light flex-shrink-0 self-center px-0.5">+</span>

        {/* Metade casal */}
        <div className="flex-1 min-w-0 rounded-xl px-2 py-2 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <p className="text-[9px] text-white/35 uppercase tracking-wider mb-0.5">Casal ÷ 2</p>
          <p className="text-xs font-semibold truncate" style={{ color: '#67e8f9', fontVariantNumeric: 'tabular-nums' }}>{fmt(casalHalf)}</p>
        </div>

        <span className="text-white/25 text-xs font-light flex-shrink-0 self-center px-0.5">=</span>

        {/* Total */}
        <div className="flex-1 min-w-0 rounded-xl px-2 py-2 text-center" style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${accentBorder}` }}>
          <p className="text-[9px] text-white/35 uppercase tracking-wider mb-0.5">Total</p>
          <p className="text-xs font-bold text-white truncate" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(total)}</p>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="text-[10px]" style={{ color: 'var(--text-2)' }}>{label}</span>
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
