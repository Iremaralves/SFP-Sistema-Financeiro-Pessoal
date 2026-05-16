import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { toTransactions } from '@/lib/mappers';
import { TransactionList } from '@/components/TransactionList';
import { BottomNav } from '@/components/BottomNav';
import Link from 'next/link';

export default async function LancamentosPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) redirect('/login');

  const month = new Date().toISOString().slice(0, 7);
  const { data: txRows } = await supabase
    .from('transactions')
    .select('*')
    .eq('household_id', profile.household_id)
    .gte('occurred_on', `${month}-01`)
    .lte('occurred_on', `${month}-31`)
    .order('occurred_on', { ascending: false });

  const transactions = toTransactions(txRows ?? []);
  const monthLabel = new Date(`${month}-01`).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen pb-24">
      <div className="bg-slate-900 px-4 pt-12 pb-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm capitalize">{monthLabel}</p>
          <h1 className="text-xl font-bold mt-0.5">Lançamentos</h1>
        </div>
        <Link
          href="/lancamentos/novo"
          className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl"
        >
          + Novo
        </Link>
      </div>

      <div className="px-4 py-4">
        <TransactionList transactions={transactions} />
      </div>

      <BottomNav role={profile.role as 'admin' | 'operator'} />
    </div>
  );
}
