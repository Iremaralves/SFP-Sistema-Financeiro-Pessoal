import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createServerSupabase } from '@/lib/supabase-server';
import { BottomNav } from '@/components/BottomNav';
import { FaturamentoForm } from './FaturamentoForm';
import { FiscalNoteForm } from './FiscalNoteForm';
import Link from 'next/link';

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

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

const STATUS_DOT: Record<string, string> = {
  paid: '#34d399',
  pending: '#f87171',
};

export default async function EmpresaPage({
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
  const mesDate = `${mes}-01`;
  const [selY, selM] = mes.split('-').map(Number);
  const nextMonthDate = new Date(selY!, selM!, 1).toISOString().slice(0, 10);
  const mesLabel = meses.find(m => m.value === mes)?.label ?? mes;

  // Entidade i2
  const { data: i2Entity } = await supabase
    .from('entities').select('id, name, color')
    .eq('household_id', profile.household_id)
    .eq('type', 'business')
    .single();

  if (!i2Entity) redirect('/dashboard');

  // Transações PJ do mês
  const { data: txRows } = await supabase
    .from('transactions')
    .select('id, description, amount, occurred_on, responsible')
    .eq('household_id', profile.household_id)
    .eq('entity_id', i2Entity.id)
    .gte('occurred_on', mesDate)
    .lt('occurred_on', nextMonthDate)
    .order('occurred_on', { ascending: false });

  // Contas fixas PJ
  const { data: compromissos } = await supabase
    .from('recurring_commitments')
    .select('id, description, amount, due_day, payment_method')
    .eq('household_id', profile.household_id)
    .eq('entity_id', i2Entity.id)
    .eq('active', true)
    .order('due_day');

  // Status das obrigações PJ do mês
  const compromissoIds = (compromissos ?? []).map(c => c.id);
  const { data: obligations } = await supabase
    .from('monthly_obligations')
    .select('recurring_id, status, paid_amount')
    .eq('household_id', profile.household_id)
    .eq('reference_month', mesDate)
    .in('recurring_id', compromissoIds.length > 0 ? compromissoIds : ['00000000-0000-0000-0000-000000000000']);

  const obrigacaoMap = new Map((obligations ?? []).map(o => [o.recurring_id, o]));

  // Receitas PJ do mês (faturamento_i2 + pro_labore) + Notas Fiscais vinculadas
  const { data: incomeRows } = await supabase
    .from('income_records')
    .select('id, kind, amount, description')
    .eq('household_id', profile.household_id)
    .eq('reference_month', mesDate);

  const faturamento = (incomeRows ?? []).find(r => r.kind === 'faturamento_i2') ?? null;
  const proLabore   = (incomeRows ?? []).find(r => r.kind === 'pro_labore')     ?? null;

  // Nota Fiscal vinculada ao faturamento do mês
  const { data: fiscalNote } = faturamento
    ? await supabase
        .from('fiscal_notes')
        .select('*')
        .eq('income_record_id', faturamento.id)
        .maybeSingle()
    : { data: null };

  // ── DRE ──────────────────────────────────────────────
  const receita       = faturamento?.amount ?? 0;
  const despesasTx    = (txRows ?? []).reduce((s, t) => s + Math.abs(t.amount), 0);
  const despesasFixed = (compromissos ?? []).reduce((s, c) => s + Number(c.amount), 0);
  const totalDespesas = despesasTx + despesasFixed;
  const proLaboreVal  = proLabore?.amount ?? 0;
  const resultado     = receita - totalDespesas - proLaboreVal;

  // Navegação de meses
  const idx = meses.findIndex(m => m.value === mes);
  const prevMes = meses[idx + 1]?.value;
  const nextMes = idx > 0 ? meses[idx - 1]?.value : null;

  function mesHref(m: string) {
    return m === currentMonth ? '/empresa' : `/empresa?mes=${m}`;
  }

  return (
    <div className="min-h-screen pb-28 md:pl-60">
      {/* Header */}
      <div
        className="relative px-5 pt-14 pb-5 overflow-hidden"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(245,158,11,0.14) 0%, transparent 70%)' }} />

        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest">Empresa</p>
            <h1 className="text-xl font-bold text-white">{i2Entity.name}</h1>
          </div>
          <Link
            href="/compromissos?entidade=i2"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl text-white/60 transition-all"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            Contas fixas ›
          </Link>
        </div>

        {/* Seletor de mês */}
        <div className="flex items-center gap-2 mt-4">
          <Link
            href={prevMes ? mesHref(prevMes) : '#'}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-white/40 flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', pointerEvents: prevMes ? 'auto' : 'none', opacity: prevMes ? 1 : 0.3 }}
          >
            ‹
          </Link>
          <select
            disabled
            className="flex-1 rounded-xl px-3 py-2 text-sm font-medium text-white text-center focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
            value={mes}
          >
            {meses.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <Link
            href={nextMes ? mesHref(nextMes) : '#'}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-white/40 flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', pointerEvents: nextMes ? 'auto' : 'none', opacity: nextMes ? 1 : 0.3 }}
          >
            ›
          </Link>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* ── DRE Simplificado ──────────────────────────── */}
        <section
          className="rounded-3xl p-5 space-y-3 relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(245,158,11,0.1), transparent 70%)' }} />
          <p className="text-white/40 text-[10px] uppercase tracking-widest">DRE — {mesLabel}</p>

          {/* Faturamento */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/50 text-xs">Faturamento</p>
              <p className="text-2xl font-bold" style={{ color: receita > 0 ? '#34d399' : '#f87171', fontVariantNumeric: 'tabular-nums' }}>
                {receita > 0 ? fmt(receita) : 'Não registrado'}
              </p>
            </div>
            <Suspense fallback={null}>
              <FaturamentoForm
                referenceMonth={mes}
                existing={faturamento ? { id: faturamento.id, amount: faturamento.amount, description: faturamento.description } : null}
              />
            </Suspense>
          </div>

          {/* Nota Fiscal do faturamento */}
          {faturamento && (
            <Suspense fallback={null}>
              <FiscalNoteForm
                incomeRecordId={faturamento.id}
                existingNote={fiscalNote ?? null}
                referenceMonth={mes}
              />
            </Suspense>
          )}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

          {/* Despesas operacionais */}
          <DRERow
            label="(-) Gastos PJ no cartão"
            value={despesasTx}
            color="#f87171"
            detail={`${(txRows ?? []).length} lançamentos`}
          />
          <DRERow
            label="(-) Obrigações fixas"
            value={despesasFixed}
            color="#f87171"
            detail={`${(compromissos ?? []).length} contas (DAS, INSS...)`}
          />
          {proLaboreVal > 0 && (
            <DRERow
              label="(-) Pró-labore"
              value={proLaboreVal}
              color="#fcd34d"
              detail="Retirada do sócio"
            />
          )}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

          {/* Resultado */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white">Resultado estimado</p>
            <p
              className="text-xl font-bold"
              style={{
                color: receita === 0 ? 'rgba(255,255,255,0.3)' : resultado >= 0 ? '#34d399' : '#f87171',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {receita === 0 ? '—' : fmt(resultado)}
            </p>
          </div>
          {receita === 0 && (
            <p className="text-[10px] text-white/25 text-center">
              Registre o faturamento do mês para ver o resultado
            </p>
          )}
        </section>

        {/* ── Contas Fixas PJ ──────────────────────────── */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">📋 Obrigações fixas</p>
            <Link href="/compromissos?entidade=i2" className="text-[10px] text-amber-400/60">Ver tudo ›</Link>
          </div>

          {(compromissos ?? []).length === 0 ? (
            <div className="rounded-2xl px-4 py-5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
              <p className="text-white/25 text-sm">Nenhuma conta fixa PJ</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {(compromissos ?? []).map(c => {
                const ob = obrigacaoMap.get(c.id);
                const pago = ob?.status === 'paid';
                return (
                  <Link
                    key={c.id}
                    href={`/compromissos/${c.id}`}
                    className="rounded-2xl px-4 py-3 flex items-center gap-3 transition-all active:scale-[0.98]"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: pago ? STATUS_DOT.paid : STATUS_DOT.pending }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-medium truncate">{c.description}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">dia {c.due_day} · {pago ? 'Pago' : 'Pendente'}</p>
                    </div>
                    <p className="text-sm font-semibold text-white/70 flex-shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(Number(c.amount))}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Lançamentos PJ ───────────────────────────── */}
        <section className="space-y-2">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider px-1">
            💳 Lançamentos PJ — {mesLabel}
          </p>

          {(txRows ?? []).length === 0 ? (
            <div className="rounded-2xl px-4 py-5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
              <p className="text-white/25 text-sm">Nenhum lançamento PJ neste mês</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {(txRows ?? []).map(tx => (
                <div
                  key={tx.id}
                  className="rounded-2xl px-4 py-3 flex items-center gap-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm truncate">{tx.description}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      {new Date(tx.occurred_on + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold flex-shrink-0" style={{ color: '#f87171', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(Math.abs(tx.amount))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      <BottomNav role="admin" name={profile.name ?? ''} />
    </div>
  );
}

function DRERow({ label, value, color, detail }: { label: string; value: number; color: string; detail?: string }) {
  const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/50 text-xs">{label}</p>
        {detail && <p className="text-[10px] text-white/25">{detail}</p>}
      </div>
      <p className="text-sm font-semibold" style={{ color, fontVariantNumeric: 'tabular-nums' }}>{fmt(value)}</p>
    </div>
  );
}
