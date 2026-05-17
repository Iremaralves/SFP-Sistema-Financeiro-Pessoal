'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { actionSalvarResponsavel, actionBuscarNaoCategorizados } from './actions';

const OPCOES = [
  { value: 'juliana', label: 'Juliana',     accent: '#ec4899', bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.4)' },
  { value: 'iremar',  label: 'Iremar',      accent: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.4)'  },
  { value: 'casal',   label: 'Casal',       accent: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   border: 'rgba(6,182,212,0.4)'   },
  { value: 'i2',      label: 'i2 Soluções', accent: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)'  },
];

interface Tx { id: string; description: string; amount: number; occurred_on: string }

interface Props {
  totalFlagged: number;
}

export function CategorizarFlow({ totalFlagged }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [iniciou, setIniciou] = useState(false);
  const [itens, setItens] = useState<Tx[]>([]);
  const [indice, setIndice] = useState(0);
  const [concluido, setConcluido] = useState(false);
  const [selecionado, setSelecionado] = useState<string | null>(null);

  function fmt(n: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(n));
  }

  function fmtData(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  async function iniciar() {
    startTransition(async () => {
      const lista = await actionBuscarNaoCategorizados();
      setItens(lista);
      setIniciou(true);
    });
  }

  async function categorizar(responsible: string) {
    const tx = itens[indice];
    if (!tx) return;
    setSelecionado(responsible);

    startTransition(async () => {
      await actionSalvarResponsavel(tx.id, responsible);
      await new Promise(r => setTimeout(r, 250)); // feedback visual breve

      if (indice + 1 >= itens.length) {
        setConcluido(true);
      } else {
        setIndice(i => i + 1);
        setSelecionado(null);
      }
    });
  }

  // ── Concluído ────────────────────────────────────────────────────────────
  if (concluido) {
    return (
      <div className="rounded-2xl p-5 text-center space-y-3" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
        <p className="text-4xl">🎉</p>
        <p className="text-emerald-400 font-semibold">Tudo categorizado!</p>
        <p className="text-white/40 text-sm">{itens.length} lançamento{itens.length !== 1 ? 's' : ''} categorizados</p>
        <button
          onClick={() => { router.push('/dashboard'); router.refresh(); }}
          className="w-full py-3.5 rounded-2xl font-semibold text-white transition-all active:scale-95 mt-2"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
        >
          Ver dashboard
        </button>
      </div>
    );
  }

  // ── CTA para iniciar ─────────────────────────────────────────────────────
  if (!iniciou) {
    return (
      <div className="rounded-2xl p-4" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl mt-0.5">📋</span>
          <div>
            <p className="text-amber-300 font-semibold text-sm">
              {totalFlagged} lançamento{totalFlagged !== 1 ? 's' : ''} sem responsável
            </p>
            <p className="text-amber-400/60 text-xs mt-0.5">
              Precisam ser categorizados para o cálculo ficar correto
            </p>
          </div>
        </div>
        <button
          onClick={iniciar}
          disabled={isPending}
          className="w-full py-3.5 rounded-2xl font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}
        >
          {isPending ? 'Carregando...' : '✓ Categorizar agora'}
        </button>
      </div>
    );
  }

  // ── Carregando lista ─────────────────────────────────────────────────────
  if (itens.length === 0) {
    return (
      <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-white/40 text-sm">Carregando lançamentos...</p>
      </div>
    );
  }

  // ── Card de categorização ────────────────────────────────────────────────
  const tx = itens[indice]!;
  const progresso = ((indice) / itens.length) * 100;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
      {/* Barra de progresso */}
      <div className="h-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progresso}%`, background: 'linear-gradient(90deg, #3b82f6, #6366f1)' }}
        />
      </div>

      <div className="p-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {/* Progresso */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/40 text-xs uppercase tracking-wider">Categorizar</p>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
            {indice + 1} de {itens.length}
          </span>
        </div>

        {/* Lançamento */}
        <div className="rounded-xl p-4 mb-4 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <p className="text-white font-semibold text-base leading-snug mb-1">{tx.description}</p>
          <p className="text-2xl font-bold text-white mt-1" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(tx.amount)}</p>
          <p className="text-white/30 text-xs mt-1">{fmtData(tx.occurred_on)}</p>
        </div>

        {/* Pergunta */}
        <p className="text-white/50 text-sm text-center mb-3">De quem é essa compra?</p>

        {/* Botões de escolha */}
        <div className="grid grid-cols-2 gap-2.5">
          {OPCOES.map((opt) => (
            <button
              key={opt.value}
              onClick={() => categorizar(opt.value)}
              disabled={isPending}
              className="py-4 rounded-2xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
              style={{
                background: selecionado === opt.value ? opt.bg : 'rgba(255,255,255,0.06)',
                border: `1px solid ${selecionado === opt.value ? opt.border : 'rgba(255,255,255,0.1)'}`,
                color: selecionado === opt.value ? opt.accent : 'rgba(255,255,255,0.6)',
                transform: selecionado === opt.value ? 'scale(0.97)' : 'scale(1)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Pular (pra frente, vira unassigned por enquanto) */}
        {indice < itens.length - 1 && (
          <button
            onClick={() => { setIndice(i => i + 1); setSelecionado(null); }}
            disabled={isPending}
            className="w-full mt-3 py-2 text-xs text-white/25 hover:text-white/40 transition-colors"
          >
            Pular por agora →
          </button>
        )}
      </div>
    </div>
  );
}
