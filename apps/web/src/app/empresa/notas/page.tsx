import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { BottomNav } from '@/components/BottomNav';
import { FiscalNoteForm } from '../FiscalNoteForm';
import Link from 'next/link';
import { Suspense } from 'react';

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function fmtDate(s: string) {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

export default async function NotasFiscaisPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/dashboard');

  // Buscar todos os income_records de faturamento_i2 com suas NFs
  const { data: incomeRows } = await supabase
    .from('income_records')
    .select('id, kind, amount, description, reference_month')
    .eq('household_id', profile.household_id)
    .eq('kind', 'faturamento_i2')
    .order('reference_month', { ascending: false })
    .limit(24);

  const incomeIds = (incomeRows ?? []).map(r => r.id);

  const { data: fiscalNotes } = incomeIds.length > 0
    ? await supabase
        .from('fiscal_notes')
        .select('*')
        .in('income_record_id', incomeIds)
    : { data: [] };

  const nfMap = new Map((fiscalNotes ?? []).map(n => [n.income_record_id, n]));

  return (
    <div className="min-h-screen pb-28 md:pl-60">
      {/* Header */}
      <div
        className="relative px-5 pt-14 pb-5 overflow-hidden"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(245,158,11,0.12) 0%, transparent 70%)' }} />
        <div className="flex items-center gap-3">
          <Link
            href="/empresa"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
          >‹</Link>
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest">i2 Soluções</p>
            <h1 className="text-xl font-bold text-white">Notas Fiscais</h1>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-3">

        {(incomeRows ?? []).length === 0 && (
          <div className="rounded-2xl p-6 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-white/30 text-sm">Nenhum faturamento registrado ainda.</p>
            <Link href="/empresa" className="text-amber-400 text-xs underline mt-2 inline-block">
              Ir para Empresa →
            </Link>
          </div>
        )}

        {(incomeRows ?? []).map(income => {
          const nf = nfMap.get(income.id) ?? null;
          const mesLabel = income.reference_month
            ? new Date(income.reference_month).toLocaleString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
            : income.reference_month ?? '—';

          return (
            <div
              key={income.id}
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {/* Cabeçalho do mês */}
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/50 text-xs capitalize">{mesLabel}</p>
                {nf && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>
                    NF #{nf.nf_number}
                  </span>
                )}
              </div>
              <p className="text-white font-semibold text-base mb-0.5">
                {fmt(income.amount)}
              </p>
              <p className="text-white/30 text-xs mb-2 truncate">{income.description}</p>

              {/* NF info quando existe */}
              {nf && (
                <div className="rounded-xl p-3 mb-2 space-y-1"
                  style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 text-xs font-semibold">NF {nf.nf_number}</span>
                    <span className="text-white/40 text-[10px]">{fmtDate(nf.nf_issued_at)}</span>
                  </div>
                  {nf.tomador && <p className="text-white/40 text-[10px]">{nf.tomador}</p>}
                  {nf.iss_amount != null && (
                    <p className="text-white/30 text-[10px]">
                      ISS {nf.aliquota_iss}% = {fmt(nf.iss_amount)} · Líq. {fmt(nf.net_amount ?? 0)}
                    </p>
                  )}
                  {nf.file_url && (
                    <a href={nf.file_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md"
                      style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                      📄 Ver PDF
                    </a>
                  )}
                </div>
              )}

              {/* Form add/edit */}
              <Suspense fallback={null}>
                <FiscalNoteForm
                  incomeRecordId={income.id}
                  existingNote={nf}
                  referenceMonth={(income.reference_month ?? '').slice(0, 7)}
                />
              </Suspense>
            </div>
          );
        })}

      </div>

      <BottomNav role="admin" name={profile.name ?? ''} />
    </div>
  );
}
