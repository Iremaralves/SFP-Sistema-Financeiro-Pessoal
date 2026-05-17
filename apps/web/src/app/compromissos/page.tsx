import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
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
  const monthLabel = new Date(lbl_y, lbl_m - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  // Get current month transactions to check paid status
  const [my, mm] = month.split('-').map(Number);
  const nextMonth = new Date(my, mm, 1).toISOString().slice(0, 10);
  const { data: txRows } = await supabase
    .from('transactions').select('description, amount, occurred_on')
    .eq('household_id', profile.household_id)
    .gte('occurred_on', `${month}-01`)
    .lt('occurred_on', nextMonth);

  const txDescriptions = (txRows ?? []).map(t => t.description.toLowerCase());

  const rows = (commitments ?? []).map(c => {
    const isPaid = txDescriptions.some(d =>
      d.includes(c.description.toLowerCase().slice(0, 8)) ||
      c.description.toLowerCase().includes(d.slice(0, 8))
    );
    let status: 'paid' | 'overdue' | 'today' | 'upcoming';
    if (isPaid) status = 'paid';
    else if (c.due_day < today) status = 'overdue';
    else if (c.due_day === today) status = 'today';
    else status = 'upcoming';
    return { ...c, status };
  });

  const totalFixo = rows.reduce((s, c) => s + Number(c.amount), 0);
  const totalPago = rows.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.amount), 0);
  const totalPendente = rows.filter(c => c.status !== 'paid').reduce((s, c) => s + Number(c.amount), 0);
  const totalAtrasado = rows.filter(c => c.status === 'overdue').reduce((s, c) => s + Number(c.amount), 0);

  const STATUS_CONFIG = {
    paid:     { label: 'Pago',      color: '#34d399', bg: 'rgba(16,185,129,0.12)',  icon: '✅' },
    overdue:  { label: 'Atrasado',  color: '#f87171', bg: 'rgba(239,68,68,0.12)',   icon: '⚠️' },
    today:    { label: 'Vence hoje',color: '#fcd34d', bg: 'rgba(245,158,11,0.12)',  icon: '🔔' },
    upcoming: { label: 'A vencer',  color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', icon: '📅' },
  };

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-5 overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.14) 0%, transparent 70%)' }} />
        <div className="flex items-center gap-3 mb-1">
          <Link href="/contas" className="w-8 h-8 flex items-center justify-center rounded-xl text-white/50 hover:text-white" style={{ background: 'rgba(255,255,255,0.07)' }}>‹</Link>
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest capitalize">{monthLabel}</p>
            <h1 className="text-xl font-bold text-white">Contas fixas</h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">

        {/* Resumo 3 métricas */}
        <div className="grid grid-cols-3 gap-2">
          <MetricCard label="Total fixo" value={fmt(totalFixo)} color="#94a3b8" />
          <MetricCard label="Pago" value={fmt(totalPago)} color="#34d399" />
          <MetricCard label={totalAtrasado > 0 ? "Atrasado" : "Pendente"} value={fmt(totalAtrasado > 0 ? totalAtrasado : totalPendente)} color={totalAtrasado > 0 ? "#f87171" : "#fcd34d"} />
        </div>

        {/* Lista de compromissos */}
        <div className="space-y-2">
          {rows.map(c => {
            const cfg = STATUS_CONFIG[c.status];
            return (
              <div key={c.id} className="rounded-2xl px-4 py-3.5 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Due day badge */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center" style={{ background: cfg.bg }}>
                  <span className="text-xs font-bold leading-none" style={{ color: cfg.color }}>dia</span>
                  <span className="text-base font-bold leading-none" style={{ color: cfg.color }}>{c.due_day}</span>
                </div>

                {/* Description */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{c.description}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px]">{cfg.icon}</span>
                    <span className="text-[10px]" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                </div>

                {/* Amount */}
                <span className="text-sm font-semibold text-white flex-shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(Number(c.amount))}
                </span>
              </div>
            );
          })}
        </div>

        {rows.length === 0 && (
          <div className="text-center py-10 text-white/25 text-sm">
            Nenhuma conta fixa cadastrada.
          </div>
        )}

        {/* Adicionar nova conta */}
        <Link
          href="/compromissos/novo"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-semibold text-white/50 hover:text-white/70 transition-all"
          style={{ border: '1px dashed rgba(255,255,255,0.12)' }}
        >
          + Adicionar conta fixa
        </Link>
      </div>

      <BottomNav role="admin" />
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-bold" style={{ color, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
    </div>
  );
}
