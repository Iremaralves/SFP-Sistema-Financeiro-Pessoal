'use client';

import { useState, useRef, useTransition } from 'react';
import { actionImportarUpload, actionImportarDrive } from './actions';

type DriveFile = { id: string; name: string; modifiedTime: string; size: string };
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
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importingDriveId, setImportingDriveId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      if (res.ok) setSelectedFile(null);
    });
  }

  function handleDriveImport(file: DriveFile) {
    setImportingDriveId(file.id);
    startTransition(async () => {
      const res = await actionImportarDrive(file.id, file.name);
      setResult(res);
      setImportingDriveId(null);
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
                {result.flagged > 0 && <Stat label="Sem responsável ⚠️" value={result.flagged} color="#fbbf24" />}
              </div>
              {result.flagged > 0 && (
                <p className="text-amber-400/70 text-xs mt-2">
                  {result.flagged} lançamento(s) precisam de responsável — acesse Lançamentos para categorizar.
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

      {/* Google Drive — só aparece se configurado */}
      {driveEnabled && (
        <div className="rounded-2xl p-4" style={glass}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">📁</span>
            <p className="text-white/70 text-sm font-semibold">Google Drive</p>
            <span className="text-[10px] text-white/30 ml-auto">pasta automática</span>
          </div>

          {driveFiles.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-3">Nenhum CSV na pasta ainda</p>
          ) : (
            <div className="space-y-2">
              {driveFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="text-sm">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{f.name}</p>
                    <p className="text-white/30 text-[10px]">{fmtDate(f.modifiedTime)} · {fmt(f.size)}</p>
                  </div>
                  <button
                    onClick={() => handleDriveImport(f)}
                    disabled={isPending}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-40 flex-shrink-0"
                    style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' }}
                  >
                    {importingDriveId === f.id ? '...' : 'Importar'}
                  </button>
                </div>
              ))}
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
