import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { BottomNav } from '@/components/BottomNav';
import { DarBaixaButton } from './DarBaixaButton';
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
  boleto: '🏦',
  pix:    '⚡',
  credit_card: '💳',
};

const STATUS_CONFIG = {
  paid:     { label: 'Pago',       color: '#34d399', bg: 'rgba(16,185,129,0.12)',  icon: '✅' },
  overdue:  { label: 'Atrasado',   color: '#f87171', bg: 'rgba(239,68,68,0.12)',   icon: '⚠️' },
  today:    { label: 'Vence hoje', color: '#fcd34d', bg: 'rgba(245,158,11,0.12)',  icon: '🔔' },
  upcoming: { label: 'A vencer',   color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', icon: '📅' },
};

export default async function CompromissosPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/dashboard');

  const { data: commitments } = await supabase
    .from('recurring_commitments')
    .select('*')
    .eq('household_id', profile.household_id)
    .eq('active', true)
    .order('due_day', { ascending: true });

  const today = new Date().getDate();
  const month = new Date().toISOString().slice(0, 7);
  const [lbl_y, lbl_m] = month.split('-').map(Number);
  const monthLabel = new Date(lbl_y!, lbl_m! - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  // ── Boleto/PIX: verificar pagamentos via monthly_obligations ──────────────
  const { data: obligations } = await supabase
    .from('monthly_obligations')
    .select('recurring_id, status, paid_on, paid_amount')
    .eq('household_id', profile.household_id)
    .eq('reference_month', month);

  const paidByRecurringId = new Map(
    (obligations ?? []).map(o => [o.recurring_id, o.status === 'paid'])
  );

  // ── Cartão crédito: verificar via lançamentos (fuzzy match) ───────────────
  const [my, mm] = month.split('-').map(Number);
  const nextMonth = new Date(my!, mm!, 1).toISOString().slice(0, 10);
  const { data: txRows } = await supabase
    .from('transactions').select('description, amount')
    .eq('household_id', profile.household_id)
    .gte('occurred_on', `${month}-01`)
    .lt('occurred_on', nextMonth);

  const txDescriptions = (txRows ?? []).map(t => t.description.toLowerCase());

  type CommitmentRow = NonNullable<typeof commitments>[0];
  type StatusKey = keyof typeof STATUS_CONFIG;

  function getStatus(c: CommitmentRow, isCreditCard: boolean): StatusKey {
    let isPaid: boolean;
    if (isCreditCard) {
      isPaid = txDescriptions.some(d =>
        d.includes(c.description.toLowerCase().slice(0, 8)) ||
        c.description.toLowerCase().includes(d.slice(0, 8))
      );
    } else {
      isPaid = paidByRecurringId.get(c.id) ?? false;
    }
    if (isPaid) return 'paid';
    if (c.due_day < today) return 'overdue';
    if (c.due_day === today) return 'today';
    return 'upcoming';
  }

  const rows = (commitments ?? []).map(c => ({
    commitment: c,
    status: getStatus(c, c.payment_method === 'credit_card' || !c.payment_method),
  }));

  // Separar por tipo de pagamento
  const boletoPixRows = rows.filter(r =>
    r.commitment.payment_method === 'boleto' || r.commitment.payment_method === 'pix'
  );
  const creditRows = rows.filter(r =>
    r.commitment.payment_method === 'credit_card' || !r.commitment.payment_method
  );

  // Métricas boleto/PIX
  const bpTotal = boletoPixRows.reduce((s, r) => s + Number(r.commitment.amount), 0);
  const bpPago = boletoPixRows.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.commitment.amount), 0);
  const bpPendente = bpTotal - bpPago;
  const bpAtrasado = boletoPixRows.filter(r => r.status === 'overdue').reduce((s, r) => s + Number(r.commitment.amount), 0);

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-5 overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.14) 0%, transparent 70%)' }} />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest capitalize">{monthLabel}</p>
            <h1 className="text-xl font-bold text-white">Contas fixas</h1>
          </div>
          <Link
            href="/compromissos/novo"
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all active:scale-95 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            + Nova
          </Link>
        </div>
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
            <div className="rounded-2xl px-4 py-6 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
              <p className="text-white/25 text-sm">Nenhuma conta por boleto/PIX</p>
            </div>
          ) : (
            <div className="space-y-2">
              {boletoPixRows.map(({ commitment: c, status }) => {
                const cfg = STATUS_CONFIG[status];
                const recLabel = RECURRENCE_LABEL[c.recurrence_type ?? 'monthly'] ?? 'Mensal';
                const pmIcon = PAYMENT_ICON[c.payment_method ?? 'boleto'];

                return (
                  <div
                    key={c.id}
                    className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
                    style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${status === 'overdue' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}` }}
                  >
                    {/* Dia */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center" style={{ background: cfg.bg }}>
                      <span className="text-[9px] font-bold leading-none" style={{ color: cfg.color }}>dia</span>
                      <span className="text-base font-bold leading-none" style={{ color: cfg.color }}>{c.due_day}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{c.description}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px]">{cfg.icon}</span>
                        <span className="text-[10px]" style={{ color: cfg.color }}>{cfg.label}</span>
                        <span className="text-[10px] text-white/25">·</span>
                        <span className="text-[10px] text-white/35">{pmIcon} {recLabel}</span>
                      </div>
                    </div>

                    {/* Valor + ação */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(Number(c.amount))}
                      </span>
                      {status !== 'paid' && (
                        <DarBaixaButton recurringId={c.id} amount={Number(c.amount)} />
                      )}
                      {status === 'paid' && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                          ✓ Pago
                        </span>
                      )}
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
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider px-1">💳 Cartão de crédito</p>
            <div className="space-y-2">
              {creditRows.map(({ commitment: c, status }) => {
                const cfg = STATUS_CONFIG[status];
                return (
                  <div
                    key={c.id}
                    className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center" style={{ background: cfg.bg }}>
                      <span className="text-[9px] font-bold leading-none" style={{ color: cfg.color }}>dia</span>
                      <span className="text-base font-bold leading-none" style={{ color: cfg.color }}>{c.due_day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/70 text-sm font-medium truncate">{c.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px]">{cfg.icon}</span>
                        <span className="text-[10px]" style={{ color: cfg.color }}>{cfg.label}</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-white/60 flex-shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(Number(c.amount))}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-white/20 text-[10px] text-center px-2">
              Contas no cartão são rastreadas automaticamente via importação do CSV
            </p>
          </section>
        )}

        {rows.length === 0 && (
          <div className="text-center py-12 text-white/25 text-sm">
            Nenhuma conta fixa cadastrada ainda.
          </div>
        )}
      </div>

      <BottomNav role={profile.role as 'admin' | 'operator'} />
    </div>
  );
}

