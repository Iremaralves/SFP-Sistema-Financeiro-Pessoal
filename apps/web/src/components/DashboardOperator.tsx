'use client';

import { calculateInvoiceSettlement } from '@i2fin/core';
import type { Transaction } from '@i2fin/schema';
import { BottomNav } from './BottomNav';
import { LogoutButton } from './LogoutButton';
import Link from 'next/link';
import type { ProfileScope } from '@/lib/profile-scope';

interface DashboardMetrics {
  faturaTotal: number;
  aPagarTotal: number;
  aPagarCount: number;
  aReceberTotal: number;
  saldoContas: number;
}

interface Props {
  profile: { name: string; role: string; household_id: string };
  transactions: Transaction[];
  month: string;
  bills?: unknown[];
  scope?: ProfileScope;
  metrics?: DashboardMetrics;
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function fmtDay(iso: string) {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  const mes = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][Number(m) - 1] ?? '';
  return `${d}/${mes}`;
}

// Mapa de responsável → rótulo + cores (tag)
const RESP: Record<string, { label: string; color: string; bg: string; seg: string }> = {
  juliana: { label: 'Juliana', color: '#f9a8d4', bg: 'rgba(236,72,153,0.15)', seg: 'linear-gradient(90deg,#ec4899,#f472b6)' },
  casal:   { label: 'Casal',   color: '#67e8f9', bg: 'rgba(6,182,212,0.15)',  seg: 'linear-gradient(90deg,#06b6d4,#22d3ee)' },
  iremar:  { label: 'Iremar',  color: '#93c5fd', bg: 'rgba(59,130,246,0.15)', seg: 'linear-gradient(90deg,#3b82f6,#6366f1)' },
  i2:      { label: 'i2',      color: '#fbbf24', bg: 'rgba(245,158,11,0.15)', seg: 'linear-gradient(90deg,#f59e0b,#d97706)' },
};

const glassCard = {
  background: 'rgba(255,255,255,0.045)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
} as React.CSSProperties;

export function DashboardOperator({ profile, transactions, month, scope = 'pessoal' }: Props) {
  const settlement = calculateInvoiceSettlement(transactions, month);
  const [lbl_y, lbl_m] = month.split('-').map(Number);
  const monthLabel = new Date(lbl_y, lbl_m - 1, 1).toLocaleString('pt-BR', { month: 'long' });

  const firstName = profile.name.split(' ')[0] || 'Juliana';

  // ── Progresso de categorização ──────────────────────────────────────────
  const total = transactions.length;
  const unassigned = transactions.filter(t => t.responsible === 'unassigned').length;
  const done = total - unassigned;
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 100;

  // ── Divisão por responsável (4 baldes derivados do settlement) ────────────
  const casalTotal = settlement.casalTotal;
  const casalHalf = casalTotal / 2;
  const julianaOwn = Math.max(0, settlement.julianaPart - casalHalf);
  const iremarOwn = Math.max(0, settlement.iremarPart - casalHalf);
  const i2Total = settlement.i2Part;
  const totalFatura = settlement.totalFatura;

  const buckets = [
    { key: 'juliana', sub: 'só seu',              value: julianaOwn },
    { key: 'casal',   sub: `dividido · ${fmt(casalHalf)} cada`, value: casalTotal },
    { key: 'iremar',  sub: 'só dele',             value: iremarOwn },
    { key: 'i2',      sub: 'reembolso empresa',   value: i2Total },
  ].filter(b => b.value > 0);

  const pct = (v: number) => totalFatura > 0 ? (v / totalFatura) * 100 : 0;

  // ── Últimos categorizados ─────────────────────────────────────────────────
  const recent = transactions
    .filter(t => t.responsible !== 'unassigned' && t.amount < 0)
    .slice(0, 4);

  return (
    <>
      {/* Header — travada em Pessoal */}
      <div className="relative px-5 md:px-8 pt-14 md:pt-8 pb-5 overflow-hidden page-container">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(236,72,153,0.18) 0%, transparent 70%)' }} />
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full text-white"
            style={{ background: 'linear-gradient(135deg,#ec4899,#f472b6)', boxShadow: '0 6px 16px -8px rgba(236,72,153,0.8)' }}
            title="Você tem acesso só aos dados pessoais">
            🔒 Pessoal
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ background: 'rgba(236,72,153,0.14)', color: '#f9a8d4', border: '1px solid rgba(236,72,153,0.28)' }}>
              operadora
            </span>
            <LogoutButton />
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mt-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
          Boa noite, <span className="text-white">{firstName}</span> 👋
        </h1>
        <p className="text-white/35 text-xs mt-1 capitalize">Fatura de {monthLabel} aberta</p>
      </div>

      <div className="px-4 md:px-8 pb-28 md:pb-12 space-y-3 page-container fade-up-stagger md:max-w-2xl">

        {/* CTA Nº1: CATEGORIZAR (com progresso) */}
        <Link href="/categorizar"
          className="flex items-center gap-3.5 rounded-3xl p-4 transition-all active:scale-[0.98] lift-hover"
          style={{ background: 'radial-gradient(140% 120% at 0% 0%, rgba(236,72,153,0.2), transparent 60%), rgba(255,255,255,0.05)', border: '1px solid rgba(236,72,153,0.32)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#ec4899,#f472b6)', boxShadow: '0 8px 20px -10px rgba(236,72,153,0.8)' }}>
            🏷️
          </div>
          <div className="flex-1 min-w-0">
            {unassigned > 0 ? (
              <>
                <p className="text-white font-bold text-[15px]">{unassigned} lançamento{unassigned > 1 ? 's' : ''} pra categorizar</p>
                <p className="text-white/50 text-xs mt-0.5">{done} de {total} já feitos · falta pouco</p>
              </>
            ) : (
              <>
                <p className="text-white font-bold text-[15px]">Tudo categorizado ✓</p>
                <p className="text-white/50 text-xs mt-0.5">{total} lançamentos · revisar?</p>
              </>
            )}
            <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg,#ec4899,#f472b6)' }} />
            </div>
          </div>
          <span className="text-pink-300 text-xl flex-shrink-0">›</span>
        </Link>

        {/* HERO: DIVISÃO DA FATURA por responsável */}
        <section className="rounded-3xl p-5 md:p-6 relative overflow-hidden" style={glassCard}>
          <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(236,72,153,0.1), transparent 70%)' }} />
          <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1 capitalize">Divisão da fatura · {monthLabel}</p>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-3xl md:text-4xl font-bold text-white tabular tracking-tight">{fmt(totalFatura)}</p>
            <span className="text-white/30 text-[11px] flex-shrink-0">total · {total} lançam.</span>
          </div>

          {/* Barra de proporção */}
          {totalFatura > 0 && (
            <div className="flex h-3 rounded-full overflow-hidden my-4" style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }}>
              {buckets.map(b => (
                <span key={b.key} style={{ width: `${pct(b.value)}%`, background: RESP[b.key]!.seg }} />
              ))}
            </div>
          )}

          {/* Linhas por responsável */}
          <div className="space-y-0">
            {buckets.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-4">Categorize os lançamentos pra ver a divisão.</p>
            ) : buckets.map((b, i) => {
              const r = RESP[b.key]!;
              return (
                <div key={b.key} className="flex items-center gap-3 py-2.5"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="w-3 h-3 rounded flex-shrink-0" style={{ background: r.seg }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{r.label}</p>
                    <p className="text-white/35 text-[11px]">{b.sub}</p>
                  </div>
                  <span className="text-[15px] font-bold tabular flex-shrink-0" style={{ color: r.color }}>{fmt(b.value)}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* SEU FECHAMENTO */}
        <section className="rounded-3xl p-5 relative overflow-hidden" style={{ ...glassCard, background: 'radial-gradient(140% 120% at 100% 0%, rgba(236,72,153,0.14), transparent 60%), rgba(255,255,255,0.045)' }}>
          <p className="text-white/40 text-[10px] uppercase tracking-widest">Seu fechamento</p>
          <p className="text-3xl font-bold text-white tabular tracking-tight mt-1">{fmt(settlement.julianaPart)}</p>
          <p className="text-white/45 text-xs mt-1.5 leading-relaxed">
            <span style={{ color: '#f9a8d4' }}>{fmt(julianaOwn)}</span> (só seu) + <span style={{ color: '#f9a8d4' }}>{fmt(casalHalf)}</span> (metade do casal)<br />
            É o quanto fica no seu nome na contabilidade do mês.
          </p>
        </section>

        {/* ÚLTIMOS CATEGORIZADOS */}
        {recent.length > 0 && (
          <>
            <div className="flex items-center justify-between px-1 pt-1">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">Últimos categorizados</p>
              <Link href="/lancamentos" className="text-white/30 text-[11px]">ver todos ›</Link>
            </div>
            <section className="rounded-2xl p-2" style={glassCard}>
              {recent.map((t, i) => {
                const r = RESP[t.responsible] ?? RESP.iremar!;
                return (
                  <Link key={t.id ?? i} href={`/lancamentos/${t.id}`}
                    className="flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all active:scale-[0.99]"
                    style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.06)' }}>🛒</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[13px] font-medium truncate">{t.description}</p>
                      <p className="text-white/35 text-[11px]">{fmtDay(t.occurredOn)}</p>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0" style={{ background: r.bg, color: r.color }}>{r.label}</span>
                    <span className="text-[13px] font-semibold tabular flex-shrink-0 text-white/70">{fmt(Math.abs(t.amount))}</span>
                  </Link>
                );
              })}
            </section>
          </>
        )}

        {/* Ações */}
        <Link href="/lancamentos/novo"
          className="flex items-center justify-center gap-2 rounded-2xl py-4 font-semibold text-white transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #ec4899, #f472b6)' }}>
          <span className="text-xl font-light">+</span>
          <span>Adicionar um gasto da família</span>
        </Link>
      </div>

      <BottomNav role="operator" name={profile.name} scope={scope} />
    </>
  );
}
