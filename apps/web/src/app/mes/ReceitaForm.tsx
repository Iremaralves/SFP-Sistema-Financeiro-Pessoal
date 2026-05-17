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
    <div className="space-y-3">
      {/* Receitas registradas */}
      {incomeRows.map((r) => (
        <div key={r.id} className="flex justify-between items-center">
          <span className="text-sm text-slate-400">
            {KIND_LABELS[r.kind] ?? r.kind}
            {r.description && r.description !== r.kind && (
              <span className="text-slate-500 ml-1">· {r.description}</span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-emerald-400">{fmt(r.amount)}</span>
            <button
              onClick={() => handleExcluir(r.id)}
              disabled={pending}
              className="text-slate-600 hover:text-red-400 text-xs transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      {incomeRows.length === 0 && !open && (
        <p className="text-sm text-slate-500">Nenhuma receita registrada.</p>
      )}

      {/* Formulário */}
      {open ? (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-slate-700">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Tipo</label>
            <select
              name="kind"
              required
              className="w-full bg-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
            >
              <option value="pro_labore">Pró-labore</option>
              <option value="juliana_transfer">Transferência Juliana</option>
              <option value="i2_reimbursement">Reembolso i2</option>
              <option value="other">Outro</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Valor (R$)</label>
            <input
              name="valor"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0,00"
              className="w-full bg-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Descrição (opcional)</label>
            <input
              name="descricao"
              type="text"
              placeholder="Ex: Pró-labore Abril/2026"
              className="w-full bg-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 bg-emerald-600 text-white text-sm font-semibold py-2 rounded-xl disabled:opacity-50"
            >
              {pending ? 'Salvando…' : 'Registrar'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 text-sm text-slate-400 hover:text-slate-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-sm text-blue-400 hover:text-blue-300 py-1 border border-dashed border-slate-700 rounded-xl transition-colors"
        >
          + Registrar receita
        </button>
      )}
    </div>
  );
}
