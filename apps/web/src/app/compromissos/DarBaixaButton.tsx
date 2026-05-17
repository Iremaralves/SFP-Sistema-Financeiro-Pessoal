'use client';

import { useState, useTransition } from 'react';
import { actionDarBaixa, actionDesfazerBaixa } from './actions';

interface Props {
  recurringId: string;
  amount: number;
  referenceMonth: string;   // ex: "2025-05"
  initialPaid?: boolean;    // se já veio do servidor como pago
}

export function DarBaixaButton({ recurringId, amount, referenceMonth, initialPaid = false }: Props) {
  const [isPending, startTransition] = useTransition();
  const [paid, setPaid] = useState(initialPaid);
  const [error, setError] = useState<string | null>(null);

  function handleDarBaixa() {
    setError(null);
    startTransition(async () => {
      const res = await actionDarBaixa(recurringId, amount, referenceMonth);
      if (res.ok) {
        setPaid(true);
      } else {
        setError(res.error);
      }
    });
  }

  function handleDesfazer() {
    setError(null);
    startTransition(async () => {
      const res = await actionDesfazerBaixa(recurringId, referenceMonth);
      if (res.ok) setPaid(false);
    });
  }

  if (error) {
    return (
      <span
        className="text-[10px] font-medium px-2 py-1 rounded-lg flex-shrink-0"
        style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
      >
        Erro — tente novamente
      </span>
    );
  }

  if (paid) {
    return (
      <button
        onClick={handleDesfazer}
        disabled={isPending}
        title="Desfazer baixa"
        className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-40 flex-shrink-0 group"
        style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
      >
        <span className="group-hover:hidden">✓ Pago</span>
        <span className="hidden group-hover:inline">↩ Desfazer</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleDarBaixa}
      disabled={isPending}
      className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-40 flex-shrink-0"
      style={{
        background: 'rgba(99,102,241,0.18)',
        color: '#a5b4fc',
        border: '1px solid rgba(99,102,241,0.3)',
      }}
    >
      {isPending ? '…' : 'Dar baixa'}
    </button>
  );
}
