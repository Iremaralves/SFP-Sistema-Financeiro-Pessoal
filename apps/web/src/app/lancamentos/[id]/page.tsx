'use client';

import { createClient } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { TxAttachments } from '@/components/TxAttachments';

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

type AccountKind = 'credit_card' | 'checking' | 'company';

interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  entity_id: string | null;
}

const RESPONSIBLE_OPTIONS = [
  { value: 'juliana', label: 'Juliana',      accent: '#ec4899', bg: 'rgba(236,72,153,0.12)',  border: 'rgba(236,72,153,0.4)'  },
  { value: 'iremar',  label: 'Iremar',       accent: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.4)'  },
  { value: 'casal',   label: 'Casal',        accent: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.4)'   },
  { value: 'i2',      label: 'i2 Soluções',  accent: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.4)'  },
];

const KIND_ICON: Record<AccountKind, string> = {
  credit_card: '💳',
  checking:    '🏦',
  company:     '🏢',
};

const inputStyle = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.1)',
} as React.CSSProperties;

type Status = 'loading' | 'ready' | 'saving' | 'deleting' | 'error';

export default function EditarLancamentoPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [status, setStatus]       = useState<Status>('loading');
  const [error, setError]         = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [description, setDescription] = useState('');
  const [amount, setAmount]           = useState('');
  const [date, setDate]               = useState('');
  const [responsible, setResponsible] = useState('');
  const [source, setSource]           = useState('');
  const [accountId, setAccountId]     = useState('');

  const [role, setRole]         = useState<'admin' | 'operator' | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [i2AccountId, setI2AccountId] = useState('');
  const [pfAccountId, setPfAccountId] = useState('');
  const [householdId, setHouseholdId] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  // Admin (Iremar) pode forçar desbloqueio de campos definidos pelo Nubank
  const [forceUnlock, setForceUnlock] = useState(false);

  // Lock dos campos valor/data/conta quando é compra do cartão importada do CSV
  // (definidos pelo Nubank — editar quebra a conciliação com a fatura real).
  // Editáveis sempre: descrição, responsável, notas, parcelamento.
  const selectedAcc = accounts.find(a => a.id === accountId);
  const isCardPurchase = selectedAcc?.kind === 'credit_card' && source === 'csv_import';
  const fieldsLocked = isCardPurchase && !forceUnlock;

  useEffect(() => {
    async function load() {
      const db = createClient();
      const { data: { user } } = await db.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await db
        .from('profiles').select('household_id, role').eq('id', user.id).single();
      if (!profile) { router.push('/login'); return; }

      setRole(profile.role as 'admin' | 'operator');
      setHouseholdId(profile.household_id);

      // Carregar anexos da transação (em paralelo com tx abaixo)
      db.from('transaction_attachments')
        .select('*')
        .eq('transaction_id', id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setAttachments((data ?? []) as Attachment[]));

      // Carregar transação
      const { data: tx, error: err } = await db
        .from('transactions').select('*').eq('id', id).single();

      if (err || !tx) {
        setError('Lançamento não encontrado.');
        setStatus('error');
        return;
      }

      setDescription(tx.description);
      setAmount(Math.abs(tx.amount).toFixed(2).replace('.', ','));
      setDate(tx.occurred_on);
      setResponsible(tx.responsible);
      setSource(tx.source ?? '');
      setAccountId(tx.account_id);

      // Carregar contas disponíveis
      const { data: accs } = await db
        .from('accounts')
        .select('id, name, kind, entity_id')
        .eq('household_id', profile.household_id)
        .eq('active', true)
        .order('kind');

      const allAccounts = (accs ?? []) as Account[];
      // Admin: credit_card + company. Operator: só credit_card.
      // Filtra por kind — evita dependência frágil do nome da conta.
      const visibleAccounts: Account[] = profile.role === 'admin'
        ? allAccounts.filter(a => a.kind === 'credit_card' || a.kind === 'company')
        : allAccounts.filter(a => a.kind === 'credit_card');

      setAccounts(visibleAccounts);
      setI2AccountId(visibleAccounts.find(a => a.kind === 'company')?.id ?? '');
      setPfAccountId(visibleAccounts.find(a => a.kind === 'credit_card')?.id ?? '');

      setStatus('ready');
    }
    load();
  }, [id, router]);

  function handleResponsibleChange(value: string) {
    setResponsible(value);
    if (value === 'i2' && i2AccountId) {
      setAccountId(i2AccountId);
    } else if (value !== 'i2' && pfAccountId && accountId === i2AccountId) {
      setAccountId(pfAccountId);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setError('');

    const db = createClient();
    const parsedAmount = parseFloat(amount.replace(',', '.'));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Valor inválido. Use números, ex: 49,90');
      setStatus('ready');
      return;
    }

    // selectedAcc já vem do scope do componente.
    // Cartão de crédito: compras são SEMPRE despesa (amount negativo).
    const finalAmount = selectedAcc?.kind === 'credit_card'
      ? -Math.abs(parsedAmount)
      : parsedAmount;

    const { error: err } = await db
      .from('transactions')
      .update({
        description,
        amount: finalAmount,
        occurred_on: date,
        responsible,
        account_id: accountId,
        entity_id: selectedAcc?.entity_id ?? null,
      })
      .eq('id', id);

    if (err) {
      setError('Erro ao salvar. Tente novamente.');
      setStatus('ready');
      return;
    }

    router.push('/lancamentos');
    router.refresh();
  }

  async function handleDelete() {
    setStatus('deleting');
    const db = createClient();
    await db.from('transactions').delete().eq('id', id);
    router.push('/lancamentos');
    router.refresh();
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/40 text-sm">Carregando...</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen px-4 pt-14">
        <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-red-400 font-semibold mb-3">{error}</p>
          <button onClick={() => router.back()} className="text-white/60 text-sm underline">Voltar</button>
        </div>
      </div>
    );
  }

  const isAdmin = role === 'admin';

  return (
    <div className="min-h-screen pb-28 md:pl-60 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% -5%, rgba(59,130,246,0.1) 0%, transparent 60%)' }} />
      <div className="px-4 md:px-8 pt-14 md:pt-8 page-container">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            ‹
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Editar lançamento</h1>
            {source === 'csv_import' && (
              <p className="text-[10px] text-white/30 mt-0.5">Importado do CSV</p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl p-4 mb-5 flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <span className="text-lg">⚠️</span>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">

        {/* Banner — compra do cartão tem campos travados */}
        {isCardPurchase && (
          <div
            className="rounded-2xl p-3.5 flex items-start gap-3"
            style={{
              background: fieldsLocked ? 'rgba(99,102,241,0.08)' : 'rgba(245,158,11,0.08)',
              border: `1px solid ${fieldsLocked ? 'rgba(99,102,241,0.2)' : 'rgba(245,158,11,0.25)'}`,
            }}
          >
            <span className="text-base">{fieldsLocked ? '🔒' : '⚠️'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs leading-relaxed" style={{ color: fieldsLocked ? 'rgba(165,180,252,0.95)' : 'rgba(252,211,77,0.95)' }}>
                {fieldsLocked
                  ? <>Compra do cartão Nubank. <strong>Valor, data e conta</strong> são definidos pelo banco — edite apenas <strong>descrição, responsável e notas</strong>.</>
                  : <>⚠️ Modo edição livre ativo — qualquer mudança em valor/data/conta vai descasar da fatura real do Nubank. Use só pra corrigir erros confirmados.</>}
              </p>
              {role === 'admin' && (
                <button
                  type="button"
                  onClick={() => setForceUnlock(v => !v)}
                  className="text-[10px] mt-1.5 underline opacity-70 hover:opacity-100"
                  style={{ color: fieldsLocked ? '#a5b4fc' : '#fbbf24' }}
                >
                  {fieldsLocked ? 'Editar mesmo assim →' : '← Voltar a travar'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Valor */}
        <div>
          <label className="block text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
            Valor (R$) {fieldsLocked && <span className="opacity-50">🔒</span>}
          </label>
          <input
            type="text" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*"
            value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0,00" required
            readOnly={fieldsLocked}
            className="w-full rounded-2xl px-5 py-4 text-white text-3xl font-bold placeholder-white/20 focus:outline-none transition-all"
            style={{
              ...inputStyle,
              fontVariantNumeric: 'tabular-nums',
              opacity: fieldsLocked ? 0.55 : 1,
              cursor: fieldsLocked ? 'not-allowed' : 'text',
            }}
            onFocus={e => { if (!fieldsLocked) e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'; }}
            onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Descrição</label>
          <input
            type="text" value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Ex: Mercado, farmácia..." required
            className="w-full rounded-xl px-4 py-3.5 text-white placeholder-white/25 text-base focus:outline-none transition-all"
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)')}
            onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        </div>

        {/* Data */}
        <div>
          <label className="block text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
            Data {fieldsLocked && <span className="opacity-50">🔒</span>}
          </label>
          <input
            type="date" value={date} onChange={e => setDate(e.target.value)} required
            readOnly={fieldsLocked}
            className="w-full rounded-xl px-4 py-3.5 text-white text-base focus:outline-none transition-all"
            style={{
              ...inputStyle,
              colorScheme: 'dark',
              opacity: fieldsLocked ? 0.55 : 1,
              cursor: fieldsLocked ? 'not-allowed' : 'text',
            }}
            onFocus={e => { if (!fieldsLocked) e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'; }}
            onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        </div>

        {/* Responsável */}
        <div>
          <label className="block text-white/40 text-xs uppercase tracking-wider mb-3">Responsável</label>
          <div className="grid grid-cols-2 gap-2.5">
            {RESPONSIBLE_OPTIONS.map(opt => {
              const isSelected = responsible === opt.value;
              return (
                <button
                  key={opt.value} type="button"
                  onClick={() => handleResponsibleChange(opt.value)}
                  className="flex items-center justify-center py-4 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-95"
                  style={{
                    background: isSelected ? opt.bg : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isSelected ? opt.border : 'rgba(255,255,255,0.08)'}`,
                    color: isSelected ? opt.accent : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conta — só admin com múltiplas contas */}
        {isAdmin && accounts.length > 1 && (
          <div>
            <label className="block text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
              Conta {fieldsLocked && <span className="opacity-50">🔒</span>}
            </label>
            <div className="flex flex-col gap-2" style={{ opacity: fieldsLocked ? 0.55 : 1, pointerEvents: fieldsLocked ? 'none' : 'auto' }}>
              {accounts.map(acc => {
                const isSelected = accountId === acc.id;
                const isPJ = acc.kind === 'company';
                const accent = isPJ ? '#f59e0b' : '#6366f1';
                return (
                  <button
                    key={acc.id} type="button"
                    onClick={() => !fieldsLocked && setAccountId(acc.id)}
                    disabled={fieldsLocked}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
                    style={{
                      background: isSelected ? (isPJ ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)') : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isSelected ? accent + '50' : 'rgba(255,255,255,0.08)'}`,
                      color: isSelected ? accent : 'rgba(255,255,255,0.45)',
                      cursor: fieldsLocked ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <span className="text-base">{KIND_ICON[acc.kind]}</span>
                    <span className="flex-1 text-left">{acc.name}</span>
                    {isPJ && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>PJ</span>}
                    {isSelected && <span className="text-[10px]" style={{ color: accent }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Anexos */}
        {householdId && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <TxAttachments
              transactionId={id}
              householdId={householdId}
              initial={attachments}
            />
          </div>
        )}

        {/* Salvar */}
        <button
          type="submit"
          disabled={status === 'saving' || !responsible}
          className="w-full font-semibold py-4 rounded-2xl text-white transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
        >
          {status === 'saving' ? 'Salvando...' : '✓ Salvar alterações'}
        </button>
      </form>

      {/* Excluir */}
      <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full py-3.5 rounded-2xl text-sm font-medium transition-all active:scale-95"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'rgba(248,113,113,0.8)' }}
          >
            Excluir lançamento
          </button>
        ) : (
          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <p className="text-red-300 text-sm font-semibold text-center">Tem certeza? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white/60"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={status === 'deleting'}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-40"
                style={{ background: 'rgba(239,68,68,0.6)' }}
              >
                {status === 'deleting' ? 'Excluindo...' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
