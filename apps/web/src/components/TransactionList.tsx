'use client';

import type { Transaction } from '@i2fin/schema';
import Link from 'next/link';
import { useState } from 'react';

const RESPONSIBLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  iremar:     { label: 'Iremar',   color: '#93c5fd', bg: 'rgba(59,130,246,0.12)' },
  juliana:    { label: 'Juliana',  color: '#f9a8d4', bg: 'rgba(236,72,153,0.12)' },
  casal:      { label: 'Casal',    color: '#67e8f9', bg: 'rgba(6,182,212,0.12)'  },
  i2:         { label: 'i2',       color: '#fcd34d', bg: 'rgba(245,158,11,0.12)' },
  unassigned: { label: '?',        color: '#fca5a5', bg: 'rgba(239,68,68,0.12)'  },
};

interface Props {
  transactions: Transaction[];
  showSearch?: boolean;
}

export function TransactionList({ transactions, showSearch = false }: Props) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? transactions.filter((tx) =>
        tx.description.toLowerCase().includes(query.toLowerCase())
      )
    : transactions;

  return (
    <div className="space-y-3">
      {/* Busca — só aparece quando showSearch=true */}
      {showSearch && (
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar lançamento..."
            className="w-full rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-white/25 text-sm">
          {query ? `Nenhum lançamento com "${query}"` : 'Nenhum lançamento ainda'}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((tx) => {
            const cfg = RESPONSIBLE_CONFIG[tx.responsible] ?? RESPONSIBLE_CONFIG.unassigned!;
            const isCredit = tx.amount < 0;
            return (
              <Link
                key={tx.id}
                href={`/lancamentos/${tx.id}`}
                className="rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all active:scale-[0.98] group"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Responsible dot */}
                <span
                  className="flex-shrink-0 w-2 h-2 rounded-full mt-0.5"
                  style={{ background: cfg.color }}
                />

                {/* Description + date */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate leading-tight group-hover:text-white/90">
                    {tx.description}
                  </p>
                  <p className="text-white/30 text-xs mt-0.5">
                    {new Date(tx.occurredOn + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>

                {/* Badge + amount + edit chevron */}
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
      )}
    </div>
  );
}
