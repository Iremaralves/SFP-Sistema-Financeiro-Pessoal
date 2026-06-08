import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createServerSupabase } from '@/lib/supabase-server';
import { getEffectiveScope } from '@/lib/profile-scope';
import { BottomNav } from '@/components/BottomNav';
import { CompromissoRow } from '@/components/CompromissoRow';
import { FiltroMes } from './FiltroMes';
import { FiltrosCollapse } from './FiltrosCollapse';
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

type StatusFilter = 'todos' | 'a_pagar' | 'pagos' | 'atrasados';
type OrdemFilter = 'venc_asc' | 'venc_desc' | 'valor_desc' | 'valor_asc' | 'desc_asc';

const STATUS_FILTERS: { id: StatusFilter; label: string; color: string }[] = [
  { id: 'todos',     label: 'Todos',     color: '#94a3b8' },
  { id: 'a_pagar',   label: 'A pagar',   color: '#fcd34d' },
  { id: 'pagos',     label: 'Pagos',     color: '#34d399' },
  { id: 'atrasados', label: 'Atrasados', color: '#f87171' },
];

const ORDEM_OPCOES: { id: OrdemFilter; label: string }[] = [
  { id: 'venc_asc',   label: 'Vencimento ↑' },
  { id: 'venc_desc',  label: 'Vencimento ↓' },
  { id: 'valor_desc', label: 'Maior valor' },
  { id: 'valor_asc',  label: 'Menor valor' },
  { id: 'desc_asc',   label: 'A-Z' },
];

export default async function CompromissosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; entidade?: string; status?: string; ordem?: string }>;
}) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) redirect('/login');

  const scope = await getEffectiveScope(profile.role as 'admin' | 'operator');

  const params = await searchParams;
  const meses = gerarMeses();
  const currentMonth = meses[0]!.value;
  const mes = params.mes && meses.some(m => m.value === params.mes)
    ? params.mes
    : currentMonth;

  // Filtro de entidade: 'todos' | 'pessoal' | 'i2'
  const entidadeFiltro = params.entidade ?? 'todos';

  // Filtros novos: status + ordenação
  const statusFiltro = (params.status as StatusFilter) ?? 'todos';
  const ordem = (params.ordem as OrdemFilter) ?? 'venc_asc';

  // Helper para construir URLs preservando filtros
  function buildHref(overrides: Record<string, string>): string {
    const sp = new URLSearchParams();
    if (mes !== currentMonth) sp.set('mes', mes);
    if (entidadeFiltro !== 'todos') sp.set('entidade', entidadeFiltro);
    if (statusFiltro !== 'todos') sp.set('status', statusFiltro);
    if (ordem !== 'venc_asc') sp.set('ordem', ordem);
    for (const [k, v] of Object.entries(overrides)) {
      if (v === '' || v === 'todos' || v === 'venc_asc') sp.delete(k);
      else sp.set(k, v);
    }
    const qs = sp.toString();
    return `/compromissos${qs ? '?' + qs : ''}`;
  }

  const mesLabel = meses.find(m => m.value === mes)?.label ?? mes;

  const hoje = new Date();
  const todayDay = hoje.getDate();
  const [selY, selM] = mes.split('-').map(Number);
  const isPast   = new Date(selY!, selM! - 1, 1) < new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const isFuture = new Date(selY!, selM! - 1, 1) > new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  // Buscar entidades do household
  const { data: entities } = await supabase
    .from('entities')
    .select('id, name, type, color')
    .eq('household_id', profile.household_id)
    .eq('active', true);

  const entityMap = new Map((entities ?? []).map(e => [e.id, e]));
  const i2Entity    = (entities ?? []).find(e => e.type === 'business');
  const famEntity   = (entities ?? []).find(e => e.type === 'personal');

  // Filtrar por entidade
  let query = supabase
    .from('recurring_commitments')
    .select('*')
    .eq('household_id', profile.household_id)
    .eq('active', true)
    .order('due_day', { ascending: true });

  // Escopo global (cookie) tem prioridade sobre filtro de entidade da URL
  const effectiveEntidade = scope === 'empresa' ? 'i2'
    : scope === 'pessoal' ? 'pessoal'
    : entidadeFiltro;

  if (effectiveEntidade === 'i2' && i2Entity) {
    query = query.eq('entity_id', i2Entity.id);
  } else if (effectiveEntidade === 'pessoal' && famEntity) {
    query = query.eq('entity_id', famEntity.id);
  }

  const { data: commitments } = await query;

  // Status via monthly_obligations (boleto/pix)
  const { data: obligations } = await supabase
    .from('monthly_obligations')
    .select('recurring_id, status')
    .eq('household_id', profile.household_id)
    .eq('reference_month', `${mes}-01`);

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
    const entity = c.entity_id ? entityMap.get(c.entity_id) : null;
    return {
      commitment: c,
      isCredit,
      entity,
      status: getStatus(c, isCredit),
      isPaid: isCredit
        ? txDescriptions.some(d =>
            d.includes(c.description.toLowerCase().slice(0, 8)) ||
            c.description.toLowerCase().includes(d.slice(0, 8))
          )
        : obligationByRecurringId.get(c.id)?.status === 'paid',
    };
  });

  // Aplicar filtro de status
  let filteredRows = rows;
  if (statusFiltro === 'a_pagar')   filteredRows = rows.filter(r => !r.isPaid);
  if (statusFiltro === 'pagos')     filteredRows = rows.filter(r => r.isPaid);
  if (statusFiltro === 'atrasados') filteredRows = rows.filter(r => r.status === 'overdue' && !r.isPaid);

  // Aplicar ordenação
  filteredRows = [...filteredRows].sort((a, b) => {
    if (ordem === 'venc_asc')   return a.commitment.due_day - b.commitment.due_day;
    if (ordem === 'venc_desc')  return b.commitment.due_day - a.commitment.due_day;
    if (ordem === 'valor_desc') return Number(b.commitment.amount) - Number(a.commitment.amount);
    if (ordem === 'valor_asc')  return Number(a.commitment.amount) - Number(b.commitment.amount);
    if (ordem === 'desc_asc')   return a.commitment.description.localeCompare(b.commitment.description);
    return 0;
  });

  const boletoPixRows = filteredRows.filter(r => !r.isCredit);
  const creditRows    = filteredRows.filter(r => r.isCredit);

  // Métricas boleto/PIX
  const bpTotal    = boletoPixRows.reduce((s, r) => s + Number(r.commitment.amount), 0);
  const bpPago     = boletoPixRows.filter(r => r.isPaid).reduce((s, r) => s + Number(r.commitment.amount), 0);
  const bpPendente = bpTotal - bpPago;
  const bpAtrasado = boletoPixRows.filter(r => r.status === 'overdue').reduce((s, r) => s + Number(r.commitment.amount), 0);

  // Tabs de entidade
  const tabs = [
    { id: 'todos',   label: 'Todas',          color: '#6366f1' },
    { id: 'pessoal', label: famEntity?.name ?? 'Família', color: famEntity?.color ?? '#3b82f6' },
    { id: 'i2',      label: i2Entity?.name ?? 'i2',       color: i2Entity?.color ?? '#f59e0b' },
  ];

  return (
    <div className="min-h-screen pb-28 md:pl-60">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-4 overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
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

        {/* Linha de filtros: Status (visível) + botão "Filtros" (entidade + ordenação) */}
        <div className="flex gap-1.5 mt-3 items-center flex-wrap">
          {STATUS_FILTERS.map(sf => {
            const isActive = statusFiltro === sf.id;
            return (
              <Link
                key={sf.id}
                href={buildHref({ status: sf.id })}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex-shrink-0 transition-all"
                style={{
                  background: isActive ? `${sf.color}22` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? sf.color + '55' : 'rgba(255,255,255,0.08)'}`,
                  color: isActive ? sf.color : 'rgba(255,255,255,0.4)',
                }}
              >
                {sf.label}
              </Link>
            );
          })}
          <FiltrosCollapse
            entidadeFiltro={entidadeFiltro}
            ordem={ordem}
            tabs={tabs}
            ordemOpcoes={ORDEM_OPCOES.map(o => ({ id: o.id, label: o.label }))}
            buildHref={buildHref}
          />
        </div>
      </div>

      <div className="px-4 md:px-8 py-4 space-y-5 page-container">

        {/* ── Seção Boleto / PIX ─────────────────────────────── */}
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
              {boletoPixRows.map(({ commitment: c, status, isPaid, entity }) => (
                <CompromissoRow
                  key={c.id}
                  commitmentId={c.id}
                  description={c.description}
                  dueDay={c.due_day}
                  amount={Number(c.amount)}
                  paymentMethod={c.payment_method}
                  recurrenceType={c.recurrence_type}
                  responsible={c.responsible}
                  paidBy={c.paid_by}
                  status={status as 'overdue' | 'today' | 'upcoming' | 'paid'}
                  isPaid={isPaid}
                  entity={entity ?? null}
                  referenceMonth={mes}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Seção Cartão de Crédito ────────────────────────── */}
        {creditRows.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">💳 Cartão de crédito</p>
              <p className="text-[10px] text-indigo-400/60">Toque para editar tipo</p>
            </div>
            <div className="space-y-2">
              {creditRows.map(({ commitment: c, status, isPaid, entity }) => (
                <CompromissoRow
                  key={c.id}
                  commitmentId={c.id}
                  description={c.description}
                  dueDay={c.due_day}
                  amount={Number(c.amount)}
                  paymentMethod={c.payment_method}
                  recurrenceType={c.recurrence_type}
                  responsible={c.responsible}
                  paidBy={c.paid_by}
                  status={status as 'overdue' | 'today' | 'upcoming' | 'paid'}
                  isPaid={isPaid}
                  entity={entity ?? null}
                  referenceMonth={mes}
                  isCreditCard
                />
              ))}
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

      <BottomNav role={profile.role as 'admin' | 'operator'} name={profile.name ?? ''} scope={scope} />
    </div>
  );
}
