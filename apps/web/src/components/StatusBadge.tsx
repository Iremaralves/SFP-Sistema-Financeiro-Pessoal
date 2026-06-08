'use client';

/**
 * Badge de status unificado — usado em BillsCard, CompromissoRow, TransactionList.
 *
 * Antes: cada lugar declarava sua tabela própria com rgba ligeiramente diferentes
 * (0.10 vs 0.12 vs 0.15). Inconsistência visual + duplicação de código.
 *
 * Agora: fonte única da verdade. Mudar uma cor aqui propaga.
 */

export type Status =
  | 'overdue'   // atrasado
  | 'today'     // vence hoje
  | 'upcoming'  // a vencer
  | 'paid'      // pago
  | 'pending'   // pendente genérico
  | 'reconciled'// conciliado/quitado
  | 'cancelled';

interface StatusMeta {
  label: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
}

export const STATUS: Record<Status, StatusMeta> = {
  overdue:    { label: 'Atrasado',   emoji: '🔴', color: '#f87171', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.28)'  },
  today:      { label: 'Vence hoje', emoji: '🟡', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.28)' },
  upcoming:   { label: 'A vencer',   emoji: '🟢', color: '#34d399', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.28)' },
  paid:       { label: 'Pago',       emoji: '✅', color: '#34d399', bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.22)' },
  pending:    { label: 'Pendente',   emoji: '⏳', color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.22)' },
  reconciled: { label: 'Conciliado', emoji: '🔵', color: '#60a5fa', bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.22)' },
  cancelled:  { label: 'Cancelado',  emoji: '⊘',  color: '#64748b', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.18)' },
};

interface Props {
  status: Status;
  size?: 'xs' | 'sm' | 'md';
  /** Esconde emoji (usa só pill colorida) */
  hideEmoji?: boolean;
}

export function StatusBadge({ status, size = 'sm', hideEmoji = false }: Props) {
  const meta = STATUS[status];
  const classes = size === 'xs'
    ? 'text-[9px] px-1.5 py-0.5 gap-1'
    : size === 'md'
    ? 'text-xs px-2.5 py-1 gap-1.5'
    : 'text-[10px] px-2 py-0.5 gap-1';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${classes}`}
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
    >
      {!hideEmoji && <span>{meta.emoji}</span>}
      <span className="uppercase tracking-wider">{meta.label}</span>
    </span>
  );
}

/** Helper pra pegar só a cor (útil pra bordas/acentos sem renderizar a pill) */
export function statusColor(status: Status): string {
  return STATUS[status].color;
}
