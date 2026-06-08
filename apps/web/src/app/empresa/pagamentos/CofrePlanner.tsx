'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { actionCriarTransferencia } from '../../transferencias/actions';

interface Resgate { id: string; name: string; balance: number; tirar: number }

interface Props {
  saldoInterPJ: number;
  totalAPagar: number;
  deficit: number;
  interPJId: string;
  interPJName: string;
  resgates: Resgate[];
  cofreInsuficiente: boolean;
  restante: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export function CofrePlanner({
  saldoInterPJ, totalAPagar, deficit, interPJId, interPJName,
  resgates, cofreInsuficiente, restante,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const aResgatar = resgates.filter(r => r.tirar > 0.001);

  // ── Caso 1: saldo cobre tudo ──────────────────────────────────────────
  if (deficit <= 0.001) {
    return (
      <div className="rounded-2xl p-4 flex items-center gap-3"
        style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <span className="text-2xl">🟢</span>
        <div className="flex-1 min-w-0">
          <p className="text-emerald-300 text-sm font-semibold">Saldo cobre os pagamentos</p>
          <p className="text-emerald-400/60 text-xs mt-0.5">
            {interPJName} tem {fmt(saldoInterPJ)} · sobra {fmt(saldoInterPJ - totalAPagar)} após pagar tudo
          </p>
        </div>
      </div>
    );
  }

  function transferir(r: Resgate) {
    setError(null);
    startTransition(async () => {
      const res = await actionCriarTransferencia({
        from_account_id: r.id,
        to_account_id: interPJId,
        amount: r.tirar,
        occurred_on: new Date().toISOString().slice(0, 10),
        description: `Resgate p/ folha i2: ${r.name} → ${interPJName}`,
      });
      if (res.ok) {
        setDone(d => ({ ...d, [r.id]: true }));
        router.refresh();
      } else {
        setError(res.error ?? 'Erro ao transferir');
      }
    });
  }

  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{
        background: cofreInsuficiente ? 'rgba(239,68,68,0.07)' : 'rgba(245,158,11,0.07)',
        border: `1px solid ${cofreInsuficiente ? 'rgba(239,68,68,0.22)' : 'rgba(245,158,11,0.25)'}`,
      }}>
      {/* Resumo da conta */}
      <div className="flex items-start gap-3">
        <span className="text-2xl">{cofreInsuficiente ? '🔴' : '🏦'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">
            {cofreInsuficiente ? 'Cofre não cobre tudo' : 'Precisa resgatar do cofre'}
          </p>
          <div className="text-xs text-white/50 mt-1 space-y-0.5">
            <div className="flex justify-between">
              <span>{interPJName}</span>
              <span className="tabular">{fmt(saldoInterPJ)}</span>
            </div>
            <div className="flex justify-between">
              <span>A pagar</span>
              <span className="tabular text-white/70">− {fmt(totalAPagar)}</span>
            </div>
            <div className="flex justify-between font-semibold" style={{ color: cofreInsuficiente ? '#f87171' : '#fbbf24' }}>
              <span>{cofreInsuficiente ? 'Falta resgatar' : 'Tirar do cofre'}</span>
              <span className="tabular">{fmt(deficit)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Linhas de resgate por cofre */}
      <div className="space-y-2 pt-1">
        {aResgatar.map(r => (
          <div key={r.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-base">📦</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{r.name}</p>
              <p className="text-white/30 text-[10px]">saldo {fmt(r.balance)}</p>
            </div>
            <span className="text-sm font-bold tabular" style={{ color: '#fbbf24' }}>
              {fmt(r.tirar)}
            </span>
            {done[r.id] ? (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-md flex-shrink-0"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                ✓ feito
              </span>
            ) : (
              <button
                onClick={() => transferir(r)}
                disabled={isPending}
                className="text-[10px] font-semibold px-2.5 py-1.5 rounded-md flex-shrink-0 transition-all active:scale-95 disabled:opacity-40"
                style={{ background: 'rgba(245,158,11,0.18)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.35)' }}>
                {isPending ? '...' : 'Transferir'}
              </button>
            )}
          </div>
        ))}
      </div>

      {cofreInsuficiente && (
        <p className="text-red-300/80 text-[11px] leading-relaxed">
          ⚠️ Mesmo esvaziando os cofres, ainda faltam <strong>{fmt(restante)}</strong> pra cobrir os
          pagamentos. Considere antecipar um recebível ou negociar prazo.
        </p>
      )}

      {error && (
        <p className="text-red-400 text-xs">⚠️ {error}</p>
      )}

      <p className="text-white/25 text-[10px] leading-relaxed">
        Transferir cria o registro do cofre → {interPJName} e atualiza os saldos. Depois, dê baixa
        em cada pagamento abaixo conforme for pagando.
      </p>
    </div>
  );
}
