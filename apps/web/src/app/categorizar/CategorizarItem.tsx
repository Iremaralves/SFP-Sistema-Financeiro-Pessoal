'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { actionCategorizarTx } from './actions';

interface Tx {
  id: string;
  description: string;
  amount: number;
  occurred_on: string;
}

type Responsible = 'iremar' | 'juliana' | 'casal' | 'i2';

const OPCOES: Array<{ value: Responsible; label: string; emoji: string; color: string; bg: string }> = [
  { value: 'iremar',  label: 'Iremar',  emoji: '👨', color: 'var(--accent-iremar)',  bg: 'rgba(59,130,246,0.12)' },
  { value: 'juliana', label: 'Juliana', emoji: '👩', color: 'var(--accent-juliana)', bg: 'rgba(236,72,153,0.12)' },
  { value: 'casal',   label: 'Casal',   emoji: '👫', color: '#06b6d4',               bg: 'rgba(6,182,212,0.12)' },
  { value: 'i2',      label: 'i2',      emoji: '🏢', color: 'var(--accent-i2)',      bg: 'rgba(245,158,11,0.12)' },
];

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function fmtDate(s: string) {
  const [, m, d] = s.split('-');
  return `${d}/${m}`;
}

export function CategorizarItem({ tx }: { tx: Tx }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hovered, setHovered] = useState<Responsible | null>(null);
  const [criarRegra, setCriarRegra] = useState(true);
  const [notes, setNotes] = useState('');

  function handleClick(responsible: Responsible) {
    startTransition(async () => {
      const result = await actionCategorizarTx(tx.id, responsible, { criarRegra, notes });
      if (result.ok) {
        router.refresh();
      } else {
        alert(result.error ?? 'Erro ao categorizar');
      }
    });
  }

  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header da transação */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold leading-snug break-words">
            {tx.description}
          </p>
          <p className="text-white/30 text-[10px] mt-1">{fmtDate(tx.occurred_on)} · cartão</p>
        </div>
        <p className="text-base font-bold text-red-400 flex-shrink-0"
          style={{ fontVariantNumeric: 'tabular-nums' }}>
          {fmt(Math.abs(tx.amount))}
        </p>
      </div>

      {/* Nota opcional — contexto sobre o lançamento */}
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Nota (opcional) — ex: presente da vovó, viagem SP"
        maxLength={140}
        className="w-full text-xs rounded-lg px-3 py-2 outline-none transition-all"
        style={{
          background: 'rgba(0,0,0,0.25)',
          border: `1px solid ${notes ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.06)'}`,
          color: 'white',
        }}
      />

      {/* Botões de categorização */}
      <div className="grid grid-cols-4 gap-2">
        {OPCOES.map(op => (
          <button
            key={op.value}
            onClick={() => handleClick(op.value)}
            onMouseEnter={() => setHovered(op.value)}
            onMouseLeave={() => setHovered(null)}
            disabled={isPending}
            className="rounded-xl py-2.5 px-2 flex flex-col items-center gap-0.5 transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: hovered === op.value ? op.bg : 'rgba(0,0,0,0.25)',
              border: `1px solid ${hovered === op.value ? op.color + '50' : 'rgba(255,255,255,0.05)'}`,
            }}
          >
            <span className="text-base">{op.emoji}</span>
            <span className="text-[10px] font-semibold" style={{ color: op.color }}>
              {op.label}
            </span>
          </button>
        ))}
      </div>

      {/* Toggle criar regra */}
      <button
        onClick={() => setCriarRegra(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all"
        style={{
          background: criarRegra ? 'rgba(52,211,153,0.07)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${criarRegra ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)'}`,
        }}
      >
        <span className="flex items-center gap-1.5">
          <span>🔄</span>
          <span style={{ color: criarRegra ? '#34d399' : 'rgba(255,255,255,0.4)' }}>
            Aplicar a próximas importações
          </span>
        </span>
        <span
          className="w-7 h-3.5 rounded-full transition-all flex items-center"
          style={{ background: criarRegra ? '#34d399' : 'rgba(255,255,255,0.15)' }}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-white transition-all ml-0.5"
            style={{ marginLeft: criarRegra ? '16px' : '2px' }} />
        </span>
      </button>
    </div>
  );
}
