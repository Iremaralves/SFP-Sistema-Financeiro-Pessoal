'use client';

import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const inputStyle = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.1)',
} as React.CSSProperties;

export default function NovoCompromissoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [responsible, setResponsible] = useState('iremar');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const db = createClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
    if (!profile) { router.push('/login'); return; }
    const { data: account } = await db.from('accounts').select('id').eq('household_id', profile.household_id).single();
    if (!account) { setLoading(false); return; }

    await db.from('recurring_commitments').insert({
      household_id: profile.household_id,
      account_id: account.id,
      description,
      amount: parseFloat(amount.replace(',', '.')),
      due_day: parseInt(dueDay),
      responsible,
      active: true,
    });
    router.push('/compromissos');
  }

  return (
    <div className="min-h-screen px-4 pt-14 pb-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% -5%, rgba(99,102,241,0.1) 0%, transparent 60%)' }} />

      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>‹</button>
        <h1 className="text-xl font-bold text-white">Nova conta fixa</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Descrição</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Escola Helena, Condomínio..." required
            className="w-full rounded-xl px-4 py-3.5 text-white placeholder-white/25 text-base focus:outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Valor (R$)</label>
          <input type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" required
            className="w-full rounded-xl px-4 py-3.5 text-white placeholder-white/25 text-2xl font-bold focus:outline-none" style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }} />
        </div>
        <div>
          <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Dia de vencimento</label>
          <input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} placeholder="Ex: 10" required
            className="w-full rounded-xl px-4 py-3.5 text-white placeholder-white/25 text-base focus:outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="block text-white/40 text-xs uppercase tracking-wider mb-3">Responsável</label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { v: 'iremar', l: 'Iremar', c: '#3b82f6' },
              { v: 'i2', l: 'i2 Soluções', c: '#f59e0b' },
              { v: 'casal', l: 'Casal', c: '#06b6d4' },
              { v: 'juliana', l: 'Juliana', c: '#ec4899' },
            ].map(opt => (
              <button key={opt.v} type="button" onClick={() => setResponsible(opt.v)}
                className="py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{
                  background: responsible === opt.v ? `${opt.c}18` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${responsible === opt.v ? opt.c + '50' : 'rgba(255,255,255,0.08)'}`,
                  color: responsible === opt.v ? opt.c : 'rgba(255,255,255,0.5)',
                }}>
                {opt.l}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full font-semibold py-4 rounded-2xl text-white transition-all active:scale-95 disabled:opacity-40 mt-2"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          {loading ? 'Salvando...' : 'Salvar conta fixa'}
        </button>
      </form>
    </div>
  );
}
