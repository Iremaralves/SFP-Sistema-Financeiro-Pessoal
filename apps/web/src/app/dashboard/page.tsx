import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { getEffectiveScope } from '@/lib/profile-scope';
import { getBudgetTeto } from '@/app/_actions/budget';
import { toTransactions } from '@/lib/mappers';
import { currentInvoiceCycle } from '@i2fin/core';
import { DashboardAdmin } from '@/components/DashboardAdmin';
import { DashboardOperator } from '@/components/DashboardOperator';

// Dia de fechamento do cartão Nubank (config futura virá de accounts.closing_day)
const CARD_CLOSING_DAY = 13;

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  // Ciclo da fatura atual do cartão (não é o mês calendário)
  const today = new Date();
  const cycle = currentInvoiceCycle(today, CARD_CLOSING_DAY);

  // Buscar conta do cartão para filtrar transactions só do cartão (fatura = só cartão)
  const { data: cardAccount } = await supabase
    .from('accounts')
    .select('id')
    .eq('household_id', profile.household_id)
    .eq('kind', 'credit_card')
    .eq('active', true)
    .limit(1)
    .maybeSingle();

  // Transactions DO CARTÃO no ciclo atual + receitas do mês referência
  const [{ data: transactions }, { data: incomeRecords }] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('household_id', profile.household_id)
      .eq('account_id', cardAccount?.id ?? '00000000-0000-0000-0000-000000000000')
      .gte('occurred_on', cycle.start)
      .lte('occurred_on', cycle.end)
      .eq('is_transfer', false)
      .order('occurred_on', { ascending: false }),
    supabase
      .from('income_records')
      .select('*')
      .eq('household_id', profile.household_id)
      .eq('reference_month', `${cycle.referenceMonth}-01`),
  ]);

  const mappedTx = toTransactions(transactions ?? []);

  // ── Contas a pagar do MÊS atual (boleto/PIX não pagos) ──────────────────────
  // Inclui atrasados (passados), vence hoje e a vencer no mês corrente.
  // Visível para ambos admin e operator (Iremar paga maioria, Juliana paga 3).
  const todayDay = today.getDate();
  const y = today.getFullYear();
  const m = today.getMonth();
  const referenceMonth = today.toISOString().slice(0, 7);

  const [{ data: commitments }, { data: paidObligations }] = await Promise.all([
    supabase
      .from('recurring_commitments')
      .select('id, description, due_day, amount, payment_method, responsible, paid_by')
      .eq('household_id', profile.household_id)
      .eq('active', true),
    supabase
      .from('monthly_obligations')
      .select('recurring_id, status, paid_amount')
      .eq('household_id', profile.household_id)
      .eq('reference_month', `${referenceMonth}-01`)
      .eq('status', 'paid'),
  ]);
  const paidSet = new Set((paidObligations ?? []).map(o => o.recurring_id));

  type BillStatus = 'overdue' | 'today' | 'upcoming';
  type Bill = {
    id: string; description: string; due_day: number; amount: number;
    dueDateStr: string; status: BillStatus; responsible: string; paid_by: string;
  };

  const bills: Bill[] = (commitments ?? [])
    .filter(c => (c.payment_method ?? 'boleto') !== 'credit_card')
    .filter(c => !paidSet.has(c.id))
    .map(c => {
      const status: BillStatus =
        c.due_day < todayDay  ? 'overdue' :
        c.due_day === todayDay ? 'today'   : 'upcoming';
      return {
        id: c.id,
        description: c.description,
        due_day: c.due_day,
        amount: Number(c.amount),
        dueDateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(c.due_day).padStart(2, '0')}`,
        status, responsible: c.responsible, paid_by: c.paid_by ?? c.responsible,
      };
    })
    .sort((a, b) => {
      // overdue primeiro, depois today, depois upcoming
      const rank = (s: BillStatus) => s === 'overdue' ? 0 : s === 'today' ? 1 : 2;
      const r = rank(a.status) - rank(b.status);
      return r !== 0 ? r : a.due_day - b.due_day;
    });

  // Compatibilidade: mantém upcoming (top 5) para componente atual
  const upcoming = bills.slice(0, 5).map(b => ({
    id: b.id, description: b.description, due_day: b.due_day,
    amount: b.amount, dueDateStr: b.dueDateStr,
  }));

  const scope = await getEffectiveScope(profile.role as 'admin' | 'operator');

  // ─── Métricas para Quick Actions (atalhos rápidos no topo) ─────────────────
  // Total a pagar pendente (sum amount dos bills pendentes do mês)
  const aPagarTotal = bills.reduce((sum, b) => sum + b.amount, 0);
  const aPagarCount = bills.length;

  // Total a receber do mês (income_records: pro-labore + juliana_transfer + outros)
  const aReceberTotal = (incomeRecords ?? []).reduce((s, r) => s + Number(r.amount), 0);

  // Saldo total das contas (positivos). Filtra por ENTIDADE (PF/PJ), não por kind.
  const { data: allTxForSaldo } = await supabase
    .from('transactions').select('account_id, amount')
    .eq('household_id', profile.household_id);
  const { data: scopedAccounts } = await supabase
    .from('accounts').select('id, kind, opening_balance, entity_id')
    .eq('household_id', profile.household_id)
    .eq('active', true);
  const { data: entsForSaldo } = await supabase
    .from('entities').select('id, type').eq('household_id', profile.household_id);
  const bizEntityId = (entsForSaldo ?? []).find(e => e.type === 'business')?.id ?? null;
  const acctTx = new Map<string, number>();
  for (const t of (allTxForSaldo ?? [])) {
    acctTx.set(t.account_id, (acctTx.get(t.account_id) ?? 0) + Number(t.amount));
  }
  const filteredAccts = (scopedAccounts ?? []).filter(a => {
    if (a.kind === 'credit_card') return false; // cartão nunca soma saldo (é dívida)
    if (scope === 'pessoal') return a.entity_id !== bizEntityId;
    if (scope === 'empresa') return a.entity_id === bizEntityId;
    return true; // tudo
  });
  const saldoContas = filteredAccts.reduce(
    (s, a) => s + Number(a.opening_balance) + (acctTx.get(a.id) ?? 0),
    0,
  );

  // Total da fatura aberta (para badge do atalho 💳 Cartão)
  const faturaTotal = mappedTx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const dashboardMetrics = {
    faturaTotal,
    aPagarTotal,
    aPagarCount,
    aReceberTotal,
    saldoContas,
  };

  // Teto do orçamento pessoal (semáforo do cartão) + boletos PF do Iremar
  const budgetTeto = await getBudgetTeto();
  const boletosPFIremar = bills
    .filter(b => b.paid_by === 'iremar' && b.responsible !== 'i2')
    .reduce((s, b) => s + b.amount, 0);

  return (
    <div className="min-h-screen pb-24 md:pl-60">
      {profile.role === 'admin' ? (
        <DashboardAdmin
          profile={profile}
          transactions={mappedTx}
          incomeRecords={incomeRecords ?? []}
          month={cycle.referenceMonth}
          cycle={cycle}
          upcoming={upcoming}
          bills={bills}
          scope={scope}
          metrics={dashboardMetrics}
          budgetTeto={budgetTeto}
          boletosPF={boletosPFIremar}
        />
      ) : (
        <DashboardOperator
          profile={profile}
          transactions={mappedTx}
          month={cycle.referenceMonth}
          bills={bills.filter(b => b.paid_by === 'juliana' || b.responsible === 'juliana' || b.responsible === 'casal')}
          scope={scope}
          metrics={dashboardMetrics}
        />
      )}
    </div>
  );
}
