import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { toTransactions } from '@/lib/mappers';
import { calculateSettlement } from '@i2fin/core';
import { BottomNav } from '@/components/BottomNav';
import { ReceitaForm } from './ReceitaForm';

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export default async function MesPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) redirect('/login');

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

  const proLabore = (incomeRows ?? []).filter((r) => r.kind === 'pro_labore').reduce((s, r) => s + r.amount, 0);
  const julianaTransf = (incomeRows ?? []).filter((r) => r.kind === 'juliana_transfer').reduce((s, r) => s + r.amount, 0);

  const unassigned = transactions.filter((t) => t.responsible === 'unassigned').length;

  return (
    <div className="min-h-screen pb-24">
      <div className="bg-slate-900 px-4 pt-12 pb-6 border-b border-slate-800">
        <p className="text-slate-400 text-sm capitalize mb-1">{monthLabel}</p>
        <h1 className="text-2xl font-bold">Fechamento do mês</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {unassigned > 0 && (
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-2xl p-4 text-sm text-amber-300">
            ⚠️ {unassigned} lançamento(s) sem responsável — use o CLI para categorizar.
          </div>
        )}

        {/* Bloco A: Fatura */}
        <Section title="A) Divisão da fatura">
          <Row label="Total da fatura" value={fmt(settlement.totalFatura)} bold />
          <Divider />
          <Row label="Parte Iremar" value={fmt(settlement.iremarPart)} color="text-blue-400" />
          <Row label="Parte Juliana" value={fmt(settlement.julianaPart)} color="text-pink-400" />
          <Row label="Parte i2 Soluções" value={fmt(settlement.i2Part)} color="text-yellow-400" />
          <Row label="Total casal (antes ÷2)" value={fmt(settlement.casalTotal)} color="text-cyan-400" />
        </Section>

        {/* Bloco B: Juliana */}
        <Section title="B) Acerto Juliana">
          <Row label="Juliana deve" value={fmt(settlement.julianaPart)} bold />
          <Row
            label="Juliana transferiu"
            value={julianaTransf > 0 ? fmt(julianaTransf) : 'Não registrado'}
            color={julianaTransf >= settlement.julianaPart ? 'text-emerald-400' : 'text-slate-400'}
          />
          {julianaTransf > 0 && (
            <Row
              label="Diferença"
              value={fmt(julianaTransf - settlement.julianaPart)}
              color={julianaTransf >= settlement.julianaPart ? 'text-emerald-400' : 'text-red-400'}
            />
          )}
        </Section>

        {/* Bloco C: Receitas */}
        {profile.role === 'admin' && (
          <Section title="C) Receitas do mês">
            <ReceitaForm month={month} incomeRows={incomeRows ?? []} />
            <Divider />
            <Row label="Parte i2 na fatura" value={fmt(settlement.i2Part)} color="text-yellow-400" />
          </Section>
        )}

        {/* Responsáveis breakdown */}
        <Section title="Detalhamento por responsável">
          {(['iremar', 'juliana', 'casal', 'i2'] as const).map((r) => {
            const total = transactions
              .filter((t) => t.responsible === r)
              .reduce((s, t) => s + Math.abs(t.amount), 0);
            const count = transactions.filter((t) => t.responsible === r).length;
            if (count === 0) return null;
            return (
              <Row
                key={r}
                label={`${r.charAt(0).toUpperCase() + r.slice(1)} (${count} lançamentos)`}
                value={fmt(total)}
              />
            );
          })}
        </Section>
      </div>

      <BottomNav role={profile.role as 'admin' | 'operator'} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/50 rounded-2xl p-4">
      <p className="text-slate-400 text-xs mb-3 uppercase tracking-wider">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${bold ? 'text-slate-100 font-semibold' : 'text-slate-400'}`}>{label}</span>
      <span className={`text-sm font-medium ${color ?? (bold ? 'text-slate-100' : 'text-slate-300')}`}>{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-slate-700 my-1" />;
}
