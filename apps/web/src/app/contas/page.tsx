import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { toTransactions } from '@/lib/mappers';
import { calculateSettlement } from '@i2fin/core';
import { BottomNav } from '@/components/BottomNav';
import Link from 'next/link';

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

const glass = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
} as React.CSSProperties;

export default async function ContasPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) redirect('/login');

  const month = new Date().toISOString().slice(0, 7);
  const [my, mm] = month.split('-').map(Number);
  const nextMonth = new Date(my, mm, 1).toISOString().slice(0, 10);
  const [lbl_y, lbl_m] = month.split('-').map(Number);
  const monthLabel = new Date(lbl_y, lbl_m - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  const { data: txRows } = await supabase
    .from('transactions').select('*')
    .eq('household_id', profile.household_id)
    .gte('occurred_on', `${month}-01`)
    .lt('occurred_on', nextMonth);

  const { data: incomeRows } = await supabase
    .from('income_records').select('*')
    .eq('household_id', profile.household_id)
    .eq('reference_month', `${month}-01`);

  const transactions = toTransactions(txRows ?? []);
  const settlement = calculateSettlement(transactions, month);

  const julianaTransf = (incomeRows ?? []).filter(r => r.kind === 'juliana_transfer').reduce((s, r) => s + r.amount, 0);
  const julianaOk = julianaTransf >= settlement.julianaPart && settlement.julianaPart > 0;

  const totalFatura = settlement.totalFatura;
  const pctIremar = totalFatura > 0 ? (settlement.iremarPart / totalFatura) * 100 : 0;
  const pctJuliana = totalFatura > 0 ? (settlement.julianaPart / totalFatura) * 100 : 0;
  const pctCasal = totalFatura > 0 ? (settlement.casalTotal / totalFatura) * 100 : 0;
  const pctI2 = totalFatura > 0 ? (settlement.i2Part / totalFatura) * 100 : 0;

  return (
    <div className="min-h-screen pb-28 md:pl-60">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-6 overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.14) 0%, transparent 70%)' }} />
        <p className="text-white/40 text-xs uppercase tracking-widest capitalize">{monthLabel}</p>
        <h1 className="text-2xl font-bold text-white mt-1">Divisão da fatura</h1>
        <p className="text-white/30 text-xs mt-1">{transactions.length} lançamentos · atualizado agora</p>
      </div>

      <div className="px-4 py-4 space-y-3">

        {/* Hero total */}
        <div className="rounded-3xl p-5 relative overflow-hidden" style={glass}>
          <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(59,130,246,0.1), transparent 70%)' }} />
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Total da fatura</p>
          <p className="text-4xl font-bold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(totalFatura)}</p>

          {/* Mini bar chart */}
          <div className="mt-4 flex h-2 rounded-full overflow-hidden gap-0.5">
            <div style={{ width: `${pctIremar}%`, background: '#3b82f6', borderRadius: '999px 0 0 999px' }} />
            <div style={{ width: `${pctJuliana}%`, background: '#ec4899' }} />
            <div style={{ width: `${pctCasal}%`, background: '#06b6d4' }} />
            <div style={{ width: `${pctI2}%`, background: '#f59e0b', borderRadius: '0 999px 999px 0' }} />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-white/30">
            <span>Iremar {pctIremar.toFixed(0)}%</span>
            <span>Juliana {pctJuliana.toFixed(0)}%</span>
            <span>Casal {pctCasal.toFixed(0)}%</span>
            <span>i2 {pctI2.toFixed(0)}%</span>
          </div>
        </div>

        {/* Cards por responsável */}
        <div className="grid grid-cols-2 gap-2.5">
          <PersonCard name="Iremar" amount={settlement.iremarPart} accent="#3b82f6" pct={pctIremar} />
          <PersonCard name="Juliana" amount={settlement.julianaPart} accent="#ec4899" pct={pctJuliana} />
          <PersonCard name="Casal" amount={settlement.casalTotal} accent="#06b6d4" pct={pctCasal} subtitle="÷2 cada" />
          <PersonCard name="i2 Soluções" amount={settlement.i2Part} accent="#f59e0b" pct={pctI2} />
        </div>

        {/* Status Juliana */}
        <div className="rounded-2xl p-4" style={julianaOk
          ? { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }
          : { background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)' }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: julianaOk ? '#34d399' : 'rgba(244,114,182,0.7)' }}>
            Acerto Juliana
          </p>
          {julianaOk ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-white font-semibold">Transferência confirmada</p>
                <p className="text-white/40 text-xs">{fmt(julianaTransf)} recebido</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-white font-semibold text-lg" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {fmt(settlement.julianaPart)} <span className="text-white/40 text-sm font-normal">a transferir</span>
              </p>
              {julianaTransf > 0 && (
                <p className="text-white/40 text-xs mt-1">Parcial: {fmt(julianaTransf)} recebido · falta {fmt(settlement.julianaPart - julianaTransf)}</p>
              )}
            </div>
          )}
        </div>

        {/* Links rápidos */}
        {profile.role === 'admin' && (
          <div className="grid grid-cols-2 gap-2.5">
            <Link href="/mes" className="rounded-2xl p-4 flex flex-col gap-1 transition-all active:scale-95" style={glass}>
              <span className="text-xl">📊</span>
              <p className="text-white text-sm font-semibold">Fechamento</p>
              <p className="text-white/40 text-xs">Registrar receitas</p>
            </Link>
            <Link href="/compromissos" className="rounded-2xl p-4 flex flex-col gap-1 transition-all active:scale-95" style={glass}>
              <span className="text-xl">📋</span>
              <p className="text-white text-sm font-semibold">Contas fixas</p>
              <p className="text-white/40 text-xs">Vencimentos e status</p>
            </Link>
          </div>
        )}
      </div>

      <BottomNav role={profile.role as 'admin' | 'operator'} name={profile.name ?? ''} />
    </div>
  );
}

function PersonCard({ name, amount, accent, pct, subtitle }: {
  name: string; amount: number; accent: string; pct: number; subtitle?: string;
}) {
  return (
    <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: `${accent}12`, border: `1px solid ${accent}25` }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold" style={{ color: accent }}>{name}</p>
        <span className="text-[10px] text-white/30">{pct.toFixed(0)}%</span>
      </div>
      <p className="font-bold text-white text-sm leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
      </p>
      {subtitle && <p className="text-[10px] text-white/30 mt-0.5">{subtitle}</p>}
      {/* Mini progress bar */}
      <div className="mt-2 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ width: `${Math.min(pct * 2.5, 100)}%`, background: accent, height: '100%', borderRadius: '999px' }} />
      </div>
    </div>
  );
}
