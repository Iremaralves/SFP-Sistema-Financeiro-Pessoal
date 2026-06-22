'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setBudgetTeto } from '@/app/_actions/budget';

interface Props {
  teto: number;          // teto de gasto no cartão (parte do Iremar) — default 2.500
  faturaParte: number;   // parte do Iremar na fatura atual (gastos dele + metade casal)
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export function BudgetGauge({ teto, faturaParte }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(teto));
  const [err, setErr] = useState('');

  // Semáforo do cartão: quanto da minha parte já comprometi vs o teto que defini.
  const usado = faturaParte;
  const disponivel = teto - usado;
  const pctUsado = teto > 0 ? Math.min(150, (usado / teto) * 100) : 0;
  const pctBarra = Math.min(100, pctUsado);

  const estado =
    usado >= teto         ? { emoji: '🔴', label: 'Freia', color: '#f87171', glow: 'rgba(239,68,68,0.16)' }
    : pctUsado >= 80      ? { emoji: '🟡', label: 'Atenção', color: '#fbbf24', glow: 'rgba(245,158,11,0.16)' }
    : { emoji: '🟢', label: 'Tranquilo', color: '#34d399', glow: 'rgba(16,185,129,0.16)' };

  function salvarTeto() {
    setErr('');
    const v = parseFloat(draft.replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(v) || v <= 0) { setErr('Valor inválido (ex: 2500)'); return; }
    startTransition(async () => {
      const res = await setBudgetTeto(v);
      if (res.ok) { setEditing(false); router.refresh(); }
      else setErr(res.error ?? 'Erro');
    });
  }

  return (
    <section className="rounded-3xl p-5 md:p-6 relative overflow-hidden"
      style={{ background: `radial-gradient(150% 130% at 100% 0%, ${estado.glow}, transparent 58%), rgba(255,255,255,0.045)`, border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
      <p className="text-white/40 text-[11px] uppercase tracking-widest font-semibold mb-1">Posso usar o cartão?</p>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-4xl md:text-5xl font-bold tabular tracking-tight" style={{ color: disponivel >= 0 ? 'white' : '#f87171' }}>
            {disponivel >= 0 ? fmt(disponivel) : `− ${fmt(Math.abs(disponivel))}`}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${estado.color}22`, color: estado.color, border: `1px solid ${estado.color}55` }}>
              {estado.emoji} {estado.label}
            </span>
            <span className="text-white/40 text-[11px]">{disponivel >= 0 ? 'ainda pode gastar no cartão' : 'acima do seu teto'}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tabular" style={{ color: estado.color }}>{pctUsado.toFixed(0)}%</div>
          <div className="text-white/30 text-[10px] uppercase tracking-wider">do teto</div>
        </div>
      </div>

      {/* Barra: usado vs teto */}
      <div className="h-3 rounded-full overflow-hidden mt-4" style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pctBarra}%`, background: usado >= teto ? 'linear-gradient(90deg,#ef4444,#f87171)' : `linear-gradient(90deg, ${estado.color}, ${estado.color})` }} />
      </div>

      {/* Teto editável */}
      <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-white/40 text-xs">Sua parte da fatura <b className="text-white/70 tabular">{fmt(usado)}</b> · teto</span>
        {editing ? (
          <div className="flex items-center gap-2">
            <input type="text" inputMode="decimal" value={draft} onChange={e => setDraft(e.target.value)} autoFocus
              className="w-20 text-right rounded-lg px-2 py-1 text-white text-sm tabular focus:outline-none"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(59,130,246,0.4)' }} />
            <button onClick={salvarTeto} disabled={isPending} className="text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>{isPending ? '...' : 'OK'}</button>
            {err && <span className="text-[10px] text-red-400">{err}</span>}
          </div>
        ) : (
          <button onClick={() => { setDraft(String(teto)); setEditing(true); }} className="text-sm font-bold tabular text-white flex items-center gap-1.5">
            {fmt(teto)} <span className="text-white/30 text-xs">✎</span>
          </button>
        )}
      </div>
    </section>
  );
}
