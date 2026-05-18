import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { toTransactions } from '@/lib/mappers';
import { DashboardAdmin } from '@/components/DashboardAdmin';
import { DashboardOperator } from '@/components/DashboardOperator';

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

  const month = new Date().toISOString().slice(0, 7);
  const [dy, dm] = month.split('-').map(Number);
  const nextMonth = new Date(dy, dm, 1).toISOString().slice(0, 10);

  // Fetch em paralelo para reduzir latência
  const [{ data: transactions }, { data: incomeRecords }] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('household_id', profile.household_id)
      .gte('occurred_on', `${month}-01`)
      .lt('occurred_on', nextMonth)
      .order('occurred_on', { ascending: false }),
    supabase
      .from('income_records')
      .select('*')
      .eq('household_id', profile.household_id)
      .eq('reference_month', `${month}-01`),
  ]);

  const mappedTx = toTransactions(transactions ?? []);

  return (
    <div className="min-h-screen pb-24 md:pl-60">
      {profile.role === 'admin' ? (
        <DashboardAdmin
          profile={profile}
          transactions={mappedTx}
          incomeRecords={incomeRecords ?? []}
          month={month}
        />
      ) : (
        <DashboardOperator
          profile={profile}
          transactions={mappedTx}
          month={month}
        />
      )}
    </div>
  );
}
