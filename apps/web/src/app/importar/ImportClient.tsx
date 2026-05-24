'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { actionImportarUpload, actionImportarDrive, actionVerificarEmail } from './actions';
import { CategorizarFlow } from './CategorizarFlow';

type DriveFile = { id: string; name: string; modifiedTime: string; size: string; imported: boolean };
type Result = Awaited<ReturnType<typeof actionImportarUpload>>;

interface Props {
  driveFiles: DriveFile[];
  driveEnabled: boolean;
}

const glass = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
} as React.CSSProperties;

export function ImportClient({ driveFiles, driveEnabled }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importingDriveId, setImportingDriveId] = useState<string | null>(null);
  const [showImported, setShowImported] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Nubank reusa o mesmo nome de arquivo durante todo o ciclo da fatura
  // (parcial → atualização → final). Por isso NÃO escondemos arquivos
  // "já importados" — o dedup real é por fingerprint de linha no import.
  // Reimportar é seguro: só linhas novas entram.
  const pendingFiles  = driveFiles;
  const importedFiles: DriveFile[] = [];

  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);
  async function handleRefresh() {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      const res = await actionVerificarEmail();
      if (res.ok) {
        setRefreshMsg(res.novosArquivos > 0
          ? `✓ ${res.novosArquivos} CSV novo(s) baixado(s)`
          : '✓ Nenhum CSV novo no email');
        router.refresh();
      } else if ('configured' in res && res.configured === false) {
        // Webhook não configurado — só refresh local
        setRefreshMsg('⚠️ Webhook não configurado — só atualizando lista do Drive');
        router.refresh();
      } else {
        setRefreshMsg(`⚠️ ${res.error}`);
      }
    } catch (e) {
      setRefreshMsg(`⚠️ ${e instanceof Error ? e.message : 'Erro'}`);
    } finally {
      setRefreshing(false);
      // Limpa mensagem após 4s
      setTimeout(() => setRefreshMsg(null), 4000);
    }
  }

  function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setResult({ ok: false, error: 'Apenas arquivos .csv são aceitos.' });
      return;
    }
    setSelectedFile(file);
    setResult(null);
  }

  function handleUpload() {
    if (!selectedFile) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append('csv', selectedFile);
      const res = await actionImportarUpload(fd);
      setResult(res);
      if (res.ok) {
        setSelectedFile(null);
        // Refresh para atualizar lista do Drive (marcar como "já importado")
        router.refresh();
        // Se houve lançamentos pra categorizar, redireciona após 1.2s
        if (res.flagged > 0) {
          setTimeout(() => router.push('/categorizar'), 1200);
        }
      }
    });
  }

  function handleDriveImport(file: DriveFile) {
    setImportingDriveId(file.id);
    startTransition(async () => {
      const res = await actionImportarDrive(file.id, file.name);
      setResult(res);
      setImportingDriveId(null);
      if (res.ok) {
        // Refresh para o file aparecer como "já importado"
        router.refresh();
        if (res.flagged > 0) {
          setTimeout(() => router.push('/categorizar'), 1200);
        }
      }
    });
  }

  function fmt(bytes: string) {
    const n = parseInt(bytes);
    return isNaN(n) ? '' : n < 1024 ? `${n} B` : `${(n / 1024).toFixed(0)} KB`;
  }

  function fmtDate(iso: string) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <div className="space-y-4">

      {/* Resultado */}
      {result && (
        <div
          className="rounded-2xl p-4"
          style={result.ok
            ? { background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }
            : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }
          }
        >
          {result.ok ? (
            <div>
              <p className="text-emerald-400 font-semibold text-sm mb-2">✓ Importação concluída!</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Stat label="Inseridas" value={result.inserted} color="#34d399" />
                <Stat label="Já existiam" value={result.skipped} color="rgba(255,255,255,0.4)" />
                <Stat label="Auto-categorizadas" value={result.autoAssigned} color="#93c5fd" />
                {result.flagged > 0 && <Stat label="Sem responsável" value={result.flagged} color="#fbbf24" />}
              </div>
              {/* CTA grande quando há lançamentos pra categorizar */}
              {result.flagged > 0 && (
                <button
                  onClick={() => router.push('/categorizar')}
                  className="w-full mt-3 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    color: '#1a1a1a',
                  }}
                >
                  📥 Categorizar {result.flagged} lançamento{result.flagged > 1 ? 's' : ''} agora →
                </button>
              )}
              {result.flagged === 0 && result.inserted === 0 && result.skipped > 0 && (
                <p className="text-white/40 text-xs mt-3">
                  ℹ️ Este arquivo já havia sido importado antes — todas as {result.skipped} linhas já estavam no banco.
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <p className="text-red-400 text-sm">{result.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Fluxo de categorização — aparece para itens sem responsável e/ou auto-categorizados */}
      {result?.ok && (result.flagged > 0 || result.autoAssigned > 0) && (
        <CategorizarFlow totalFlagged={result.flagged} autoAssigned={result.autoAssigned} />
      )}

      {/* Google Drive — só aparece se configurado */}
      {driveEnabled && (
        <div className="rounded-2xl p-4" style={glass}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">📁</span>
            <p className="text-white/70 text-sm font-semibold">Google Drive</p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="ml-auto flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50"
              style={{
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.25)',
                color: '#93c5fd',
              }}
            >
              <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
              {refreshing ? 'Verificando email...' : 'Verificar agora'}
            </button>
          </div>

          {refreshMsg && (
            <div className="mb-3 px-3 py-2 rounded-lg text-[11px]"
              style={{
                background: refreshMsg.startsWith('✓') ? 'rgba(52,211,153,0.08)' : 'rgba(251,191,36,0.08)',
                border: `1px solid ${refreshMsg.startsWith('✓') ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`,
                color: refreshMsg.startsWith('✓') ? '#34d399' : '#fbbf24',
              }}>
              {refreshMsg}
            </div>
          )}

          {pendingFiles.length === 0 && importedFiles.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-3">Nenhum CSV na pasta ainda</p>
          ) : (
            <div className="space-y-2">
              {/* Novos (não importados) — destacados */}
              {pendingFiles.length === 0 && (
                <div className="flex items-center gap-2 py-2 px-2 rounded-lg"
                  style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
                  <span className="text-sm">✓</span>
                  <p className="text-emerald-300/80 text-xs">Tudo em dia — nenhum CSV novo</p>
                </div>
              )}
              {pendingFiles.map((f, idx) => {
                const isNewest = idx === 0;
                const isPendingImport = true;
                const highlight = isNewest && isPendingImport;
                return (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
                    style={{
                      background: highlight ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${highlight ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <span className="text-sm">{f.imported ? '↻' : '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-white text-xs font-medium truncate">{f.name}</p>
                        {!f.imported && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: 'rgba(59,130,246,0.25)', color: '#93c5fd' }}>
                            NOVO
                          </span>
                        )}
                        {f.imported && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: 'rgba(251,191,36,0.15)', color: 'rgba(251,191,36,0.8)' }}>
                            atualização
                          </span>
                        )}
                      </div>
                      <p className="text-white/30 text-[10px]">{fmtDate(f.modifiedTime)} · {fmt(f.size)}</p>
                    </div>
                    <button
                      onClick={() => handleDriveImport(f)}
                      disabled={isPending}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-40 flex-shrink-0"
                      style={{
                        background: highlight ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.15)',
                        color: '#93c5fd',
                        border: '1px solid rgba(59,130,246,0.3)',
                      }}
                    >
                      {importingDriveId === f.id ? '⏳' : '↑ Importar'}
                    </button>
                  </div>
                );
              })}

              {/* Importados — collapsed */}
              {importedFiles.length > 0 && (
                <div className="pt-1">
                  <button
                    onClick={() => setShowImported(v => !v)}
                    className="w-full flex items-center justify-between py-2 px-2 rounded-lg text-[11px] transition-all"
                    style={{ background: 'transparent', color: 'rgba(255,255,255,0.4)' }}
                  >
                    <span>{showImported ? '▾' : '▸'} {importedFiles.length} já importado{importedFiles.length > 1 ? 's' : ''}</span>
                    <span className="text-[10px] text-white/25">{showImported ? 'ocultar' : 'mostrar'}</span>
                  </button>
                  {showImported && (
                    <div className="space-y-1 mt-1.5">
                      {importedFiles.map(f => (
                        <div key={f.id} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                          <span className="text-xs opacity-50">✅</span>
                          <p className="text-white/40 text-[11px] truncate flex-1">{f.name}</p>
                          <p className="text-white/20 text-[9px] flex-shrink-0">{fmtDate(f.modifiedTime)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upload manual */}
      <div className="rounded-2xl p-4" style={glass}>
        <p className="text-white/70 text-sm font-semibold mb-3">
          {driveEnabled ? '📤 Upload manual' : '📤 Selecionar arquivo CSV'}
        </p>

        {/* Drop zone */}
        <div
          className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-8 gap-2 cursor-pointer transition-all"
          style={{
            borderColor: dragging ? 'rgba(59,130,246,0.6)' : selectedFile ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.12)',
            background: dragging ? 'rgba(59,130,246,0.06)' : 'transparent',
          }}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
        >
          <span className="text-3xl">{selectedFile ? '✓' : '📂'}</span>
          {selectedFile ? (
            <>
              <p className="text-emerald-400 text-sm font-medium">{selectedFile.name}</p>
              <p className="text-white/30 text-xs">{fmt(String(selectedFile.size))}</p>
            </>
          ) : (
            <>
              <p className="text-white/50 text-sm">Toque para selecionar</p>
              <p className="text-white/25 text-xs">ou arraste o arquivo CSV do Nubank</p>
            </>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {selectedFile && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { setSelectedFile(null); setResult(null); }}
              className="flex-1 py-3 rounded-xl text-sm text-white/50 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleUpload}
              disabled={isPending}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            >
              {isPending ? 'Processando...' : 'Importar agora'}
            </button>
          </div>
        )}
      </div>

      {/* Dica Nubank */}
      <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-white/25 text-xs leading-relaxed">
          <span className="text-white/40 font-medium">Como baixar o CSV do Nubank:</span>{' '}
          Abra o app Nubank → Cartão de crédito → Fatura → selecione o mês → "Exportar" → "Planilha (.csv)"
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
      <span className="text-lg font-bold" style={{ color }}>{value}</span>
    </div>
  );
}
