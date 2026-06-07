import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { getEffectiveScope } from '@/lib/profile-scope';
import { BottomNav } from '@/components/BottomNav';
import { TransferForm } from './TransferForm';
import Link from 'next/link';

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function fmtDate(s: string) {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

const KIND_ICON: Record<string, string> = {
  checking: '🏦', company: '💼', credit_card: '💳', investment: '📈',
};

export default async function TransferenciasPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/dashboard');

  const [
    { data: accounts },
    { data: transfers },
  ] = await Promise.all([
    supabase.from('accounts')
      .select('id, name, kind')
      .eq('household_id', profile.household_id)
      .eq('active', true)
      .order('kind, name'),
    supabase.from('transfers')
      .select('id, from_account_id, to_account_id, amount, occurred_on, description')
      .eq('household_id', profile.household_id)
      .order('occurred_on', { ascending: false })
      .limit(20),
  ]);

  const accountMap = new Map((accounts ?? []).map(a => [a.id, a]));

  const scope = await getEffectiveScope(profile.role as 'admin' | 'operator');


  return (
    <div className="min-h-screen pb-28 md:pl-60">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-5 overflow-hidden"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(16,185,129,0.12) 0%, transparent 70%)' }} />
        <div className="flex items-center gap-3">
          <Link href="/contas"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>‹</Link>
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest">Movimentações</p>
            <h1 className="text-xl font-bold text-white">Transferências</h1>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-5 space-y-4 page-container" style={{ maxWidth: 'min(100%, 56rem)' }}>
        {/* Form de nova transferência */}
        <TransferForm accounts={accounts ?? []} />

        {/* Histórico */}
        <div className="pt-2">
          <p className="text-white/30 text-[10px] uppercase tracking-widest px-1 mb-2">
            Últimas {(transfers ?? []).length} transferências
          </p>
          {(transfers ?? []).length === 0 && (
            <div className="rounded-2xl p-6 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-white/30 text-sm">Nenhuma transferência registrada ainda.</p>
            </div>
          )}
          <div className="space-y-2">
            {(transfers ?? []).map(t => {
              const fromA = accountMap.get(t.from_account_id);
              const toA = accountMap.get(t.to_account_id);
              return (
                <div key={t.id} className="rounded-xl p-3 flex items-center justify-between"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span>{KIND_ICON[fromA?.kind ?? ''] ?? '•'}</span>
                      <span className="text-white/70 truncate">{fromA?.name ?? '?'}</span>
                      <span className="text-white/30">→</span>
                      <span>{KIND_ICON[toA?.kind ?? ''] ?? '•'}</span>
                      <span className="text-white/70 truncate">{toA?.name ?? '?'}</span>
                    </div>
                    <p className="text-white/30 text-[10px] mt-0.5">{fmtDate(t.occurred_on)}</p>
                  </div>
                  <span className="text-emerald-400 text-sm font-semibold"
                    style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(Number(t.amount))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav role="admin" name={profile.name ?? ''} />
    </div>
  );
}
