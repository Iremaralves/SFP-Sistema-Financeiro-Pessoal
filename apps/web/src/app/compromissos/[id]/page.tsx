'use client';

import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { use } from 'react';

type PaymentMethod = 'boleto' | 'pix' | 'credit_card';
type RecurrenceType = 'monthly' | 'weekly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual';

const inputStyle = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.1)',
} as React.CSSProperties;

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string; color: string }[] = [
  { value: 'boleto',      label: 'Boleto',  icon: '🏦', color: '#a5b4fc' },
  { value: 'pix',         label: 'PIX',     icon: '⚡', color: '#34d399' },
  { value: 'credit_card', label: 'Cartão',  icon: '💳', color: '#fcd34d' },
];

const RECURRENCE_TYPES: { value: RecurrenceType; label: string }[] = [
  { value: 'monthly',    label: 'Mensal'    },
  { value: 'bimonthly',  label: 'Quinzenal' },
  { value: 'weekly',     label: 'Semanal'   },
  { value: 'quarterly',  label: 'Trimestral'},
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual',     label: 'Anual'     },
];

export default function EditarCompromissoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [responsible, setResponsible] = useState('iremar');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('boleto');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('monthly');

  useEffect(() => {
    async function load() {
      const db = createClient();
      const { data: { user } } = await db.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data } = await db
        .from('recurring_commitments')
        .select('*')
        .eq('id', id)
        .single();

      if (!data) { setNotFound(true); setLoading(false); return; }

      setDescription(data.description);
      setAmount(String(data.amount));
      setDueDay(String(data.due_day));
      setResponsible(data.responsible);
      setPaymentMethod((data.payment_method as PaymentMethod) ?? 'credit_card');
      setRecurrenceType((data.recurrence_type as RecurrenceType) ?? 'monthly');
      setLoading(false);
    }
    load();
  }, [id, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const db = createClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data: profile } = await db.from('profiles').select('household_id').eq('id', user.id).single();
    if (!profile) { router.push('/login'); return; }

    // Para boleto/pix, account_id pode ser null
    let accountId: string | null = null;
    if (paymentMethod === 'credit_card') {
      const { data: account } = await db
        .from('accounts').select('id')
        .eq('household_id', profile.household_id)
        .eq('kind', 'credit_card')
        .single();
      accountId = account?.id ?? null;
    }

    await db.from('recurring_commitments').update({
      description,
      amount: parseFloat(amount.replace(',', '.')),
      due_day: parseInt(dueDay),
      responsible,
      payment_method: paymentMethod,
      recurrence_type: recurrenceType,
      account_id: accountId,
    }).eq('id', id);

    router.push('/compromissos');
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    const db = createClient();
    await db.from('recurring_commitments').update({ active: false }).eq('id', id);
    router.push('/compromissos');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/30 text-sm">Carregando...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <p className="text-white/50">Conta não encontrada</p>
          <button onClick={() => router.push('/compromissos')} className="text-indigo-400 text-sm">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-14 pb-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% -5%, rgba(99,102,241,0.1) 0%, transparent 60%)' }} />

      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          ‹
        </button>
        <h1 className="text-xl font-bold text-white">Editar conta fixa</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* Forma de pagamento */}
        <div>
          <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Forma de pagamento</label>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map(pm => (
              <button
                key={pm.value}
                type="button"
                onClick={() => setPaymentMethod(pm.value)}
                className="py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 flex flex-col items-center gap-1"
                style={{
                  background: paymentMethod === pm.value ? `${pm.color}18` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${paymentMethod === pm.value ? pm.color + '50' : 'rgba(255,255,255,0.08)'}`,
                  color: paymentMethod === pm.value ? pm.color : 'rgba(255,255,255,0.5)',
                }}
              >
                <span className="text-lg">{pm.icon}</span>
                <span>{pm.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Descrição</label>
          <input
            type="text" value={description} onChange={e => setDescription(e.target.value)}
            required
            className="w-full rounded-xl px-4 py-3.5 text-white placeholder-white/25 text-base focus:outline-none"
            style={inputStyle}
          />
        </div>

        {/* Valor */}
        <div>
          <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Valor (R$)</label>
          <input
            type="number" step="0.01" min="0.01" value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            className="w-full rounded-xl px-4 py-3.5 text-white placeholder-white/25 text-2xl font-bold focus:outline-none"
            style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }}
          />
        </div>

        {/* Dia + Recorrência */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Dia de vencimento</label>
            <input
              type="number" min="1" max="31" value={dueDay}
              onChange={e => setDueDay(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-3.5 text-white text-base focus:outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Recorrência</label>
            <select
              value={recurrenceType}
              onChange={e => setRecurrenceType(e.target.value as RecurrenceType)}
              className="w-full rounded-xl px-3 py-3.5 text-white text-sm focus:outline-none"
              style={{ ...inputStyle, colorScheme: 'dark' }}
            >
              {RECURRENCE_TYPES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Responsável */}
        <div>
          <label className="block text-white/40 text-xs uppercase tracking-wider mb-3">Responsável</label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { v: 'iremar',  l: 'Iremar',      c: '#3b82f6' },
              { v: 'i2',      l: 'i2 Soluções', c: '#f59e0b' },
              { v: 'casal',   l: 'Casal',        c: '#06b6d4' },
              { v: 'juliana', l: 'Juliana',      c: '#ec4899' },
            ].map(opt => (
              <button
                key={opt.v} type="button" onClick={() => setResponsible(opt.v)}
                className="py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{
                  background: responsible === opt.v ? `${opt.c}18` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${responsible === opt.v ? opt.c + '50' : 'rgba(255,255,255,0.08)'}`,
                  color: responsible === opt.v ? opt.c : 'rgba(255,255,255,0.5)',
                }}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        {/* Salvar */}
        <button
          type="submit" disabled={saving}
          className="w-full font-semibold py-4 rounded-2xl text-white transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
        >
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>

        {/* Excluir */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-40"
          style={confirmDelete
            ? { background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171' }
            : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }
          }
        >
          {deleting ? 'Excluindo...' : confirmDelete ? '⚠️ Confirmar exclusão' : 'Excluir conta'}
        </button>
        {confirmDelete && (
          <button type="button" onClick={() => setConfirmDelete(false)} className="w-full py-2 text-xs text-white/25">
            Cancelar
          </button>
        )}
      </form>
    </div>
  );
}
