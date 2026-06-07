import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { getEffectiveScope } from '@/lib/profile-scope';
import { toTransactions } from '@/lib/mappers';
import { TransactionList } from '@/components/TransactionList';
import { BottomNav } from '@/components/BottomNav';
import { Filtros } from './Filtros';
import { Suspense } from 'react';
import Link from 'next/link';

// Gera os últimos 18 meses para o seletor
function gerarMeses() {
  const meses = [];
  const hoje = new Date();
  for (let i = 0; i < 18; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const value = d.toISOString().slice(0, 7);
    const label = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    meses.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return meses;
}

interface SearchParams {
  mes?: string;
  responsavel?: string;
  origem?: string;
  ordem?: string;
  min?: string;
  max?: string;
  q?: string;
}

export default async function LancamentosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) redirect('/login');

  const scope = await getEffectiveScope(profile.role as 'admin' | 'operator');

  // Pré-carrega contas pra filtrar por escopo (pessoal x empresa)
  const { data: accountsForScope } = await supabase
    .from('accounts')
    .select('id, kind')
    .eq('household_id', profile.household_id);
  const scopedAccountIds = (accountsForScope ?? [])
    .filter(a => {
      if (scope === 'pessoal') return a.kind !== 'company';
      if (scope === 'empresa') return a.kind === 'company';
      return true; // 'tudo'
    })
    .map(a => a.id);

  const params = await searchParams;
  const mes = params.mes ?? '';
  const responsavel = params.responsavel ?? '';
  const origem = params.origem ?? '';
  const ordem = params.ordem ?? 'data_desc';
  const min = params.min ? parseFloat(params.min.replace(',', '.')) : null;
  const max = params.max ? parseFloat(params.max.replace(',', '.')) : null;
  const q = params.q ?? '';

  // ── Construir query ──────────────────────────────────────────────────────
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('household_id', profile.household_id);

  // Filtro por escopo (pessoal/empresa/tudo)
  if (scopedAccountIds.length > 0 && scope !== 'tudo') {
    query = query.in('account_id', scopedAccountIds);
  } else if (scope !== 'tudo' && scopedAccountIds.length === 0) {
    // Escopo selecionado mas sem contas — não retorna nada
    query = query.eq('id', '00000000-0000-0000-0000-000000000000');
  }

  // Filtro de mês
  if (mes === 'todos') {
    // sem filtro de data
  } else {
    const m = mes || new Date().toISOString().slice(0, 7);
    const [ly, lm] = m.split('-').map(Number);
    const nextMonth = new Date(ly!, lm!, 1).toISOString().slice(0, 10);
    query = query.gte('occurred_on', `${m}-01`).lt('occurred_on', nextMonth);
  }

  // Filtros diretos
  if (responsavel) query = query.eq('responsible', responsavel);
  if (origem) query = query.eq('source', origem);

  // Ordenação
  const [campo, dir] = ordem.split('_');
  const coluna = campo === 'valor' ? 'amount' : 'occurred_on';
  query = query.order(coluna, { ascending: dir === 'asc' });
  if (coluna === 'occurred_on') query = query.order('id', { ascending: false }); // tiebreak

  const { data: txRows } = await query;
  let transactions = toTransactions(txRows ?? []);

  // Filtros client-impossíveis de fazer no Supabase de forma simples → filtrar em memória
  if (q) {
    const lower = q.toLowerCase();
    transactions = transactions.filter(t => t.description.toLowerCase().includes(lower));
  }
  if (min !== null) transactions = transactions.filter(t => Math.abs(t.amount) >= min);
  if (max !== null) transactions = transactions.filter(t => Math.abs(t.amount) <= max);

  // Contagem de filtros ativos
  const activeFiltersCount = [mes, responsavel, origem, min !== null ? '1' : '', max !== null ? '1' : ''].filter(Boolean).length;

  // Totais para o resumo
  const totalValor = transactions.reduce((s, t) => s + Math.abs(t.amount), 0);

  // Label do período selecionado
  const meses = gerarMeses();
  let periodoLabel = 'Mês atual';
  if (mes === 'todos') periodoLabel = 'Todos os meses';
  else if (mes) periodoLabel = meses.find(m => m.value === mes)?.label ?? mes;

  return (
    <div className="min-h-screen pb-28 md:pl-60">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-4 overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest capitalize">{periodoLabel}</p>
            <h1 className="text-xl font-bold text-white mt-0.5">Lançamentos</h1>
          </div>
          <Link
            href="/lancamentos/novo"
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all active:scale-95 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            + Novo
          </Link>
        </div>
      </div>

      <div className="px-4 md:px-8 py-4 space-y-3 page-container">
        {/* Filtros — Suspense necessário por useSearchParams */}
        <Suspense fallback={null}>
          <Filtros
            meses={meses}
            totalResults={transactions.length}
            totalValor={totalValor}
            activeFiltersCount={activeFiltersCount}
          />
        </Suspense>

        {/* Lista */}
        <TransactionList transactions={transactions} showMeta={mes === 'todos' || !!responsavel || !!origem} />
      </div>

      <BottomNav role={profile.role as 'admin' | 'operator'} name={profile.name ?? ''} scope={scope} />
    </div>
  );
}
