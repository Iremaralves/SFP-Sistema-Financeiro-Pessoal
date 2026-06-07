'use client';

import Link from 'next/link';
import type { ProfileScope } from '@/lib/profile-scope';

interface QuickAction {
  href: string;
  icon: string;
  label: string;
  badge?: string;
  badgeColor?: string;
  gradient: string;
  border: string;
}

interface Props {
  scope: ProfileScope;
  /** Total da fatura aberta do cartão (PF) */
  faturaTotal?: number;
  /** Quantidade de contas a pagar pendentes (boleto/pix não pagos) */
  aPagarCount?: number;
  /** Valor total a pagar pendente */
  aPagarTotal?: number;
  /** Receitas previstas do mês (income_records) */
  aReceberTotal?: number;
  /** Saldo total das contas (positivo) */
  saldoContas?: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);
}

export function QuickActions({
  scope,
  faturaTotal = 0,
  aPagarCount = 0,
  aPagarTotal = 0,
  aReceberTotal = 0,
  saldoContas = 0,
}: Props) {
  // Define os 4 atalhos por escopo
  const actions: QuickAction[] = scope === 'empresa'
    ? [
        {
          href: '/empresa',
          icon: '🏢',
          label: 'DRE i2',
          badge: aReceberTotal ? fmt(aReceberTotal) : undefined,
          badgeColor: '#34d399',
          gradient: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.04))',
          border: 'rgba(245,158,11,0.3)',
        },
        {
          href: '/compromissos',
          icon: '📅',
          label: 'A pagar',
          badge: aPagarCount ? `${aPagarCount} · ${fmt(aPagarTotal)}` : 'OK',
          badgeColor: aPagarCount > 0 ? '#fbbf24' : '#34d399',
          gradient: 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(251,191,36,0.04))',
          border: 'rgba(251,191,36,0.3)',
        },
        {
          href: '/contas',
          icon: '🏦',
          label: 'Contas',
          badge: saldoContas ? fmt(saldoContas) : undefined,
          badgeColor: '#a5b4fc',
          gradient: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.04))',
          border: 'rgba(99,102,241,0.3)',
        },
        {
          href: '/empresa/notas',
          icon: '🧾',
          label: 'Notas Fiscais',
          gradient: 'linear-gradient(135deg, rgba(52,211,153,0.18), rgba(52,211,153,0.04))',
          border: 'rgba(52,211,153,0.3)',
        },
      ]
    : [
        {
          href: '/lancamentos',
          icon: '💳',
          label: 'Cartão',
          badge: faturaTotal ? fmt(faturaTotal) : undefined,
          badgeColor: '#a5b4fc',
          gradient: 'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(99,102,241,0.05))',
          border: 'rgba(99,102,241,0.35)',
        },
        {
          href: '/compromissos',
          icon: '📅',
          label: 'A pagar',
          badge: aPagarCount ? `${aPagarCount} · ${fmt(aPagarTotal)}` : 'OK',
          badgeColor: aPagarCount > 0 ? '#fbbf24' : '#34d399',
          gradient: 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(251,191,36,0.04))',
          border: 'rgba(251,191,36,0.3)',
        },
        {
          href: '/empresa',
          icon: '📥',
          label: 'A receber',
          badge: aReceberTotal ? fmt(aReceberTotal) : undefined,
          badgeColor: '#34d399',
          gradient: 'linear-gradient(135deg, rgba(52,211,153,0.18), rgba(52,211,153,0.04))',
          border: 'rgba(52,211,153,0.3)',
        },
        {
          href: '/contas',
          icon: '🏦',
          label: 'Contas',
          badge: saldoContas ? fmt(saldoContas) : undefined,
          badgeColor: '#a5b4fc',
          gradient: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(59,130,246,0.04))',
          border: 'rgba(59,130,246,0.3)',
        },
      ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
      {actions.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="rounded-2xl p-4 transition-all active:scale-[0.97] lift-hover flex flex-col justify-between min-h-[100px]"
          style={{ background: a.gradient, border: `1px solid ${a.border}` }}
        >
          <div className="flex items-start justify-between">
            <span className="text-2xl leading-none">{a.icon}</span>
            <span className="text-white/30 text-base leading-none">›</span>
          </div>
          <div className="mt-3">
            <p className="text-white/80 text-xs font-semibold leading-tight">{a.label}</p>
            {a.badge && (
              <p className="text-sm font-bold mt-0.5 leading-tight tabular" style={{ color: a.badgeColor ?? 'white' }}>
                {a.badge}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
