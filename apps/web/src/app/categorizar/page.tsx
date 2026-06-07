import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { getEffectiveScope } from '@/lib/profile-scope';
import { BottomNav } from '@/components/BottomNav';
import { CategorizarItem } from './CategorizarItem';
import Link from 'next/link';

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export default async function CategorizarPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  if (!profile) redirect('/login');

  // Buscar conta do cartão (transactions vindas do CSV ficam unassigned)
  const { data: cardAccount } = await supabase
    .from('accounts').select('id')
    .eq('household_id', profile.household_id)
    .eq('kind', 'credit_card')
    .eq('active', true)
    .limit(1).maybeSingle();

  // Buscar todas as transações sem responsável (cartão primeiro)
  const { data: txs } = await supabase
    .from('transactions')
    .select('id, description, amount, occurred_on')
    .eq('household_id', profile.household_id)
    .eq('responsible', 'unassigned')
    .eq('is_transfer', false)
    .order('occurred_on', { ascending: false })
    .limit(100);

  const transactions = (txs ?? []).map(t => ({
    ...t,
    amount: Number(t.amount),
  }));

  const totalPendente = transactions.reduce((s, t) => s + Math.abs(t.amount), 0);

  const scope = await getEffectiveScope(profile.role as 'admin' | 'operator');


  return (
    <div className="min-h-screen pb-28 md:pl-60">
      {/* Header */}
      <div className="relative px-5 md:px-8 pt-14 md:pt-8 pb-5 overflow-hidden page-container"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(251,191,36,0.12) 0%, transparent 70%)' }} />
        <div className="flex items-center gap-3">
          <Link href={profile.role === 'admin' ? '/dashboard' : '/dashboard'}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>‹</Link>
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest">Pendentes</p>
            <h1 className="text-xl md:text-2xl font-bold text-white">Categorizar lançamentos</h1>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-2xl p-3"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <p className="text-amber-400/70 text-[10px] uppercase tracking-wider">Aguardando</p>
            <p className="text-amber-300 text-2xl font-bold tabular">{transactions.length}</p>
          </div>
          <div className="rounded-2xl p-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-white/40 text-[10px] uppercase tracking-wider">Total</p>
            <p className="text-white text-2xl font-bold tabular">{fmt(totalPendente)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-5 pb-24 space-y-2.5 page-container fade-up-stagger">
        {transactions.length === 0 && (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <p className="text-2xl mb-2">✅</p>
            <p className="text-emerald-300 font-semibold">Tudo categorizado!</p>
            <p className="text-white/40 text-sm mt-1">Nenhum lançamento pendente.</p>
            <Link href="/dashboard"
              className="inline-block mt-4 text-xs text-white/50 underline hover:text-white/80">
              ← Voltar para o início
            </Link>
          </div>
        )}

        {transactions.map(tx => (
          <CategorizarItem key={tx.id} tx={tx} />
        ))}
      </div>

      <BottomNav role={profile.role as 'admin' | 'operator'} name={profile.name ?? ''} scope={scope} />
    </div>
  );
}
