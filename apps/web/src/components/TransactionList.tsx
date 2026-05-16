'use client';

import type { Transaction } from '@i2fin/schema';

const RESPONSIBLE_COLORS: Record<string, string> = {
  iremar: 'bg-blue-900/50 text-blue-300',
  juliana: 'bg-pink-900/50 text-pink-300',
  casal: 'bg-cyan-900/50 text-cyan-300',
  i2: 'bg-yellow-900/50 text-yellow-300',
  unassigned: 'bg-red-900/50 text-red-300',
};

const RESPONSIBLE_LABELS: Record<string, string> = {
  iremar: 'Iremar',
  juliana: 'Juliana',
  casal: 'Casal',
  i2: 'i2',
  unassigned: '?',
};

interface Props {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        Nenhum lançamento ainda
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="bg-slate-800/50 rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <p className="text-slate-100 text-sm font-medium truncate">{tx.description}</p>
            <p className="text-slate-500 text-xs mt-0.5">
              {new Date(tx.occurredOn + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full ${RESPONSIBLE_COLORS[tx.responsible] ?? ''}`}>
              {RESPONSIBLE_LABELS[tx.responsible] ?? tx.responsible}
            </span>
            <span className={`text-sm font-semibold ${tx.amount < 0 ? 'text-emerald-400' : 'text-slate-100'}`}>
              {tx.amount < 0 ? '-' : ''}R$ {Math.abs(tx.amount).toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
