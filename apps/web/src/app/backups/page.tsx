import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { getEffectiveScope } from '@/lib/profile-scope';
import { BottomNav } from '@/components/BottomNav';
import { actionListBackups, actionCreateBackup, actionRestoreBackup } from './actions';

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

function ageInDays(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

const KIND_LABEL: Record<string, { label: string; color: string }> = {
  manual: { label: 'Manual', color: '#60a5fa' },
  auto: { label: 'Automático', color: '#94a3b8' },
  'pre-migration': { label: 'Pré-migration', color: '#f59e0b' },
};

export default async function BackupsPage({
  searchParams,
}: {
  searchParams: Promise<{ confirm?: string }>;
}) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/dashboard');

  const params = await searchParams;
  const confirmingFolder = params.confirm ?? null;

  const backups = await actionListBackups();

  const scope = await getEffectiveScope(profile.role as 'admin' | 'operator');


  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', paddingBottom: 100 }}>
      <header style={{ padding: '24px 20px 12px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>🛡️ Backups</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '4px 0 0' }}>
          Pontos de restore antes de mudanças sensíveis
        </p>
      </header>

      {/* Criar backup */}
      <section style={{ padding: '0 20px 20px' }}>
        <form action={actionCreateBackup} style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: 16,
        }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 12px' }}>
            Criar novo ponto de restore
          </p>
          <input
            type="text"
            name="label"
            placeholder='Label (ex.: "pre-migration-0008")'
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 14,
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: 'white',
              marginBottom: 10,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Tipo:</label>
            <select name="kind" defaultValue="manual" style={{
              padding: '6px 10px',
              fontSize: 12,
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              color: 'white',
            }}>
              <option value="manual">Manual</option>
              <option value="pre-migration">Pré-migration</option>
            </select>
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: 14,
              fontWeight: 600,
              background: '#3b82f6',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              cursor: 'pointer',
            }}
          >
            🛡️ Criar ponto de restore
          </button>
        </form>
      </section>

      {/* Lista */}
      <section style={{ padding: '0 20px' }}>
        <h2 style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '0 0 12px' }}>
          {backups.length} backup{backups.length === 1 ? '' : 's'} disponíve{backups.length === 1 ? 'l' : 'is'}
        </h2>

        {backups.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', padding: 32 }}>
            Nenhum backup ainda. Crie o primeiro acima.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {backups.map(({ folder, manifest }) => {
            const kind = manifest?.kind ?? 'manual';
            const kindMeta = KIND_LABEL[kind] ?? KIND_LABEL.manual!;
            const age = manifest ? ageInDays(manifest.created_at) : null;
            const isConfirming = confirmingFolder === folder;
            const isOld = age !== null && age > 90;

            return (
              <div key={folder} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: 14,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0, fontFamily: 'ui-monospace, monospace' }}>
                      {folder}
                    </p>
                    {manifest?.label && (
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '2px 0 0' }}>
                        {manifest.label}
                      </p>
                    )}
                  </div>
                  <span style={{
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: `${kindMeta.color}22`,
                    color: kindMeta.color,
                    whiteSpace: 'nowrap',
                  }}>{kindMeta.label}</span>
                </div>

                {manifest && (
                  <div style={{
                    display: 'flex',
                    gap: 12,
                    marginTop: 10,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.5)',
                  }}>
                    <span>{manifest.total_rows} rows</span>
                    <span>·</span>
                    <span>{fmtBytes(manifest.total_bytes)}</span>
                    <span>·</span>
                    <span style={{ color: isOld ? '#f59e0b' : 'inherit' }}>
                      {age !== null ? `${age}d atrás` : '?'}{isOld ? ' ⚠️' : ''}
                    </span>
                  </div>
                )}

                {/* Restore: 2-step confirm */}
                {!isConfirming ? (
                  <a
                    href={`/backups?confirm=${encodeURIComponent(folder)}`}
                    style={{
                      display: 'inline-block',
                      marginTop: 10,
                      fontSize: 12,
                      color: '#f87171',
                      textDecoration: 'none',
                      padding: '4px 0',
                    }}
                  >↩️ Restaurar este backup</a>
                ) : (
                  <form action={actionRestoreBackup} style={{ marginTop: 12 }}>
                    <input type="hidden" name="folder" value={folder} />
                    <p style={{ fontSize: 12, color: '#f87171', margin: '0 0 8px' }}>
                      ⚠️ Confirme 2x para restaurar. Os dados atuais serão SUBSTITUÍDOS.
                    </p>
                    <input
                      type="text"
                      name="confirm1"
                      placeholder='Digite "restaurar"'
                      required
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: 13,
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(248,113,113,0.3)',
                        borderRadius: 6,
                        color: 'white',
                        marginBottom: 8,
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="text"
                      name="confirm2"
                      placeholder={`Digite "${folder}"`}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: 12,
                        fontFamily: 'ui-monospace, monospace',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(248,113,113,0.3)',
                        borderRadius: 6,
                        color: 'white',
                        marginBottom: 10,
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" style={{
                        flex: 1,
                        padding: '10px',
                        fontSize: 13,
                        fontWeight: 600,
                        background: '#dc2626',
                        border: 'none',
                        borderRadius: 6,
                        color: 'white',
                        cursor: 'pointer',
                      }}>↩️ RESTAURAR</button>
                      <a href="/backups" style={{
                        flex: 1,
                        padding: '10px',
                        fontSize: 13,
                        textAlign: 'center',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 6,
                        color: 'white',
                        textDecoration: 'none',
                      }}>Cancelar</a>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <BottomNav role="admin" name={profile.name ?? ''} />
    </div>
  );
}
