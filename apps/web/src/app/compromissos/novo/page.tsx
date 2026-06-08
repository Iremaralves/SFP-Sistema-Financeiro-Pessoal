'use client';

import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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

export default function NovoCompromissoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [responsible, setResponsible] = useState('iremar');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('boleto');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('monthly');

  // Proração do 1º mês (ex: estagiária que entrou no meio do mês)
  const [prorate, setProrate] = useState(false);
  const [startDate, setStartDate] = useState('');

  // Cálculo da proração (dias corridos do mês de início)
  const fullValue = parseFloat(amount.replace(',', '.'));
  const proration = (() => {
    if (!prorate || !startDate || Number.isNaN(fullValue)) return null;
    const [y, m, d] = startDate.split('-').map(Number);
    if (!y || !m || !d) return null;
    const diasMes = new Date(y, m, 0).getDate();           // dias do mês de início
    const diasTrabalhados = Math.max(0, diasMes - d + 1);  // do dia de início até o fim
    const valor = Math.round((fullValue * diasTrabalhados / diasMes) * 100) / 100;
    const mesLabel = new Date(y, m - 1, 1).toLocaleString('pt-BR', { month: 'long' });
    return { diasMes, diasTrabalhados, valor, mesLabel, refMonth: `${y}-${String(m).padStart(2, '0')}` };
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const db = createClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
    if (!profile) { router.push('/login'); return; }

    // Para boleto/pix não precisamos de account_id (nullable após migração)
    let accountId: string | null = null;
    if (paymentMethod === 'credit_card') {
      const { data: account } = await db
        .from('accounts').select('id')
        .eq('household_id', profile.household_id)
        .eq('kind', 'credit_card')
        .single();
      accountId = account?.id ?? null;
    }

    // Detectar entity_id com base no responsável
    const { data: entityRows } = await db
      .from('entities')
      .select('id, type')
      .eq('household_id', profile.household_id)
      .eq('active', true);

    const i2Entity  = entityRows?.find(e => e.type === 'business');
    const famEntity = entityRows?.find(e => e.type === 'personal');
    const entityId  = responsible === 'i2' ? (i2Entity?.id ?? null) : (famEntity?.id ?? null);

    // Compromisso sempre cadastrado com o valor CHEIO (estado permanente)
    const { data: novoCommit } = await db.from('recurring_commitments').insert({
      household_id: profile.household_id,
      account_id: accountId,
      description,
      amount: parseFloat(amount.replace(',', '.')),
      due_day: parseInt(dueDay),
      responsible,
      paid_by: (responsible === 'casal' ? 'iremar' : responsible) as 'iremar' | 'juliana' | 'casal' | 'i2',
      active: true,
      payment_method: paymentMethod,
      recurrence_type: recurrenceType,
      entity_id: entityId,
    }).select('id').single();

    // Se prorar: cria a obrigação do 1º mês com o valor proporcional (pending).
    // Os meses seguintes usam o valor cheio automaticamente.
    if (prorate && proration && novoCommit) {
      await db.from('monthly_obligations').insert({
        household_id: profile.household_id,
        recurring_id: novoCommit.id,
        reference_month: `${proration.refMonth}-01`,
        due_date: `${proration.refMonth}-${String(parseInt(dueDay)).padStart(2, '0')}`,
        description: `${description} (proporcional ${proration.diasTrabalhados}/${proration.diasMes} dias)`,
        amount: proration.valor,
        responsible,
        status: 'pending',
      });
    }

    router.push('/compromissos');
  }

  return (
    <div className="min-h-screen px-4 pt-14 pb-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% -5%, rgba(99,102,241,0.1) 0%, transparent 60%)' }} />

      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
          ‹
        </button>
        <h1 className="text-xl font-bold text-white">Nova conta fixa</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

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
            placeholder="Ex: Condomínio, Internet, Água..."
            required
            className="w-full rounded-xl px-4 py-3.5 text-white placeholder-white/25 text-base focus:outline-none"
            style={inputStyle}
          />
        </div>

        {/* Valor */}
        <div>
          <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">
            {prorate ? 'Valor cheio (mês completo)' : 'Valor (R$)'}
          </label>
          <input
            type="number" step="0.01" min="0.01" value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0,00" required
            className="w-full rounded-xl px-4 py-3.5 text-white placeholder-white/25 text-2xl font-bold focus:outline-none"
            style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }}
          />
        </div>

        {/* Proração do 1º mês */}
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            type="button"
            onClick={() => setProrate(v => !v)}
            className="w-full flex items-center justify-between"
          >
            <span className="flex items-center gap-2 text-sm">
              <span>📅</span>
              <span style={{ color: prorate ? '#34d399' : 'rgba(255,255,255,0.5)' }}>
                Proporcional no 1º mês (entrou no meio do mês)
              </span>
            </span>
            <span className="w-9 h-5 rounded-full transition-all flex items-center flex-shrink-0"
              style={{ background: prorate ? '#34d399' : 'rgba(255,255,255,0.15)' }}>
              <span className="w-4 h-4 rounded-full bg-white transition-all"
                style={{ marginLeft: prorate ? '18px' : '2px' }} />
            </span>
          </button>

          {prorate && (
            <div className="mt-3 space-y-2">
              <label className="block text-white/40 text-[10px] uppercase tracking-wider">Data de início</label>
              <input
                type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none"
                style={{ ...inputStyle, colorScheme: 'dark' }}
              />
              {proration && (
                <div className="rounded-lg p-2.5 mt-1" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                  <p className="text-emerald-300 text-sm font-bold tabular">
                    1º mês ({proration.mesLabel}): {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proration.valor)}
                  </p>
                  <p className="text-emerald-400/60 text-[11px] mt-0.5">
                    {fullValue ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fullValue) : '—'} × {proration.diasTrabalhados} de {proration.diasMes} dias · demais meses no valor cheio
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dia de vencimento + Recorrência */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Dia de vencimento</label>
            <input
              type="number" min="1" max="31" value={dueDay}
              onChange={e => setDueDay(e.target.value)}
              placeholder="Ex: 10" required
              className="w-full rounded-xl px-4 py-3.5 text-white placeholder-white/25 text-base focus:outline-none"
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

        <button
          type="submit" disabled={loading}
          className="w-full font-semibold py-4 rounded-2xl text-white transition-all active:scale-95 disabled:opacity-40 mt-2"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
        >
          {loading ? 'Salvando...' : 'Salvar conta fixa'}
        </button>
      </form>
    </div>
  );
}
