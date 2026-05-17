'use client';

import type { Transaction } from '@i2fin/schema';
import Link from 'next/link';

const RESPONSIBLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  iremar:     { label: 'Iremar',   color: '#93c5fd', bg: 'rgba(59,130,246,0.12)' },
  juliana:    { label: 'Juliana',  color: '#f9a8d4', bg: 'rgba(236,72,153,0.12)' },
  casal:      { label: 'Casal',    color: '#67e8f9', bg: 'rgba(6,182,212,0.12)'  },
  i2:         { label: 'i2',       color: '#fcd34d', bg: 'rgba(245,158,11,0.12)' },
  unassigned: { label: '?',        color: '#fca5a5', bg: 'rgba(239,68,68,0.12)'  },
};

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  csv_import:  { label: 'CSV',    color: 'rgba(99,102,241,0.7)'  },
  manual_pwa:  { label: 'App',    color: 'rgba(52,211,153,0.7)'  },
  manual_cli:  { label: 'CLI',    color: 'rgba(251,191,36,0.7)'  },
};

interface Props {
  transactions: Transaction[];
  showSearch?: boolean; // mantido por compatibilidade, a busca agora fica nos Filtros da page
  showMeta?: boolean;   // modo auditoria: exibe origem + data completa
}

export function TransactionList({ transactions, showMeta = false }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-white/25 text-sm">
        Nenhum lançamento encontrado
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {transactions.map((tx) => {
        const cfg = RESPONSIBLE_CONFIG[tx.responsible] ?? RESPONSIBLE_CONFIG.unassigned!;
        const src = SOURCE_CONFIG[tx.source] ?? null;
        const isCredit = tx.amount < 0;

        return (
          <Link
            key={tx.id}
            href={`/lancamentos/${tx.id}`}
            className="rounded-2xl px-4 py-3 flex items-center gap-3 transition-all active:scale-[0.98] group"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Dot do responsável */}
            <span className="flex-shrink-0 w-2 h-2 rounded-full mt-0.5" style={{ background: cfg.color }} />

            {/* Descrição + data (+ origem em modo auditoria) */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate leading-tight group-hover:text-white/90">
                {tx.description}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-white/30 text-xs">
                  {new Date(tx.occurredOn + 'T12:00:00').toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    ...(showMeta ? { year: 'numeric' } : {}),
                  })}
                </p>
                {showMeta && src && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(255,255,255,0.06)', color: src.color }}>
                    {src.label}
                  </span>
                )}
              </div>
            </div>

            {/* Badge responsável + valor + chevron */}
            <div className="flex items-center gap-2 flex-shrink-0">
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
                R$&nbsp;{Math.abs(tx.amount).toFixed(2).replace('.', ',')}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-white/40 transition-colors">
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
