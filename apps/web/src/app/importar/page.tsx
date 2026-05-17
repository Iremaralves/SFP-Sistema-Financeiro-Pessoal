import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { BottomNav } from '@/components/BottomNav';
import { ImportClient } from './ImportClient';
import { listDriveFiles } from './actions';

export default async function ImportarPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) redirect('/login');

  // Google Drive
  const driveEnabled = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const driveFiles = driveEnabled ? await listDriveFiles() : [];

  // Histórico de importações — para cruzar com os arquivos do Drive
  const { data: history } = await supabase
    .from('csv_imports')
    .select('id, filename, rows_inserted, rows_skipped_duplicate, imported_at')
    .eq('household_id', profile.household_id)
    .order('imported_at', { ascending: false })
    .limit(20);

  // Set de nomes já importados (para marcar no Drive)
  const importedFilenames = new Set((history ?? []).map((h) => h.filename));

  // Enriquece arquivos do Drive com status de importado
  const driveFilesWithStatus = driveFiles.map((f) => ({
    ...f,
    imported: importedFilenames.has(f.name),
  }));

  return (
    <div className="min-h-screen pb-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% -5%, rgba(99,102,241,0.12) 0%, transparent 60%)' }} />

      {/* Header */}
      <div className="px-5 pt-14 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Fatura do cartão</p>
        <h1 className="text-xl font-bold text-white">Importar CSV</h1>
        {driveEnabled ? (
          <p className="text-emerald-400/60 text-xs mt-1">● Google Drive conectado</p>
        ) : (
          <p className="text-white/20 text-xs mt-1">Google Drive não configurado — use upload manual</p>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        <ImportClient
          driveFiles={driveFilesWithStatus}
          driveEnabled={driveEnabled}
        />

        {/* Histórico */}
        {(history ?? []).length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-white/30 text-xs uppercase tracking-widest mb-3">Importações anteriores</p>
            <div className="space-y-2">
              {(history ?? []).map((h) => (
                <div key={h.id} className="flex items-center gap-3">
                  <span className="text-sm">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/60 text-xs truncate">{h.filename}</p>
                    <p className="text-white/25 text-[10px]">
                      {new Date(h.imported_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-emerald-400/70 text-xs font-medium">{h.rows_inserted} inseridas</p>
                    {h.rows_skipped_duplicate > 0 && (
                      <p className="text-white/25 text-[10px]">{h.rows_skipped_duplicate} dup.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav role={profile.role as 'admin' | 'operator'} />
    </div>
  );
}
