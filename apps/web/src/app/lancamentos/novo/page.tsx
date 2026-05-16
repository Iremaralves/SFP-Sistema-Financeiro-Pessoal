'use client';

import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const RESPONSIBLE_OPTIONS = [
  { value: 'juliana', label: 'Juliana', emoji: '👩', color: 'bg-pink-600 border-pink-500' },
  { value: 'iremar', label: 'Iremar', emoji: '👨', color: 'bg-blue-600 border-blue-500' },
  { value: 'casal', label: 'Casal', emoji: '👫', color: 'bg-cyan-600 border-cyan-500' },
  { value: 'i2', label: 'i2', emoji: '🏢', color: 'bg-yellow-600 border-yellow-500' },
];

export default function NovoLancamentoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
    if (!account) { setLoading(false); return; }

    // Simple fingerprint for manual entries
    const fp = `manual-${date}-${description.toLowerCase().slice(0, 20)}-${amount}-${Date.now()}`;

    await db.from('transactions').insert({
      household_id: profile.household_id,
      account_id: account.id,
      occurred_on: date,
      description,
      amount: parseFloat(amount.replace(',', '.')),
      responsible,
      source: 'manual_pwa',
      fingerprint: fp,
      created_by: user.id,
    });

    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen px-4 pt-12 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-200 text-2xl">‹</button>
        <h1 className="text-xl font-bold">Novo lançamento</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Amount */}
        <div>
          <label className="block text-slate-400 text-sm mb-2">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            required
            inputMode="decimal"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-slate-100 text-2xl font-bold placeholder-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-slate-400 text-sm mb-2">Descrição</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mercado, farmácia, restaurante..."
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-base"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-slate-400 text-sm mb-2">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 text-base"
          />
        </div>

        {/* Responsible — big buttons */}
        <div>
          <label className="block text-slate-400 text-sm mb-3">Responsável</label>
          <div className="grid grid-cols-2 gap-3">
            {RESPONSIBLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setResponsible(opt.value)}
                className={`flex items-center justify-center gap-2 rounded-2xl py-4 font-semibold text-white border-2 transition-all ${
                  responsible === opt.value
                    ? `${opt.color} scale-95`
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !responsible}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-4 rounded-2xl transition-colors text-base mt-4"
        >
          {loading ? 'Salvando...' : 'Salvar lançamento'}
        </button>
      </form>
    </div>
  );
}
