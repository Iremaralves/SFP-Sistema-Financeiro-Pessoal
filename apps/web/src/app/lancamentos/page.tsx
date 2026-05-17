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
  const [ly, lm] = month.split('-').map(Number);
  const nextMonth = new Date(ly, lm, 1).toISOString().slice(0, 10);

  const { data: txRows } = await supabase
    .from('transactions')
    .select('*')
    .eq('household_id', profile.household_id)
    .gte('occurred_on', `${month}-01`)
    .lt('occurred_on', nextMonth)
    .order('occurred_on', { ascending: false });

  const transactions = toTransactions(txRows ?? []);
  const [lbl_y, lbl_m] = month.split('-').map(Number);
  const monthLabel = new Date(lbl_y, lbl_m - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-5 overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest capitalize">{monthLabel}</p>
            <h1 className="text-xl font-bold text-white mt-0.5">Lançamentos</h1>
          </div>
          <Link
            href="/lancamentos/novo"
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            + Novo
          </Link>
        </div>
        <p className="text-white/30 text-xs mt-2">{transactions.length} lançamentos</p>
      </div>

      <div className="px-4 py-4">
        <TransactionList transactions={transactions} />
      </div>

      <BottomNav role={profile.role as 'admin' | 'operator'} />
    </div>
  );
}
