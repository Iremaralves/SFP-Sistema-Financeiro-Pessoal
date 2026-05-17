'use client';

import type { Transaction } from '@i2fin/schema';

const RESPONSIBLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  iremar:     { label: 'Iremar',   color: '#93c5fd', bg: 'rgba(59,130,246,0.12)' },
  juliana:    { label: 'Juliana',  color: '#f9a8d4', bg: 'rgba(236,72,153,0.12)' },
  casal:      { label: 'Casal',    color: '#67e8f9', bg: 'rgba(6,182,212,0.12)'  },
  i2:         { label: 'i2',       color: '#fcd34d', bg: 'rgba(245,158,11,0.12)' },
  unassigned: { label: '?',        color: '#fca5a5', bg: 'rgba(239,68,68,0.12)'  },
};

interface Props {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 text-white/25 text-sm">
        Nenhum lançamento ainda
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {transactions.map((tx) => {
        const cfg = RESPONSIBLE_CONFIG[tx.responsible] ?? RESPONSIBLE_CONFIG.unassigned!;
        const isCredit = tx.amount < 0;
        return (
          <div
            key={tx.id}
            className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Responsible dot */}
            <span
              className="flex-shrink-0 w-2 h-2 rounded-full mt-0.5"
              style={{ background: cfg.color }}
            />

            {/* Description + date */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate leading-tight">{tx.description}</p>
              <p className="text-white/30 text-xs mt-0.5">
                {new Date(tx.occurredOn + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </p>
            </div>

            {/* Badge + amount */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ color: cfg.color, background: cfg.bg }}
              >
                {cfg.label}
              </span>
              <span
                className="text-sm font-semibold min-w-[70px] text-right"
                style={{ color: isCredit ? '#34d399' : '#f1f5f9', fontVariantNumeric: 'tabular-nums' }}
              >
                {isCredit ? '' : ''}R$&nbsp;{Math.abs(tx.amount).toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
