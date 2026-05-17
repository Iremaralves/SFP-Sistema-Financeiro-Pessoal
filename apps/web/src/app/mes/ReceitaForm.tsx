'use client';

import { useRef, useState, useTransition } from 'react';
import { registrarReceita, excluirReceita } from './actions';

interface IncomeRecord {
  id: string;
  kind: string;
  description: string;
  amount: number;
}

const KIND_LABELS: Record<string, string> = {
  pro_labore: 'Pró-labore',
  i2_reimbursement: 'Reembolso i2',
  juliana_transfer: 'Transferência Juliana',
  other: 'Outro',
};

const inputStyle = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.1)',
} as React.CSSProperties;

export function ReceitaForm({ month, incomeRows }: { month: string; incomeRows: IncomeRecord[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  function fmt(n: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const fd = new FormData(formRef.current!);
    fd.set('mes', month);
    startTransition(async () => {
      try {
        await registrarReceita(fd);
        formRef.current?.reset();
        setOpen(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao registrar');
      }
    });
  }

  function handleExcluir(id: string) {
    startTransition(async () => {
      await excluirReceita(id);
    });
  }

  return (
    <div className="space-y-2.5">
      {/* Registered income rows */}
      {incomeRows.map((r) => (
        <div key={r.id} className="flex justify-between items-center">
          <span className="text-sm text-white/60">
            {KIND_LABELS[r.kind] ?? r.kind}
            {r.description && r.description !== r.kind && (
              <span className="text-white/30 ml-1.5">· {r.description}</span>
            )}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tabular" style={{ color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>
              {fmt(r.amount)}
            </span>
            <button
              onClick={() => handleExcluir(r.id)}
              disabled={pending}
              className="text-white/25 hover:text-red-400 text-xs transition-colors w-5 h-5 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      {incomeRows.length === 0 && !open && (
        <p className="text-sm text-white/30">Nenhuma receita registrada.</p>
      )}

      {/* Form */}
      {open ? (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">Tipo</label>
            <select
              name="kind"
              required
              className="w-full text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none"
              style={{ ...inputStyle, colorScheme: 'dark' }}
            >
              <option value="pro_labore">Pró-labore</option>
              <option value="juliana_transfer">Transferência Juliana</option>
              <option value="i2_reimbursement">Reembolso i2</option>
              <option value="other">Outro</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">Valor (R$)</label>
            <input
              name="valor"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0,00"
              className="w-full text-white text-sm rounded-xl px-3 py-2.5 placeholder-white/25 focus:outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1.5">Descrição (opcional)</label>
            <input
              name="descricao"
              type="text"
              placeholder="Ex: Pró-labore Abril/2026"
              className="w-full text-white text-sm rounded-xl px-3 py-2.5 placeholder-white/25 focus:outline-none"
              style={inputStyle}
            />
          </div>
          {error && (
            <p className="text-xs text-red-400 rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.1)' }}>
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 font-semibold text-sm py-2.5 rounded-xl text-white disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              {pending ? 'Salvando…' : 'Registrar'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-sm py-2.5 rounded-xl transition-colors text-white/40 hover:text-white/70"
          style={{ border: '1px dashed rgba(255,255,255,0.12)' }}
        >
          + Registrar receita
        </button>
      )}
    </div>
  );
}
