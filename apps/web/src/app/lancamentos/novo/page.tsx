'use client';

import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const RESPONSIBLE_OPTIONS = [
  { value: 'juliana', label: 'Juliana', accent: '#ec4899', bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.4)' },
  { value: 'iremar',  label: 'Iremar',  accent: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.4)'  },
  { value: 'casal',   label: 'Casal',   accent: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.4)'   },
  { value: 'i2',      label: 'i2 Soluções', accent: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)' },
];

const inputStyle = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.1)',
} as React.CSSProperties;

export default function NovoLancamentoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [responsible, setResponsible] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]!);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!responsible) return;
    setLoading(true);

    const db = createClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
    if (!profile) { router.push('/login'); return; }

    const { data: account } = await db
      .from('accounts')
      .select('id')
      .eq('household_id', profile.household_id)
      .eq('kind', 'credit_card')
      .single();
    if (!account) {
      setLoading(false);
      setError('Nenhuma conta de crédito encontrada. Contate o administrador.');
      return;
    }

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Valor inválido. Use números, ex: 49,90');
      setLoading(false);
      return;
    }

    const fp = `manual-${date}-${description.toLowerCase().slice(0, 20)}-${parsedAmount}-${Date.now()}`;

    await db.from('transactions').insert({
      household_id: profile.household_id,
      account_id: account.id,
      occurred_on: date,
      description,
      amount: parsedAmount,
      responsible,
      source: 'manual_pwa',
      fingerprint: fp,
      created_by: user.id,
    });

    router.push('/lancamentos');
    router.refresh();
  }

  return (
    <div className="min-h-screen px-4 pt-14 pb-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% -5%, rgba(59,130,246,0.1) 0%, transparent 60%)' }} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          ‹
        </button>
        <h1 className="text-xl font-bold text-white">Novo lançamento</h1>
      </div>

      {error && (
        <div className="rounded-2xl p-4 mb-4 flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <span className="text-lg">⚠️</span>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Amount — hero input */}
        <div>
          <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Valor (R$)</label>
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            required
            className="w-full rounded-2xl px-5 py-4 text-white text-3xl font-bold placeholder-white/20 focus:outline-none transition-all"
            style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Descrição</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mercado, farmácia, restaurante..."
            required
            className="w-full rounded-xl px-4 py-3.5 text-white placeholder-white/25 text-base focus:outline-none transition-all"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full rounded-xl px-4 py-3.5 text-white text-base focus:outline-none transition-all"
            style={{ ...inputStyle, colorScheme: 'dark' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        </div>

        {/* Responsible */}
        <div>
          <label className="block text-white/40 text-xs uppercase tracking-wider mb-3">Responsável</label>
          <div className="grid grid-cols-2 gap-2.5">
            {RESPONSIBLE_OPTIONS.map((opt) => {
              const isSelected = responsible === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setResponsible(opt.value)}
                  className="flex items-center justify-center py-4 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-95"
                  style={{
                    background: isSelected ? opt.bg : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isSelected ? opt.border : 'rgba(255,255,255,0.08)'}`,
                    color: isSelected ? opt.accent : 'rgba(255,255,255,0.5)',
                    transform: isSelected ? 'scale(0.97)' : 'scale(1)',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !responsible}
          className="w-full font-semibold py-4 rounded-2xl text-white transition-all active:scale-95 disabled:opacity-40 mt-2"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
        >
          {loading ? 'Salvando...' : 'Salvar lançamento'}
        </button>
      </form>
    </div>
  );
}
