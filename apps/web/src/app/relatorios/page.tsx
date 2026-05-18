import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { BottomNav } from '@/components/BottomNav';
import Link from 'next/link';

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function mesLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y!, m! - 1, 1).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function gerarMeses(n = 12) {
  const hoje = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    return d.toISOString().slice(0, 7);
  });
}

type Tab = 'fluxo' | 'pagar' | 'receber';

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/dashboard');

  const params = await searchParams;
  const tab = (params.tab as Tab) ?? 'fluxo';

  const meses = gerarMeses(12);
  const mesInicio = `${meses[meses.length - 1]}-01`;
  // P0-02: calcular o último dia real do mês mais recente (não hardcodar -31)
  const [lastYear, lastMonth] = meses[0]!.split('-').map(Number);
  const mesFim = new Date(lastYear!, lastMonth!, 0).toISOString().slice(0, 10);

  // ── Dados comuns ──────────────────────────────────────────────────────────
  const [
    { data: txAll },
    { data: incomeAll },
    { data: obligationsAll },
  ] = await Promise.all([
    // Transações dos últimos 12 meses
    supabase
      .from('transactions')
      .select('occurred_on, amount, responsible')
      .eq('household_id', profile.household_id)
      .gte('occurred_on', mesInicio)
      .lte('occurred_on', mesFim),

    // P0-03: Receitas dos últimos 12 meses com filtro de data
    supabase
      .from('income_records')
      .select('reference_month, kind, amount')
      .eq('household_id', profile.household_id)
      .gte('reference_month', mesInicio)
      .lte('reference_month', mesFim),

    // Obrigações pendentes (contas a pagar) — sem limit para não truncar
    supabase
      .from('monthly_obligations')
      .select('id, description, amount, due_date, reference_month, status, responsible, paid_amount, paid_on')
      .eq('household_id', profile.household_id)
      .eq('status', 'pending')
      .order('due_date', { ascending: true }),
  ]);

  // ── FLUXO DE CAIXA ────────────────────────────────────────────────────────
  // Agrupa transações + receitas por mês
  const fluxo = meses.map(mes => {
    const mesDate = `${mes}-01`;
    const [y, m] = mes.split('-').map(Number);
    const nextDate = new Date(y!, m!, 1).toISOString().slice(0, 10);

    const txMes = (txAll ?? []).filter(t =>
      t.occurred_on >= `${mes}-01` && t.occurred_on < nextDate
    );
    const despesas = txMes.reduce((s, t) => s + Math.abs(t.amount), 0);

    const incMes = (incomeAll ?? []).filter(r => r.reference_month === mesDate);
    const receitas = incMes.reduce((s, r) => s + r.amount, 0);

    return { mes, despesas, receitas, resultado: receitas - despesas };
  });

  // Saldo acumulado (da mais antiga para mais recente)
  let acumulado = 0;
  const fluxoComAcumulado = [...fluxo].reverse().map(row => {
    acumulado += row.resultado;
    return { ...row, acumulado };
  }).reverse();

  const totalReceitas  = fluxo.reduce((s, r) => s + r.receitas, 0);
  const totalDespesas  = fluxo.reduce((s, r) => s + r.despesas, 0);
  const totalResultado = totalReceitas - totalDespesas;

  // ── CONTAS A PAGAR ────────────────────────────────────────────────────────
  // Obrigações pendentes agrupadas por mês de vencimento
  const pagarByMes = new Map<string, typeof obligationsAll>();
  for (const ob of (obligationsAll ?? [])) {
    const mesKey = ob.due_date?.slice(0, 7) ?? 'sem-data';
    if (!pagarByMes.has(mesKey)) pagarByMes.set(mesKey, []);
    pagarByMes.get(mesKey)!.push(ob);
  }
  const pagarMeses = [...pagarByMes.entries()].sort(([a], [b]) => a.localeCompare(b));
  const totalPagar = (obligationsAll ?? []).reduce((s, o) => s + (o.amount ?? 0), 0);
  const totalObligacoes = (obligationsAll ?? []).length;

  // ── CONTAS A RECEBER ──────────────────────────────────────────────────────
  // Projeção: contas fixas que ainda não têm baixa nos próximos meses
  const hoje = new Date();
  const proximosMeses = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    return d.toISOString().slice(0, 7);
  });

  // Para simplificar: mostra faturamento i2 esperado vs registrado
  const receber = proximosMeses.map(mes => {
    const mesDate = `${mes}-01`;
    const registrado = (incomeAll ?? [])
      .filter(r => r.reference_month === mesDate && r.kind === 'faturamento_i2')
      .reduce((s, r) => s + r.amount, 0);
    return { mes, registrado };
  });

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'fluxo',   label: 'Fluxo de Caixa',    icon: '📈' },
    { key: 'pagar',   label: 'Contas a Pagar',     icon: '📋' },
    { key: 'receber', label: 'Contas a Receber',   icon: '💰' },
  ];

  return (
    <div className="min-h-screen pb-28 md:pl-60">
      {/* Header */}
      <div
        className="relative px-5 pt-14 pb-5 overflow-hidden"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <p className="text-white/40 text-xs uppercase tracking-widest">Gestão</p>
        <h1 className="text-xl font-bold text-white">Relatórios</h1>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {TABS.map(t => (
            <Link
              key={t.key}
              href={`/relatorios?tab=${t.key}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all"
              style={{
                background: tab === t.key ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.06)',
                color: tab === t.key ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${tab === t.key ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {t.icon} {t.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-4 pt-3 space-y-3">

        {/* ── TAB: FLUXO DE CAIXA ─────────────────────────── */}
        {tab === 'fluxo' && (
          <>
            {/* Totalizador 12 meses */}
            <div
              className="rounded-2xl p-4 grid grid-cols-3 gap-3 text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div>
                <p className="text-white/35 text-[10px] uppercase tracking-wider mb-1">Receitas</p>
                <p className="text-green-400 text-sm font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(totalReceitas)}
                </p>
              </div>
              <div>
                <p className="text-white/35 text-[10px] uppercase tracking-wider mb-1">Despesas</p>
                <p className="text-red-400 text-sm font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(totalDespesas)}
                </p>
              </div>
              <div>
                <p className="text-white/35 text-[10px] uppercase tracking-wider mb-1">Resultado</p>
                <p
                  className="text-sm font-bold"
                  style={{ color: totalResultado >= 0 ? '#34d399' : '#f87171', fontVariantNumeric: 'tabular-nums' }}
                >
                  {fmt(totalResultado)}
                </p>
              </div>
            </div>

            {/* Meses */}
            {fluxoComAcumulado.map(row => {
              const temDados = row.receitas > 0 || row.despesas > 0;
              return (
                <div
                  key={row.mes}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${temDados ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                    opacity: temDados ? 1 : 0.5,
                  }}
                >
                  {/* Cabeçalho do mês */}
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <span className="text-white/70 text-sm font-semibold capitalize">
                      {capitalize(mesLabel(row.mes))}
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: row.resultado >= 0 ? '#34d399' : '#f87171', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {row.resultado >= 0 ? '+' : ''}{fmt(row.resultado)}
                    </span>
                  </div>

                  {/* Detalhes */}
                  <div className="px-4 py-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Receitas</p>
                      <p className="text-green-400/80 text-xs font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.receitas > 0 ? fmt(row.receitas) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Despesas</p>
                      <p className="text-red-400/80 text-xs font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.despesas > 0 ? fmt(row.despesas) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Acumulado</p>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: row.acumulado >= 0 ? '#6ee7b7' : '#fca5a5', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {fmt(row.acumulado)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ── TAB: CONTAS A PAGAR ─────────────────────────── */}
        {tab === 'pagar' && (
          <>
            {/* Total */}
            <div
              className="rounded-2xl p-4 flex items-center justify-between"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              <div>
                <p className="text-red-400/60 text-[10px] uppercase tracking-wider">Total pendente</p>
                <p className="text-red-400 text-xl font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(totalPagar)}
                </p>
              </div>
              <p className="text-white/25 text-xs">{totalObligacoes} obrigações</p>
            </div>

            {pagarMeses.length === 0 && (
              <div className="rounded-2xl p-6 text-center"
                style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <p className="text-green-400 text-lg mb-1">✓</p>
                <p className="text-green-400/80 text-sm font-semibold">Nenhuma conta pendente!</p>
                <p className="text-white/30 text-xs mt-1">Todas as obrigações estão pagas.</p>
              </div>
            )}

            {pagarMeses.map(([mesKey, obs]) => {
              const totalMes = (obs ?? []).reduce((s, o) => s + (o.amount ?? 0), 0);
              const hoje2 = new Date().toISOString().slice(0, 10);
              return (
                <div
                  key={mesKey}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  {/* Header mês */}
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <span className="text-white/60 text-sm font-semibold capitalize">
                      {mesKey === 'sem-data' ? 'Sem data' : capitalize(mesLabel(mesKey))}
                    </span>
                    <span className="text-red-400/70 text-xs font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(totalMes)}
                    </span>
                  </div>

                  {/* Itens */}
                  <div className="divide-y divide-white/04">
                    {(obs ?? []).map(ob => {
                      const vencido = ob.due_date && ob.due_date < hoje2;
                      return (
                        <div key={ob.id} className="flex items-center gap-3 px-4 py-3">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5"
                            style={{ background: vencido ? '#f87171' : '#fbbf24' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-white/80 text-xs font-medium truncate">{ob.description}</p>
                            <p className="text-white/30 text-[10px]">
                              {ob.due_date ? `Vence ${ob.due_date.split('-').reverse().join('/')}` : 'Sem vencimento'}
                              {vencido && <span className="text-red-400 ml-1">• Vencido</span>}
                            </p>
                          </div>
                          <span className="text-white/70 text-xs font-semibold flex-shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(ob.amount ?? 0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="pt-2 pb-2">
              <Link
                href="/compromissos"
                className="block w-full py-3 rounded-2xl text-center text-sm font-medium text-white/50 transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                Gerenciar compromissos →
              </Link>
            </div>
          </>
        )}

        {/* ── TAB: CONTAS A RECEBER ───────────────────────── */}
        {tab === 'receber' && (
          <>
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}
            >
              <p className="text-indigo-300/60 text-[10px] uppercase tracking-wider mb-1">Faturamento i2 — próximos meses</p>
              <p className="text-white/50 text-xs">
                Registre o faturamento mensal em <Link href="/empresa" className="text-amber-400 underline">/empresa</Link> para acompanhar aqui.
              </p>
            </div>

            {receber.map(row => {
              const label = capitalize(new Date(row.mes + '-01').toLocaleString('pt-BR', { month: 'long', year: 'numeric' }));
              return (
                <div
                  key={row.mes}
                  className="rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/50 text-xs font-semibold">{label}</p>
                      <p className="text-white/30 text-[10px]">Faturamento i2</p>
                    </div>
                    <div className="text-right">
                      {row.registrado > 0 ? (
                        <>
                          <p className="text-green-400 text-sm font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(row.registrado)}
                          </p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>
                            Registrado
                          </span>
                        </>
                      ) : (
                        <>
                          <p className="text-white/25 text-sm">—</p>
                          <Link
                            href={`/empresa?mes=${row.mes}`}
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}
                          >
                            Registrar
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Histórico de receitas */}
            <div className="pt-1">
              <p className="text-white/25 text-[10px] uppercase tracking-wider px-1 mb-2">Histórico de receitas</p>
              {(incomeAll ?? [])
                .filter(r => r.kind === 'faturamento_i2')
                .sort((a, b) => (b.reference_month ?? '').localeCompare(a.reference_month ?? ''))
                .slice(0, 6)
                .map((r, i) => {
                  const label2 = r.reference_month
                    ? capitalize(new Date(r.reference_month).toLocaleString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }))
                    : '—';
                  return (
                    <div key={i} className="flex items-center justify-between py-2 px-1"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span className="text-white/40 text-xs capitalize">{label2}</span>
                      <span className="text-white/70 text-xs font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(r.amount)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </>
        )}

      </div>

      <BottomNav role={profile.role as 'admin' | 'operator'} name={profile.name ?? ''} />
    </div>
  );
}
