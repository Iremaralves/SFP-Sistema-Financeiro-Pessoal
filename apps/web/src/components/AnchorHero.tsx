'use client';

import type { ProfileScope } from '@/lib/profile-scope';

interface Props {
  scope: ProfileScope;
  /** Total da fatura aberta do cartão (PF) */
  faturaTotal: number;
  /** Saldo consolidado das contas (sem cartão de crédito) — relevante em Empresa e Tudo */
  saldoContas: number;
  /** Ciclo da fatura — usado no subtítulo do modo Pessoal */
  cycle?: { start: string; end: string; closingDate: string };
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function fmtCycleLabel(start: string, end: string): string {
  const [, sm, sd] = start.split('-');
  const [, em, ed] = end.split('-');
  return `${sd}/${sm} → ${ed}/${em}`;
}

/**
 * AnchorHero — o NÚMERO grande no topo do dashboard.
 *
 * Princípio "Hierarquia Radical" (Olivia, doc 03): uma única resposta
 * dominante na tela. Iremar abre o app, vê o número que importa, decide.
 *
 * O número muda conforme o escopo ativo:
 *   - Pessoal  → Total da fatura do cartão (o que mais consultam)
 *   - Empresa  → Saldo da conta i2 (o que dispara decisões de pagamento)
 *   - Tudo     → Saldo consolidado das contas líquidas (sem cartão)
 */
export function AnchorHero({ scope, faturaTotal, saldoContas, cycle }: Props) {
  // Configuração por escopo
  const config = (() => {
    if (scope === 'pessoal') {
      return {
        label: 'Fatura do cartão',
        value: faturaTotal,
        accent: '#a5b4fc',
        glow: 'rgba(99,102,241,0.15)',
        sublabel: cycle ? `Ciclo ${fmtCycleLabel(cycle.start, cycle.end)} · fecha ${cycle.closingDate.split('-').reverse().slice(0,2).join('/')}` : null,
        sign: -1, // exibe como dívida (vermelho/neutro)
      };
    }
    if (scope === 'empresa') {
      return {
        label: 'Saldo total i2 Soluções',
        value: saldoContas,
        accent: '#fbbf24',
        glow: 'rgba(245,158,11,0.18)',
        sublabel: 'Operacional (Inter PJ) + reserva/cofre',
        sign: 1,
      };
    }
    // 'tudo'
    return {
      label: 'Saldo consolidado',
      value: saldoContas,
      accent: '#34d399',
      glow: 'rgba(16,185,129,0.15)',
      sublabel: 'PF + PJ · contas líquidas (sem cartão)',
      sign: 1,
    };
  })();

  const isPositive = config.sign > 0;

  return (
    <div
      className="relative rounded-3xl px-5 py-6 md:px-8 md:py-8 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Glow radial */}
      <div
        className="absolute top-0 right-0 w-56 h-56 pointer-events-none"
        style={{ background: `radial-gradient(circle at 100% 0%, ${config.glow}, transparent 70%)` }}
      />

      <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">
        {config.label}
      </p>
      <p
        className="text-5xl md:text-6xl font-bold leading-none tracking-tight"
        style={{
          color: 'white',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {isPositive ? '' : ''}{fmt(Math.abs(config.value))}
      </p>
      {config.sublabel && (
        <p className="text-white/35 text-xs mt-3" style={{ color: config.accent + 'b3' }}>
          {config.sublabel}
        </p>
      )}
    </div>
  );
}
