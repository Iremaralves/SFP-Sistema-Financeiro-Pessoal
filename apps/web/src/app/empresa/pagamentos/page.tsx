import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { BottomNav } from '@/components/BottomNav';
import { CofrePlanner } from './CofrePlanner';
import { DarBaixaButton } from '../../compromissos/DarBaixaButton';
import Link from 'next/link';

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function gerarMeses() {
  const meses = [];
  const hoje = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const value = d.toISOString().slice(0, 7);
    const label = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    meses.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return meses;
}

export default async function PlanejadorPagamentosPage({
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
  const mes = params.mes && meses.some(m => m.value === params.mes) ? params.mes : currentMonth;
  const mesLabel = meses.find(m => m.value === mes)?.label ?? mes;
  const [my, mm] = mes.split('-').map(Number);

  // ── Entidade i2 ────────────────────────────────────────────────────────
  const { data: entities } = await supabase
    .from('entities').select('id, name, type')
    .eq('household_id', profile.household_id).eq('active', true);
  const i2Entity = (entities ?? []).find(e => e.type === 'business');

  // ── Compromissos i2 pagos via Inter PJ (boleto/pix) ───────────────────
  const { data: commitmentsRaw } = await supabase
    .from('recurring_commitments')
    .select('id, description, amount, due_day, payment_method, recurrence_type, responsible, paid_by, variable, entity_id')
    .eq('household_id', profile.household_id)
    .eq('active', true);

  const i2Commitments = (commitmentsRaw ?? []).filter(c =>
    c.entity_id === i2Entity?.id &&
    (c.payment_method === 'boleto' || c.payment_method === 'pix'),
  );

  // ── Status do mês via monthly_obligations ─────────────────────────────
  const { data: obligations } = await supabase
    .from('monthly_obligations')
    .select('recurring_id, status, amount, paid_amount, due_date')
    .eq('household_id', profile.household_id)
    .eq('reference_month', `${mes}-01`);

  const oblByRec = new Map((obligations ?? []).map(o => [o.recurring_id, o]));

  // ── Contas: Inter PJ + cofres (investment) ────────────────────────────
  const { data: accountRows } = await supabase
    .from('accounts').select('id, name, kind, opening_balance')
    .eq('household_id', profile.household_id).eq('active', true);

  const { data: allTx } = await supabase
    .from('transactions').select('account_id, amount')
    .eq('household_id', profile.household_id);

  const balByAccount = new Map<string, number>();
  for (const t of (allTx ?? [])) {
    balByAccount.set(t.account_id, (balByAccount.get(t.account_id) ?? 0) + Number(t.amount));
  }
  const accountBalance = (a: { id: string; opening_balance: number | null }) =>
    Number(a.opening_balance ?? 0) + (balByAccount.get(a.id) ?? 0);

  const interPJ   = (accountRows ?? []).find(a => a.kind === 'company');
  const cofres    = (accountRows ?? []).filter(a => a.kind === 'investment')
    .map(a => ({ id: a.id, name: a.name, balance: accountBalance(a) }));

  const saldoInterPJ = interPJ ? accountBalance(interPJ) : 0;

  // ── Monta lista de pagamentos do mês ──────────────────────────────────
  type PayItem = {
    id: string; description: string; amount: number; dueDay: number;
    paymentMethod: string; paid: boolean; paidBy: string; responsible: string;
  };
  const items: PayItem[] = i2Commitments.map(c => {
    const obl = oblByRec.get(c.id);
    // valor do mês: override da obrigação (variável) tem prioridade, senão o recorrente
    const amount = obl?.amount != null ? Number(obl.amount) : Number(c.amount);
    return {
      id: c.id,
      description: c.description,
      amount,
      dueDay: c.due_day,
      paymentMethod: c.payment_method as string,
      paid: obl?.status === 'paid',
      paidBy: c.paid_by,
      responsible: c.responsible,
    };
  }).sort((a, b) => a.dueDay - b.dueDay);

  const pendentes = items.filter(i => !i.paid);
  const pagos     = items.filter(i => i.paid);
  const totalAPagar = pendentes.reduce((s, i) => s + i.amount, 0);
  const totalPago   = pagos.reduce((s, i) => s + i.amount, 0);
  const totalMes    = totalAPagar + totalPago;

  // ── Cálculo do cofre ──────────────────────────────────────────────────
  const deficit = Math.max(0, totalAPagar - saldoInterPJ);
  // Ordem: cofres na ordem que vieram (Caixinha tende a vir primeiro); consome cascata
  let restante = deficit;
  const resgatePorCofre = cofres.map(c => {
    const tirar = Math.min(restante, Math.max(0, c.balance));
    restante -= tirar;
    return { ...c, tirar };
  });
  const cofreInsuficiente = restante > 0.001;

  const isCurrent = mes === currentMonth;

  return (
    <div className="min-h-screen pb-28 md:pl-60">
      {/* Header */}
      <div className="relative px-5 md:px-8 pt-14 md:pt-8 pb-5 overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(245,158,11,0.16) 0%, transparent 70%)' }} />
        <div className="flex items-center justify-between mb-1">
          <p className="text-amber-400/50 text-xs uppercase tracking-widest">🏢 i2 · Pagamentos</p>
          <Link href="/compromissos/novo"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
            + Pessoa/conta
          </Link>
        </div>
        <h1 className="text-xl font-bold text-white capitalize">{mesLabel}</h1>

        {/* Seletor de mês */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto hide-scrollbar">
          {meses.map(m => {
            const active = m.value === mes;
            return (
              <Link key={m.value}
                href={m.value === currentMonth ? '/empresa/pagamentos' : `/empresa/pagamentos?mes=${m.value}`}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex-shrink-0 transition-all"
                style={{
                  background: active ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? 'rgba(245,158,11,0.45)' : 'rgba(255,255,255,0.08)'}`,
                  color: active ? '#fbbf24' : 'rgba(255,255,255,0.4)',
                }}>
                {m.label.split(' ')[0]}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="px-4 md:px-8 py-4 space-y-3 page-container">

        {/* ── NÚMERO-ÂNCORA: total a desembolsar ─────────────────── */}
        <div className="relative rounded-3xl px-5 py-6 md:px-8 md:py-7 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="absolute top-0 right-0 w-56 h-56 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 100% 0%, rgba(245,158,11,0.16), transparent 70%)' }} />
          <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">
            {isCurrent ? 'Total a desembolsar este mês' : 'Total a desembolsar'}
          </p>
          <p className="text-5xl md:text-6xl font-bold leading-none tracking-tight text-white tabular">
            {fmt(totalAPagar)}
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs">
            {totalPago > 0 && (
              <span className="text-emerald-400/70">✓ {fmt(totalPago)} já pago</span>
            )}
            <span className="text-white/30">{pendentes.length} a pagar · {fmt(totalMes)} no mês</span>
          </div>
        </div>

        {/* ── Card do cofre ──────────────────────────────────────── */}
        {interPJ && (
          <CofrePlanner
            saldoInterPJ={saldoInterPJ}
            totalAPagar={totalAPagar}
            deficit={deficit}
            interPJId={interPJ.id}
            interPJName={interPJ.name}
            resgates={resgatePorCofre}
            cofreInsuficiente={cofreInsuficiente}
            restante={restante}
          />
        )}

        {/* ── Lista de pagamentos pendentes ──────────────────────── */}
        <section className="space-y-2">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider px-1">
            A pagar ({pendentes.length})
          </p>
          {pendentes.length === 0 ? (
            <div className="rounded-2xl px-4 py-6 text-center" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)' }}>
              <p className="text-emerald-300 text-sm font-semibold">✓ Tudo pago este mês</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendentes.map(item => {
                const venceDia = item.dueDay;
                return (
                  <div key={item.id}
                    className="rounded-2xl px-4 py-3 flex items-center gap-3"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center"
                      style={{ background: 'rgba(245,158,11,0.12)' }}>
                      <span className="text-[8px] font-bold leading-none text-amber-400/70">dia</span>
                      <span className="text-base font-bold leading-none text-amber-400">{venceDia}</span>
                    </div>
                    <Link href={`/compromissos/${item.id}`} className="flex-1 min-w-0 active:opacity-70">
                      <p className="text-white text-sm font-medium truncate">{item.description}</p>
                      <p className="text-[10px] text-white/35 mt-0.5">
                        {item.paymentMethod === 'pix' ? '⚡ PIX' : '🏦 Boleto'}
                        {item.responsible !== 'i2' && ` · ${item.responsible}`}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-white tabular">{fmt(item.amount)}</span>
                      <DarBaixaButton
                        recurringId={item.id}
                        amount={item.amount}
                        referenceMonth={mes}
                        initialPaid={false}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Pagos ──────────────────────────────────────────────── */}
        {pagos.length > 0 && (
          <section className="space-y-2">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider px-1">
              Pagos ({pagos.length})
            </p>
            <div className="space-y-1.5">
              {pagos.map(item => (
                <div key={item.id}
                  className="rounded-xl px-3 py-2 flex items-center gap-3 opacity-60"
                  style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)' }}>
                  <span className="text-sm">✅</span>
                  <p className="text-white/70 text-xs flex-1 truncate">{item.description}</p>
                  <span className="text-emerald-400/70 text-xs font-medium tabular">{fmt(item.amount)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {i2Commitments.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <p className="text-white/30 text-sm">Nenhum pagamento da i2 cadastrado ainda.</p>
            <Link href="/compromissos/novo" className="text-amber-400/70 text-sm underline underline-offset-2">
              Cadastrar primeira pessoa/conta (responsável: i2)
            </Link>
          </div>
        )}
      </div>

      <BottomNav role={profile.role as 'admin' | 'operator'} name={profile.name ?? ''} scope="empresa" />
    </div>
  );
}
