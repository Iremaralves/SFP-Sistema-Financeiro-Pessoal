import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { getEffectiveScope } from '@/lib/profile-scope';
import { toTransactions } from '@/lib/mappers';
import { calculateSettlement } from '@i2fin/core';
import { BottomNav } from '@/components/BottomNav';
import { ReceitaForm } from './ReceitaForm';

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

const glass = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
} as React.CSSProperties;

export default async function MesPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) redirect('/login');
  // operator também pode ver — Juliana acompanha o fechamento mensal

  const month = new Date().toISOString().slice(0, 7);
  const [my, mm] = month.split('-').map(Number);
  const nextMonth = new Date(my, mm, 1).toISOString().slice(0, 10);

  const { data: txRows } = await supabase
    .from('transactions')
    .select('*')
    .eq('household_id', profile.household_id)
    .gte('occurred_on', `${month}-01`)
    .lt('occurred_on', nextMonth);

  const { data: incomeRows } = await supabase
    .from('income_records')
    .select('*')
    .eq('household_id', profile.household_id)
    .eq('reference_month', `${month}-01`);

  const transactions = toTransactions(txRows ?? []);
  const settlement = calculateSettlement(transactions, month);
  const [lbl_y, lbl_m] = month.split('-').map(Number);
  const monthLabel = new Date(lbl_y, lbl_m - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  const julianaTransf = (incomeRows ?? []).filter((r) => r.kind === 'juliana_transfer').reduce((s, r) => s + r.amount, 0);
  const unassigned = transactions.filter((t) => t.responsible === 'unassigned').length;

  const scope = await getEffectiveScope(profile.role as 'admin' | 'operator');


  return (
    <div className="min-h-screen pb-28 md:pl-60">
      {/* Header */}
      <div className="relative px-5 md:px-8 pt-14 md:pt-8 pb-6 overflow-hidden page-container" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.14) 0%, transparent 70%)' }} />
        <p className="text-white/40 text-xs uppercase tracking-widest capitalize mb-1">{monthLabel}</p>
        <h1 className="text-2xl font-bold text-white">Fechamento do mês</h1>
      </div>

      <div className="px-4 md:px-8 py-4 space-y-3 page-container">

        {/* Unassigned alert */}
        {unassigned > 0 && (
          <a href="/categorizar" className="rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-[0.98]"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <span className="text-xl">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="text-amber-300 text-sm font-medium">{unassigned} lançamento(s) sem responsável</p>
              <p className="text-amber-400/60 text-xs mt-0.5">Toque para categorizar →</p>
            </div>
            <span className="text-amber-300 text-base flex-shrink-0">›</span>
          </a>
        )}

        {/* A) Divisão da fatura */}
        <Section title="A) Divisão da fatura" style={glass}>
          <Row label="Total da fatura" value={fmt(settlement.totalFatura)} bold />
          <Divider />
          <Row label="Parte Iremar" value={fmt(settlement.iremarPart)} color="#93c5fd" />
          <Row label="Parte Juliana" value={fmt(settlement.julianaPart)} color="#f9a8d4" />
          <Row label="Parte i2 Soluções" value={fmt(settlement.i2Part)} color="#fcd34d" />
          <Row label="Total casal (antes ÷2)" value={fmt(settlement.casalTotal)} color="#67e8f9" />
        </Section>

        {/* B) Acerto Juliana */}
        <Section title="B) Acerto Juliana" style={glass}>
          <Row label="Juliana deve" value={fmt(settlement.julianaPart)} bold />
          <Row
            label="Juliana transferiu"
            value={julianaTransf > 0 ? fmt(julianaTransf) : 'Não registrado'}
            color={julianaTransf >= settlement.julianaPart ? '#34d399' : 'rgba(255,255,255,0.4)'}
          />
          {julianaTransf > 0 && (
            <Row
              label="Diferença"
              value={fmt(julianaTransf - settlement.julianaPart)}
              color={julianaTransf >= settlement.julianaPart ? '#34d399' : '#f87171'}
            />
          )}
        </Section>

        {/* C) Receitas do mês (admin only) */}
        {profile.role === 'admin' && (
          <Section title="C) Receitas do mês" style={glass}>
            <ReceitaForm month={month} incomeRows={incomeRows ?? []} />
            <Divider />
            <Row label="Parte i2 na fatura" value={fmt(settlement.i2Part)} color="#fcd34d" />
          </Section>
        )}

        {/* Detalhamento por responsável */}
        <Section title="Detalhamento por responsável" style={glass}>
          {(['iremar', 'juliana', 'casal', 'i2'] as const).map((r) => {
            const total = transactions.filter((t) => t.responsible === r).reduce((s, t) => s + Math.abs(t.amount), 0);
            const count = transactions.filter((t) => t.responsible === r).length;
            if (count === 0) return null;
            const colors: Record<string, string> = { iremar: '#93c5fd', juliana: '#f9a8d4', casal: '#67e8f9', i2: '#fcd34d' };
            return (
              <Row
                key={r}
                label={`${r.charAt(0).toUpperCase() + r.slice(1)} (${count} lançamentos)`}
                value={fmt(total)}
                color={colors[r]}
              />
            );
          })}
        </Section>
      </div>

      <BottomNav role={profile.role as 'admin' | 'operator'} name={profile.name ?? ''} scope={scope} />
    </div>
  );
}

function Section({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="rounded-2xl p-4" style={style}>
      <p className="text-white/35 text-[10px] mb-3 uppercase tracking-widest">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${bold ? 'text-white font-semibold' : 'text-white/50'}`}>{label}</span>
      <span
        className="text-sm font-semibold tabular"
        style={{ color: color ?? (bold ? '#fff' : 'rgba(255,255,255,0.8)'), fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="my-1" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />;
}
