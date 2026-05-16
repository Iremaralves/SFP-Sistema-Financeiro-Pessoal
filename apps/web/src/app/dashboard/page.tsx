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

  // Fetch transactions for current month
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('household_id', profile.household_id)
    .gte('occurred_on', `${month}-01`)
    .lte('occurred_on', `${month}-31`)
    .order('occurred_on', { ascending: false });

  const { data: incomeRecords } = await supabase
    .from('income_records')
    .select('*')
    .eq('household_id', profile.household_id)
    .eq('reference_month', `${month}-01`);

  const mappedTx = toTransactions(transactions ?? []);

  return (
    <div className="min-h-screen pb-24">
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
