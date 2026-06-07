import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { getEffectiveScope } from '@/lib/profile-scope';
import { BottomNav } from '@/components/BottomNav';
import Link from 'next/link';

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export default async function AcertoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  if (!profile) redirect('/login');

  const params = await searchParams;
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7);
  const mes = params.mes ?? currentMonth;
  const [my, mm] = mes.split('-').map(Number);
  const nextMonth = new Date(my!, mm!, 1).toISOString().slice(0, 10);
  const mesDate = `${mes}-01`;
  const mesLabel = new Date(my!, mm! - 1, 1)
    .toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  // Compromissos fixos do mês + obrigações
  const [
    { data: commitments },
    { data: obligations },
    { data: cardTx },
  ] = await Promise.all([
    supabase.from('recurring_commitments')
      .select('id, description, amount, responsible, paid_by, payment_method, due_day')
      .eq('household_id', profile.household_id)
      .eq('active', true),
    supabase.from('monthly_obligations')
      .select('recurring_id, status, paid_amount, amount')
      .eq('household_id', profile.household_id)
      .eq('reference_month', mesDate),
    supabase.from('transactions')
      .select('description, amount, responsible')
      .eq('household_id', profile.household_id)
      .gte('occurred_on', `${mes}-01`)
      .lt('occurred_on', nextMonth),
  ]);

  const obligationMap = new Map((obligations ?? []).map(o => [o.recurring_id, o]));

  // ── Juliana pagou por Iremar (boletos/PIX) ─────────────────────
  const julianaPayouts = (commitments ?? [])
    .filter(c => c.payment_method !== 'credit_card')
    .filter(c => c.paid_by === 'juliana' && c.responsible !== 'juliana')
    .map(c => {
      const obl = obligationMap.get(c.id);
      return {
        description: c.description,
        amount: Number(obl?.paid_amount ?? obl?.amount ?? c.amount),
        paid: obl?.status === 'paid',
        responsible: c.responsible,
      };
    });
  const julianaTotal = julianaPayouts.reduce((s, p) => s + p.amount, 0);

  // ── Iremar paga pela Juliana (cartão — transactions com responsible=juliana) ─
  const iremarPayouts = (cardTx ?? [])
    .filter(t => t.responsible === 'juliana')
    .map(t => ({ description: t.description, amount: Math.abs(Number(t.amount)) }));
  const iremarTotal = iremarPayouts.reduce((s, p) => s + p.amount, 0);

  // Casal (50/50) no cartão — metade fica com Juliana
  const casalCardTx = (cardTx ?? [])
    .filter(t => t.responsible === 'casal');
  const casalTotal = casalCardTx.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const casalJulianaPart = casalTotal / 2;

  // ── Cálculo do acerto ──────────────────────────────────────────
  const deveJulianaPagar = iremarTotal + casalJulianaPart;
  const deveIremarReembolsar = julianaTotal;
  const saldo = deveJulianaPagar - deveIremarReembolsar;
  // saldo > 0: Juliana transfere para Iremar
  // saldo < 0: Iremar transfere para Juliana

  const scope = await getEffectiveScope(profile.role as 'admin' | 'operator');


  return (
    <div className="min-h-screen pb-28 md:pl-60">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-5 overflow-hidden"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(236,72,153,0.12) 0%, transparent 70%)' }} />
        <div className="flex items-center gap-3">
          <Link href="/contas"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>‹</Link>
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest capitalize">Acerto · {mesLabel}</p>
            <h1 className="text-xl font-bold text-white">Fechamento Iremar × Juliana</h1>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-5 space-y-3 page-container" style={{ maxWidth: 'min(100%, 56rem)' }}>
        {/* Resultado final */}
        <div
          className="rounded-3xl p-5"
          style={{
            background: Math.abs(saldo) < 0.01
              ? 'rgba(16,185,129,0.08)'
              : saldo > 0
                ? 'rgba(59,130,246,0.08)'
                : 'rgba(236,72,153,0.08)',
            border: `1px solid ${Math.abs(saldo) < 0.01 ? 'rgba(16,185,129,0.25)' : saldo > 0 ? 'rgba(59,130,246,0.25)' : 'rgba(236,72,153,0.25)'}`,
          }}
        >
          <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Resultado do acerto</p>
          {Math.abs(saldo) < 0.01 ? (
            <>
              <p className="text-3xl font-bold" style={{ color: '#34d399' }}>✓ Quitado</p>
              <p className="text-white/40 text-sm mt-1">Nenhuma transferência necessária</p>
            </>
          ) : saldo > 0 ? (
            <>
              <p className="text-3xl font-bold text-blue-300" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {fmt(saldo)}
              </p>
              <p className="text-white/60 text-sm mt-1">
                <span className="font-semibold text-pink-300">Juliana</span> transfere para{' '}
                <span className="font-semibold text-blue-300">Iremar</span>
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-pink-300" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {fmt(Math.abs(saldo))}
              </p>
              <p className="text-white/60 text-sm mt-1">
                <span className="font-semibold text-blue-300">Iremar</span> transfere para{' '}
                <span className="font-semibold text-pink-300">Juliana</span>
              </p>
            </>
          )}
        </div>

        {/* Juliana pagou pelo Iremar */}
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.15)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-pink-300 text-xs font-semibold uppercase tracking-wider">
              💸 Juliana pagou pelo Iremar
            </p>
            <span className="text-pink-300 text-sm font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmt(julianaTotal)}
            </span>
          </div>
          <div className="space-y-1.5">
            {julianaPayouts.length === 0 && (
              <p className="text-white/30 text-xs">Nenhum boleto/PIX pago pela Juliana este mês</p>
            )}
            {julianaPayouts.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-0.5">
                <span className="text-white/70 truncate">
                  {p.paid ? '✓' : '○'} {p.description}
                </span>
                <span className="text-white/60" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(p.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Iremar paga pela Juliana (cartão) */}
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider">
              💳 Iremar paga pela Juliana (cartão)
            </p>
            <span className="text-blue-300 text-sm font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmt(iremarTotal + casalJulianaPart)}
            </span>
          </div>
          <div className="space-y-1.5">
            {iremarTotal > 0 && (
              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="text-white/70">Compras dela no cartão</span>
                <span className="text-white/60" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(iremarTotal)}</span>
              </div>
            )}
            {casalTotal > 0 && (
              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="text-white/70">Parte dela em compras do casal ({fmt(casalTotal)} ÷ 2)</span>
                <span className="text-white/60" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(casalJulianaPart)}</span>
              </div>
            )}
            {iremarTotal === 0 && casalTotal === 0 && (
              <p className="text-white/30 text-xs">Nenhuma compra dela no cartão este mês</p>
            )}
          </div>
        </div>

        {/* Cálculo */}
        <div className="rounded-2xl p-4 space-y-1.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Cálculo</p>
          <div className="flex justify-between text-xs">
            <span className="text-white/60">Juliana deve para Iremar (cartão dela)</span>
            <span className="text-white/80" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(deveJulianaPagar)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/60">Iremar deve para Juliana (boletos pagos)</span>
            <span className="text-white/80" style={{ fontVariantNumeric: 'tabular-nums' }}>−{fmt(deveIremarReembolsar)}</span>
          </div>
          <div className="border-t border-white/10 my-1.5" />
          <div className="flex justify-between text-xs font-bold">
            <span className="text-white">Saldo final</span>
            <span style={{
              color: Math.abs(saldo) < 0.01 ? '#34d399' : saldo > 0 ? '#93c5fd' : '#f9a8d4',
              fontVariantNumeric: 'tabular-nums'
            }}>{saldo >= 0 ? '' : '-'}{fmt(Math.abs(saldo))}</span>
          </div>
        </div>

        <p className="text-white/25 text-[10px] text-center pt-2 px-4">
          O acerto é feito no dia 13 de cada mês, no fechamento da fatura do cartão.
        </p>
      </div>

      <BottomNav role={profile.role as 'admin' | 'operator'} name={profile.name ?? ''} scope={scope} />
    </div>
  );
}
