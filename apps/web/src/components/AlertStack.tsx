'use client';

import Link from 'next/link';

interface Props {
  overdueCount: number;
  overdueTotal: number;
  unassignedCount: number;
  cartaoEstourou: boolean;   // parte do Iremar passou do teto do cartão
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

/**
 * Pilha de alertas condicionais, ordenados por gravidade. Zona 0 do dashboard.
 * Só renderiza o que for verdadeiro; se nada, retorna null (mês limpo = tela já abre na decisão).
 */
export function AlertStack({ overdueCount, overdueTotal, unassignedCount, cartaoEstourou }: Props) {
  const bands: { key: string; href: string; bg: string; border: string; color: string; icon: string; text: string }[] = [];

  if (overdueCount > 0) {
    bands.push({
      key: 'overdue', href: '/compromissos',
      bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#f87171', icon: '🔴',
      text: `${overdueCount} conta${overdueCount > 1 ? 's' : ''} atrasada${overdueCount > 1 ? 's' : ''} · ${fmt(overdueTotal)}`,
    });
  }
  if (cartaoEstourou) {
    bands.push({
      key: 'teto', href: '#cartao',
      bg: 'rgba(251,191,36,0.1)', border: 'rgba(245,158,11,0.3)', color: '#fbbf24', icon: '🟡',
      text: 'Cartão passou do seu teto — segura os gastos',
    });
  }
  if (unassignedCount > 0) {
    bands.push({
      key: 'unassigned', href: '/categorizar',
      bg: 'rgba(251,191,36,0.08)', border: 'rgba(245,158,11,0.25)', color: '#fcd34d', icon: '🏷️',
      text: `${unassignedCount} lançamento${unassignedCount > 1 ? 's' : ''} sem responsável`,
    });
  }

  if (bands.length === 0) return null;

  return (
    <div className="space-y-2">
      {bands.map(b => (
        <Link key={b.key} href={b.href}
          className="rounded-2xl px-4 py-3 flex items-center gap-3 transition-all active:scale-[0.98]"
          style={{ background: b.bg, border: `1px solid ${b.border}` }}>
          <span className="text-lg">{b.icon}</span>
          <p className="flex-1 min-w-0 text-sm font-semibold" style={{ color: b.color }}>{b.text}</p>
          <span className="text-base flex-shrink-0" style={{ color: b.color }}>›</span>
        </Link>
      ))}
    </div>
  );
}
