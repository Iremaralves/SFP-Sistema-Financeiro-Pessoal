'use client';

import { useState, useTransition } from 'react';
import { actionRegistrarFaturamento, actionExcluirFaturamento } from './actions';

interface FaturamentoRecord {
  id: string;
  amount: number;
  description: string;
}

interface Props {
  referenceMonth: string; // "YYYY-MM"
  existing: FaturamentoRecord | null;
}

export function FaturamentoForm({ referenceMonth, existing }: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [description, setDescription] = useState(existing?.description ?? 'Faturamento mensal i2 Soluções');
  const [isPending, startTransition] = useTransition();

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await actionRegistrarFaturamento(
        parseFloat(amount.replace(',', '.')),
        description,
        referenceMonth,
      );
      setOpen(false);
    });
  }

  function handleDelete() {
    if (!existing) return;
    startTransition(async () => {
      await actionExcluirFaturamento(existing.id);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95"
        style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}
      >
        {existing ? `✎ ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(existing.amount)}` : '+ Registrar faturamento'}
      </button>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-2 mt-2">
      <input
        type="text"
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="w-full rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
        placeholder="Descrição"
        required
      />
      <input
        type="number"
        step="0.01"
        min="0.01"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        className="w-full rounded-xl px-3 py-2.5 text-white text-lg font-bold focus:outline-none"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', fontVariantNumeric: 'tabular-nums' }}
        placeholder="0,00"
        required
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
        >
          {isPending ? 'Salvando…' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2.5 rounded-xl text-sm text-white/40"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          Cancelar
        </button>
        {existing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="px-3 py-2.5 rounded-xl text-sm text-red-400 disabled:opacity-40"
            style={{ background: 'rgba(239,68,68,0.08)' }}
          >
            ✕
          </button>
        )}
      </div>
    </form>
  );
}
