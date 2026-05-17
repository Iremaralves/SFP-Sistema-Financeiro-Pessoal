import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createServerSupabase } from '@/lib/supabase-server';
import { BottomNav } from '@/components/BottomNav';
import { DarBaixaButton } from './DarBaixaButton';
import { FiltroMes } from './FiltroMes';
import Link from 'next/link';

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

const RECURRENCE_LABEL: Record<string, string> = {
  monthly:    'Mensal',
  weekly:     'Semanal',
  bimonthly:  'Quinzenal',
  quarterly:  'Trimestral',
  semiannual: 'Semestral',
  annual:     'Anual',
};

const PAYMENT_ICON: Record<string, string> = {
  boleto:      '🏦',
  pix:         '⚡',
  credit_card: '💳',
};

const STATUS_CONFIG = {
  paid:     { label: 'Pago',       color: '#34d399', bg: 'rgba(16,185,129,0.12)',  icon: '✅' },
  overdue:  { label: 'Atrasado',   color: '#f87171', bg: 'rgba(239,68,68,0.12)',   icon: '⚠️' },
  today:    { label: 'Vence hoje', color: '#fcd34d', bg: 'rgba(245,158,11,0.12)',  icon: '🔔' },
  upcoming: { label: 'A vencer',   color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', icon: '📅' },
};

// Gera últimos 12 meses
function gerarMeses() {
  const meses = [];
  const hoje = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const value = d.toISOString().slice(0, 7);
    const label = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    meses.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return meses;
}

export default async function CompromissosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/dashboard');

  const params = await searchParams;
  const meses = gerarMeses();
  const currentMonth = meses[0]!.value;
  const mes = params.mes && meses.some(m => m.value === params.mes)
    ? params.mes
    : currentMonth;

  const mesLabel = meses.find(m => m.value === mes)?.label ?? mes;

  // Posição temporal do mês selecionado
  const hoje = new Date();
  const todayDay = hoje.getDate();
  const [selY, selM] = mes.split('-').map(Number);
  const isPast   = new Date(selY!, selM! - 1, 1) < new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const isFuture = new Date(selY!, selM! - 1, 1) > new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  // Todos os compromissos ativos
  const { data: commitments } = await supabase
    .from('recurring_commitments')
    .select('*')
    .eq('household_id', profile.household_id)
    .eq('active', true)
    .order('due_day', { ascending: true });

  // Boleto/PIX: status via monthly_obligations
  const { data: obligations } = await supabase
    .from('monthly_obligations')
    .select('recurring_id, status')
    .eq('household_id', profile.household_id)
    .eq('reference_month', mes);

  const obligationByRecurringId = new Map(
    (obligations ?? []).map(o => [o.recurring_id, o])
  );

  // Cartão: status via lançamentos
  const nextMonth = new Date(selY!, selM!, 1).toISOString().slice(0, 10);
  const { data: txRows } = await supabase
    .from('transactions').select('description')
    .eq('household_id', profile.household_id)
    .gte('occurred_on', `${mes}-01`)
    .lt('occurred_on', nextMonth);

  const txDescriptions = (txRows ?? []).map(t => t.description.toLowerCase());

  type CommitmentRow = NonNullable<typeof commitments>[0];
  type StatusKey = keyof typeof STATUS_CONFIG;

  function getStatus(c: CommitmentRow, isCreditCard: boolean): StatusKey {
    const isPaid = isCreditCard
      ? txDescriptions.some(d =>
          d.includes(c.description.toLowerCase().slice(0, 8)) ||
          c.description.toLowerCase().includes(d.slice(0, 8))
        )
      : obligationByRecurringId.get(c.id)?.status === 'paid';

    if (isPaid) return 'paid';
    if (isFuture) return 'upcoming';
    if (isPast) return 'overdue';
    if (c.due_day < todayDay) return 'overdue';
    if (c.due_day === todayDay) return 'today';
    return 'upcoming';
  }

  const rows = (commitments ?? []).map(c => {
    const isCredit = c.payment_method === 'credit_card' || !c.payment_method;
    return {
      commitment: c,
      isCredit,
      status: getStatus(c, isCredit),
      isPaid: isCredit
        ? txDescriptions.some(d =>
            d.includes(c.description.toLowerCase().slice(0, 8)) ||
            c.description.toLowerCase().includes(d.slice(0, 8))
          )
        : obligationByRecurringId.get(c.id)?.status === 'paid',
    };
  });

  const boletoPixRows = rows.filter(r => !r.isCredit);
  const creditRows    = rows.filter(r => r.isCredit);

  // Métricas boleto/PIX
  const bpTotal    = boletoPixRows.reduce((s, r) => s + Number(r.commitment.amount), 0);
  const bpPago     = boletoPixRows.filter(r => r.isPaid).reduce((s, r) => s + Number(r.commitment.amount), 0);
  const bpPendente = bpTotal - bpPago;
  const bpAtrasado = boletoPixRows.filter(r => r.status === 'overdue').reduce((s, r) => s + Number(r.commitment.amount), 0);

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-5 overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.14) 0%, transparent 70%)' }} />
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest">Contas fixas</p>
            <h1 className="text-xl font-bold text-white">{mesLabel}</h1>
          </div>
          <Link
            href="/compromissos/novo"
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all active:scale-95 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            + Nova
          </Link>
        </div>

        <Suspense fallback={null}>
          <FiltroMes meses={meses} mesSelecionado={mes} />
        </Suspense>
      </div>

      <div className="px-4 py-4 space-y-5">

        {/* ── Seção Boleto / PIX ─────────────────────────────────────────── */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">⚡ Boleto / PIX</p>
            {boletoPixRows.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-[10px]" style={{ color: '#34d399' }}>Pago {fmt(bpPago)}</span>
                {bpAtrasado > 0
                  ? <span className="text-[10px]" style={{ color: '#f87171' }}>Atrasado {fmt(bpAtrasado)}</span>
                  : <span className="text-[10px]" style={{ color: '#fcd34d' }}>Pendente {fmt(bpPendente)}</span>
                }
              </div>
            )}
          </div>

          {boletoPixRows.length === 0 ? (
            <div className="rounded-2xl px-4 py-6 text-center space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <p className="text-white/30 text-sm">Nenhuma conta por boleto/PIX</p>
              <p className="text-white/18 text-xs">Toque em <strong className="text-white/30">+ Nova</strong> para cadastrar, ou edite as existentes abaixo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {boletoPixRows.map(({ commitment: c, status, isPaid }) => {
                const cfg = STATUS_CONFIG[status];
                const recLabel = RECURRENCE_LABEL[c.recurrence_type ?? 'monthly'] ?? 'Mensal';
                const pmIcon = PAYMENT_ICON[c.payment_method ?? 'boleto'];

                return (
                  <div
                    key={c.id}
                    className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${status === 'overdue' && !isPaid ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    {/* Dia badge */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center" style={{ background: cfg.bg }}>
                      <span className="text-[9px] font-bold leading-none" style={{ color: cfg.color }}>dia</span>
                      <span className="text-base font-bold leading-none" style={{ color: cfg.color }}>{c.due_day}</span>
                    </div>

                    {/* Info — clica para editar */}
                    <Link href={`/compromissos/${c.id}`} className="flex-1 min-w-0 active:opacity-70">
                      <p className="text-white text-sm font-medium truncate">{c.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px]">{cfg.icon}</span>
                        <span className="text-[10px]" style={{ color: cfg.color }}>{cfg.label}</span>
                        <span className="text-[10px] text-white/20">·</span>
                        <span className="text-[10px] text-white/35">{pmIcon} {recLabel}</span>
                      </div>
                    </Link>

                    {/* Valor + ação */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(Number(c.amount))}
                      </span>
                      <DarBaixaButton
                        recurringId={c.id}
                        amount={Number(c.amount)}
                        referenceMonth={mes}
                        initialPaid={isPaid}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Seção Cartão de Crédito ────────────────────────────────────── */}
        {creditRows.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">💳 Cartão de crédito</p>
              <p className="text-[10px] text-indigo-400/60">Toque para editar tipo</p>
            </div>
            <div className="space-y-2">
              {creditRows.map(({ commitment: c, status }) => {
                const cfg = STATUS_CONFIG[status];
                return (
                  <Link
                    key={c.id}
                    href={`/compromissos/${c.id}`}
                    className="rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all active:scale-[0.98]"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {/* Dia */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center" style={{ background: cfg.bg }}>
                      <span className="text-[9px] font-bold leading-none" style={{ color: cfg.color }}>dia</span>
                      <span className="text-base font-bold leading-none" style={{ color: cfg.color }}>{c.due_day}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-medium truncate">{c.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px]">{cfg.icon}</span>
                        <span className="text-[10px]" style={{ color: cfg.color }}>{cfg.label}</span>
                        <span className="text-[10px] text-white/20">·</span>
                        <span className="text-[10px] text-white/30">💳 {RECURRENCE_LABEL[c.recurrence_type ?? 'monthly']}</span>
                      </div>
                    </div>

                    {/* Valor + editar */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-white/60" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(Number(c.amount))}
                      </span>
                      <span className="text-[10px] text-white/20">✎</span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <p className="text-white/18 text-[10px] text-center px-2 mt-1">
              Toque em qualquer conta para editar — mude para Boleto/PIX se necessário
            </p>
          </section>
        )}

        {rows.length === 0 && (
          <div className="text-center py-16 space-y-2">
            <p className="text-white/25 text-sm">Nenhuma conta fixa cadastrada.</p>
            <Link href="/compromissos/novo" className="text-indigo-400/60 text-sm underline underline-offset-2">
              Cadastrar primeira conta
            </Link>
          </div>
        )}
      </div>

      <BottomNav role={profile.role as 'admin' | 'operator'} />
    </div>
  );
}
