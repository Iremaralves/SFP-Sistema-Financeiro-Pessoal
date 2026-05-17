'use client';

import { useState, useTransition } from 'react';
import { actionDarBaixa } from './actions';

interface Props {
  recurringId: string;
  amount: number;
}

export function DarBaixaButton({ recurringId, amount }: Props) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handle() {
    startTransition(async () => {
      const res = await actionDarBaixa(recurringId, amount);
      if (res.ok) setDone(true);
    });
  }

  if (done) {
    return (
      <span
        className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0"
        style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}
      >
        ✓ Pago
      </span>
    );
  }

  return (
    <button
      onClick={handle}
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
