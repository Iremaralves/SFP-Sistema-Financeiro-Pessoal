'use client';

import { useState, useRef, useTransition } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  kind: string | null;
  notes: string | null;
  created_at: string;
}

interface Props {
  transactionId: string;
  householdId: string;
  initial: Attachment[];
}

function fmtSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const KIND_OPTIONS = [
  { value: 'nf',          label: 'Nota Fiscal' },
  { value: 'comprovante', label: 'Comprovante' },
  { value: 'recibo',      label: 'Recibo' },
  { value: 'outro',       label: 'Outro' },
];

export function TxAttachments({ transactionId, householdId, initial }: Props) {
  const router = useRouter();
  const [attachments, setAttachments] = useState<Attachment[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [kind, setKind] = useState('nf');
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setError('');
    try {
      const db = createClient();

      // path: {household_id}/{tx_id}/{timestamp}-{filename}
      const ts = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${householdId}/${transactionId}/${ts}-${safeName}`;

      // Upload pro Storage
      const { error: upErr } = await db.storage
        .from('tx-attachments')
        .upload(path, file, { upsert: false });
      if (upErr) throw new Error(upErr.message);

      // Signed URL longa
      const { data: signed } = await db.storage
        .from('tx-attachments')
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);  // 5 anos

      // INSERT no banco
      const { data: row, error: dbErr } = await db
        .from('transaction_attachments')
        .insert({
          household_id: householdId,
          transaction_id: transactionId,
          file_name: file.name,
          file_path: path,
          file_url: signed?.signedUrl ?? null,
          mime_type: file.type,
          size_bytes: file.size,
          kind,
        })
        .select('*')
        .single();

      if (dbErr) throw new Error(dbErr.message);
      if (row) setAttachments(prev => [row as Attachment, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro no upload');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete(att: Attachment) {
    if (!confirm(`Excluir ${att.file_name}?`)) return;
    startTransition(async () => {
      const db = createClient();
      await db.storage.from('tx-attachments').remove([att.file_path]);
      await db.from('transaction_attachments').delete().eq('id', att.id);
      setAttachments(prev => prev.filter(a => a.id !== att.id));
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-white/40 text-[10px] uppercase tracking-wider flex-1">
          📎 Anexos ({attachments.length})
        </p>
        <select
          value={kind}
          onChange={e => setKind(e.target.value)}
          className="text-[10px] px-2 py-1 rounded-md bg-white/05 border border-white/10 text-white/60 focus:outline-none"
          style={{ colorScheme: 'dark' }}
        >
          {KIND_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/heic"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all active:scale-95 disabled:opacity-50"
          style={{
            background: uploading ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.2)',
            color: '#93c5fd',
            border: '1px solid rgba(59,130,246,0.3)',
          }}
        >
          {uploading ? '⏳' : '+ Anexar'}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-[10px] px-2 py-1.5 rounded-md"
          style={{ background: 'rgba(239,68,68,0.08)' }}>
          ⚠️ {error}
        </p>
      )}

      {attachments.length === 0 && !uploading && (
        <p className="text-white/25 text-[10px] text-center py-2">Nenhum arquivo anexado</p>
      )}

      {attachments.map(att => (
        <div key={att.id}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-base">
            {att.mime_type?.startsWith('image/') ? '🖼️' : '📄'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-[11px] truncate">{att.file_name}</p>
            <p className="text-white/30 text-[9px]">
              {att.kind ?? 'outro'} · {fmtSize(att.size_bytes)}
            </p>
          </div>
          {att.file_url && (
            <a
              href={att.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-medium px-2 py-1 rounded-md"
              style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}
            >
              Ver
            </a>
          )}
          <button
            type="button"
            onClick={() => handleDelete(att)}
            disabled={isPending}
            className="text-[10px] font-medium px-2 py-1 rounded-md disabled:opacity-40"
            style={{ background: 'rgba(239,68,68,0.08)', color: 'rgba(248,113,113,0.7)' }}
          >
            🗑️
          </button>
        </div>
      ))}
    </div>
  );
}
