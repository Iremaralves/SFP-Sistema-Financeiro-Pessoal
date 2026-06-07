'use client';

import { useState, useTransition } from 'react';
import { actionDarBaixa, actionDesfazerBaixa } from './actions';

interface Props {
  recurringId: string;
  amount: number;
  referenceMonth: string;   // ex: "2025-05"
  initialPaid?: boolean;    // se já veio do servidor como pago
}

function fmtCurrencyInput(value: number) {
  return value.toFixed(2);
}

export function DarBaixaButton({ recurringId, amount, referenceMonth, initialPaid = false }: Props) {
  const [isPending, startTransition] = useTransition();
  const [paid, setPaid] = useState(initialPaid);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Estados do form
  const [paidAmount, setPaidAmount] = useState(fmtCurrencyInput(amount));
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));

  function abrirDialog() {
    setError(null);
    setPaidAmount(fmtCurrencyInput(amount));
    setPaidOn(new Date().toISOString().slice(0, 10));
    setOpen(true);
  }

  function confirmar() {
    setError(null);
    const parsed = parseFloat(paidAmount.replace(',', '.'));
    if (Number.isNaN(parsed) || parsed <= 0) {
      setError('Valor inválido');
      return;
    }
    startTransition(async () => {
      const res = await actionDarBaixa(recurringId, amount, referenceMonth, {
        paidAmount: parsed,
        paidOn,
      });
      if (res.ok) {
        setPaid(true);
        setOpen(false);
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
    <>
      <button
        onClick={abrirDialog}
        disabled={isPending}
        className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-40 flex-shrink-0"
        style={{
          background: 'rgba(99,102,241,0.18)',
          color: '#a5b4fc',
          border: '1px solid rgba(99,102,241,0.3)',
        }}
      >
        Dar baixa
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={() => !isPending && setOpen(false)}
          />

          {/* Dialog */}
          <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[92%] max-w-sm rounded-2xl p-5 space-y-4"
            style={{
              background: 'rgba(12,12,20,0.98)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            }}
          >
            <div>
              <p className="text-white text-base font-bold">Confirmar pagamento</p>
              <p className="text-white/40 text-xs mt-0.5">Ajuste o valor e a data se necessário</p>
            </div>

            <div className="space-y-3">
              {/* Valor pago */}
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Valor pago</span>
                <div className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span className="text-white/40 text-sm">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="flex-1 bg-transparent text-white text-base font-semibold outline-none"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  />
                </div>
                <p className="text-[10px] text-white/30 mt-1">Cadastrado: R$&nbsp;{amount.toFixed(2).replace('.', ',')}</p>
              </label>

              {/* Data pagamento */}
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Data do pagamento</span>
                <input
                  type="date"
                  value={paidOn}
                  onChange={(e) => setPaidOn(e.target.value)}
                  className="mt-1 w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </label>
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmar}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                {isPending ? '...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
