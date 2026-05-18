'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { actionSalvarNF, actionExcluirNF } from './actions';

interface FiscalNote {
  id: string;
  nf_number: string;
  nf_amount: number;
  nf_issued_at: string;
  competencia: string | null;
  tomador: string | null;
  aliquota_iss: number | null;
  iss_amount: number | null;
  net_amount: number | null;
  file_url: string | null;
  file_path: string | null;
  notes: string | null;
}

interface Props {
  incomeRecordId: string;
  existingNote: FiscalNote | null;
  referenceMonth: string; // "YYYY-MM"
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'white',
} as React.CSSProperties;

export function FiscalNoteForm({ incomeRecordId, existingNote, referenceMonth }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'done'>('idle');

  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [nfNumber, setNfNumber]       = useState(existingNote?.nf_number ?? '');
  const [nfAmount, setNfAmount]       = useState(existingNote?.nf_amount?.toFixed(2).replace('.', ',') ?? '');
  const [nfDate, setNfDate]           = useState(existingNote?.nf_issued_at ?? '');
  const [competencia, setCompetencia] = useState(existingNote?.competencia ?? referenceMonth);
  const [tomador, setTomador]         = useState(existingNote?.tomador ?? '');
  const [aliquota, setAliquota]       = useState(existingNote?.aliquota_iss?.toString() ?? '');
  const [notes, setNotes]             = useState(existingNote?.notes ?? '');
  const [fileUrl, setFileUrl]         = useState(existingNote?.file_url ?? '');
  const [filePath, setFilePath]       = useState(existingNote?.file_path ?? '');

  const hasNF = !!existingNote;

  async function handleUpload(file: File) {
    setUploadProgress('uploading');
    const db = createClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return;

    const { data: profile } = await db.from('profiles').select('household_id').eq('id', user.id).single();
    if (!profile) return;

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf';
    const path = `${profile.household_id}/${incomeRecordId}/${nfNumber || 'nf'}_${Date.now()}.${ext}`;

    const { data, error: upErr } = await db.storage
      .from('fiscal-notes')
      .upload(path, file, { upsert: true });

    if (upErr) {
      setError(`Erro no upload: ${upErr.message}`);
      setUploadProgress('idle');
      return;
    }

    // Gera signed URL de longa duração (10 anos)
    const { data: signed } = await db.storage
      .from('fiscal-notes')
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);

    setFileUrl(signed?.signedUrl ?? '');
    setFilePath(data.path);
    setUploadProgress('done');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const parsedAmount = parseFloat(nfAmount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Valor da NF inválido.');
      setSaving(false);
      return;
    }

    const iss = aliquota ? (parsedAmount * parseFloat(aliquota)) / 100 : undefined;
    const net = iss !== undefined ? parsedAmount - iss : undefined;

    const result = await actionSalvarNF({
      id: existingNote?.id,
      income_record_id: incomeRecordId,
      nf_number: nfNumber.trim(),
      nf_amount: parsedAmount,
      nf_issued_at: nfDate,
      competencia: competencia || undefined,
      tomador: tomador || undefined,
      aliquota_iss: aliquota ? parseFloat(aliquota) : undefined,
      iss_amount: iss,
      net_amount: net,
      file_url: fileUrl || undefined,
      file_path: filePath || undefined,
      notes: notes || undefined,
    });

    if (!result.ok) {
      setError(result.error ?? 'Erro ao salvar.');
      setSaving(false);
      return;
    }

    setOpen(false);
    setSaving(false);
  }

  async function handleDelete() {
    if (!existingNote) return;
    setDeleting(true);
    const result = await actionExcluirNF(existingNote.id);
    setDeleting(false);
    setConfirmDelete(false);
    if (!result.ok) {
      setError(result.error ?? 'Erro ao excluir NF.');
      return;
    }
    setOpen(false);
  }

  // ── View mode (NF já existe) ──────────────────────────────────────────────
  if (hasNF && !open) {
    return (
      <div
        className="mt-3 rounded-2xl p-3.5"
        style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-400 text-xs font-bold">🧾 NF #{existingNote.nf_number}</span>
              {existingNote.file_url && (
                <a
                  href={existingNote.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
                >
                  📄 PDF
                </a>
              )}
            </div>
            <p className="text-white/70 text-xs">{fmt(existingNote.nf_amount)}</p>
            {existingNote.tomador && (
              <p className="text-white/40 text-[10px] truncate">{existingNote.tomador}</p>
            )}
            {existingNote.iss_amount != null && (
              <p className="text-white/30 text-[10px]">
                ISS {existingNote.aliquota_iss}% = {fmt(existingNote.iss_amount)} · Líq. {fmt(existingNote.net_amount ?? 0)}
              </p>
            )}
          </div>
          <button
            onClick={() => setOpen(true)}
            className="text-[10px] font-medium px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            ✎ Editar
          </button>
        </div>
      </div>
    );
  }

  // ── Botão "Adicionar NF" ──────────────────────────────────────────────────
  if (!hasNF && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 w-full py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
        style={{
          background: 'rgba(245,158,11,0.06)',
          border: '1px dashed rgba(245,158,11,0.25)',
          color: 'rgba(245,158,11,0.7)',
        }}
      >
        🧾 + Adicionar Nota Fiscal
      </button>
    );
  }

  // ── Formulário ────────────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSave}
      className="mt-3 rounded-2xl p-4 space-y-3"
      style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider">
          🧾 {hasNF ? 'Editar' : 'Nova'} Nota Fiscal
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-white/30 text-lg leading-none hover:text-white/60"
        >×</button>
      </div>

      {error && (
        <div className="rounded-xl p-2.5 text-xs text-red-400"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {/* Número da NF */}
        <div>
          <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">Número NF</label>
          <input
            type="text" value={nfNumber} onChange={e => setNfNumber(e.target.value)}
            placeholder="000042" required
            className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
        {/* Valor */}
        <div>
          <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">Valor (R$)</label>
          <input
            type="text" inputMode="decimal" value={nfAmount} onChange={e => setNfAmount(e.target.value)}
            placeholder="0,00" required
            className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
        {/* Data emissão */}
        <div>
          <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">Data Emissão</label>
          <input
            type="date" value={nfDate} onChange={e => setNfDate(e.target.value)} required
            className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>
        {/* Competência */}
        <div>
          <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">Competência</label>
          <input
            type="month" value={competencia} onChange={e => setCompetencia(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>
      </div>

      {/* Tomador */}
      <div>
        <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">Tomador (Cliente)</label>
        <input
          type="text" value={tomador} onChange={e => setTomador(e.target.value)}
          placeholder="Razão social do cliente..."
          className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
          style={inputStyle}
        />
      </div>

      {/* ISS */}
      <div>
        <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">Alíquota ISS (%)</label>
        <input
          type="text" inputMode="decimal" value={aliquota} onChange={e => setAliquota(e.target.value)}
          placeholder="2.00"
          className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
          style={inputStyle}
        />
        {aliquota && nfAmount && !isNaN(parseFloat(nfAmount.replace(',', '.'))) && (
          <p className="text-amber-400/60 text-[10px] mt-1 px-1">
            ISS: {fmt((parseFloat(nfAmount.replace(',', '.')) * parseFloat(aliquota)) / 100)} ·
            Líq.: {fmt(parseFloat(nfAmount.replace(',', '.')) * (1 - parseFloat(aliquota) / 100))}
          </p>
        )}
      </div>

      {/* Upload PDF */}
      <div>
        <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">PDF da Nota</label>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploadProgress === 'uploading'}
          className="w-full py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95"
          style={{
            background: uploadProgress === 'done' ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.05)',
            border: `1px dashed ${uploadProgress === 'done' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.12)'}`,
            color: uploadProgress === 'done' ? '#4ade80' : 'rgba(255,255,255,0.4)',
          }}
        >
          {uploadProgress === 'uploading' && '⏳ Enviando...'}
          {uploadProgress === 'done' && '✓ PDF enviado'}
          {uploadProgress === 'idle' && (fileUrl ? '📎 Trocar PDF' : '📎 Anexar PDF')}
        </button>
        {fileUrl && uploadProgress !== 'uploading' && (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer"
            className="block text-center text-[10px] text-amber-400/60 mt-1 underline">
            Ver PDF atual
          </a>
        )}
      </div>

      {/* Observações */}
      <div>
        <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">Observações</label>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Notas sobre esta NF..."
          rows={2}
          className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
          style={inputStyle}
        />
      </div>

      {/* Ações */}
      <div className="flex gap-2 pt-1">
        {hasNF && !confirmDelete && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="py-2.5 px-3 rounded-xl text-xs font-medium transition-all active:scale-95"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'rgba(248,113,113,0.7)' }}
          >
            Excluir
          </button>
        )}
        {confirmDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="py-2.5 px-3 rounded-xl text-xs font-medium text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'rgba(239,68,68,0.5)' }}
          >
            {deleting ? 'Excluindo...' : 'Confirmar exclusão'}
          </button>
        )}
        <button
          type="button"
          onClick={() => { setOpen(false); setConfirmDelete(false); }}
          className="flex-1 py-2.5 rounded-xl text-xs font-medium text-white/40 transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || uploadProgress === 'uploading' || !nfNumber || !nfAmount || !nfDate}
          className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
        >
          {uploadProgress === 'uploading' ? '⏳ Aguardando upload...' : saving ? 'Salvando...' : '✓ Salvar NF'}
        </button>
      </div>
    </form>
  );
}
