'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { actionCriarTransferencia } from './actions';

interface Account {
  id: string;
  name: string;
  kind: string;
}

const KIND_ICON: Record<string, string> = {
  checking: '🏦', company: '💼', credit_card: '💳', investment: '📈',
};

export function TransferForm({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(accounts[0]?.id ?? '');
  const [to, setTo] = useState(accounts[1]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [desc, setDesc] = useState('');

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
  } as React.CSSProperties;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const v = parseFloat(amount.replace(',', '.'));
    if (isNaN(v) || v <= 0) {
      setError('Valor inválido.');
      return;
    }
    if (from === to) {
      setError('Origem e destino devem ser diferentes.');
      return;
    }

    startTransition(async () => {
      const result = await actionCriarTransferencia({
        from_account_id: from,
        to_account_id: to,
        amount: v,
        occurred_on: date,
        description: desc || undefined,
      });
      if (!result.ok) {
        setError(result.error ?? 'Erro ao salvar.');
        return;
      }
      setAmount('');
      setDesc('');
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl p-4 space-y-3"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>

      <div>
        <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-1.5">De (origem)</label>
        <select value={from} onChange={e => setFrom(e.target.value)} required
          className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
          style={{ ...inputStyle, colorScheme: 'dark' }}>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{KIND_ICON[a.kind] ?? '•'} {a.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-1.5">Para (destino)</label>
        <select value={to} onChange={e => setTo(e.target.value)} required
          className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
          style={{ ...inputStyle, colorScheme: 'dark' }}>
          {accounts.filter(a => a.id !== from).map(a => (
            <option key={a.id} value={a.id}>{KIND_ICON[a.kind] ?? '•'} {a.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-1.5">Valor (R$)</label>
          <input
            type="text" inputMode="decimal" value={amount}
            onChange={e => setAmount(e.target.value)} placeholder="0,00" required
            className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none" style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-1.5">Data</label>
          <input
            type="date" value={date} onChange={e => setDate(e.target.value)} required
            className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>
      </div>

      <div>
        <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-1.5">Descrição (opcional)</label>
        <input
          type="text" value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="Ex: Reserva de junho"
          className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none" style={inputStyle}
        />
      </div>

      {error && (
        <div className="rounded-xl p-2.5 text-xs text-red-400"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          ⚠️ {error}
        </div>
      )}

      <button type="submit" disabled={isPending}
        className="w-full py-3 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
        {isPending ? 'Salvando...' : '⇄ Registrar transferência'}
      </button>
    </form>
  );
}
