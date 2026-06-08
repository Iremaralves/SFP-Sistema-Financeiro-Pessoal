'use client';

import { useState, useRef, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { actionDarBaixa, actionDesfazerBaixa } from '@/app/compromissos/actions';
import { StatusBadge, statusColor, type Status } from './StatusBadge';

interface Entity { id: string; name: string; type: string; color: string }

interface Props {
  commitmentId: string;
  description: string;
  dueDay: number;
  amount: number;
  paymentMethod: string | null;
  recurrenceType: string | null;
  responsible: string;
  paidBy: string | null;
  status: Status;
  isPaid: boolean;
  entity: Entity | null;
  /** Mês de referência (YYYY-MM) — usado na ação dar baixa */
  referenceMonth: string;
  /** Compromisso de cartão de crédito não tem swipe-pra-pagar */
  isCreditCard?: boolean;
}

const PAYMENT_ICON: Record<string, string> = {
  boleto: '🏦', pix: '⚡', credit_card: '💳',
};

const RECURRENCE_LABEL: Record<string, string> = {
  monthly: 'Mensal', weekly: 'Semanal', bimonthly: 'Quinzenal',
  quarterly: 'Trimestral', semiannual: 'Semestral', annual: 'Anual',
};

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

const SWIPE_THRESHOLD = 80; // px pra revelar ação
const SWIPE_TRIGGER  = 140; // px pra disparar automaticamente

export function CompromissoRow({
  commitmentId, description, dueDay, amount, paymentMethod, recurrenceType,
  responsible: _responsible, paidBy, status, isPaid, entity, referenceMonth, isCreditCard = false,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [drag, setDrag] = useState(0); // px arrastados (sempre positivo, swipe pra direita)
  const [confirming, setConfirming] = useState(false);
  const [optimisticPaid, setOptimisticPaid] = useState(isPaid);
  const startX = useRef<number | null>(null);

  const isI2 = entity?.type === 'business';
  const pmIcon = PAYMENT_ICON[paymentMethod ?? 'boleto'];
  const recLabel = RECURRENCE_LABEL[recurrenceType ?? 'monthly'] ?? 'Mensal';

  // Cor da borda esquerda: status (vermelho/amarelo/verde) ou âmbar pra i2
  const borderColor = optimisticPaid
    ? statusColor('paid')
    : isI2 && status !== 'overdue'
    ? '#f59e0b'
    : statusColor(status);

  // ── Swipe handlers ──────────────────────────────────────────────────
  function onPointerDown(e: React.PointerEvent) {
    if (isCreditCard || optimisticPaid || isPending) return;
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (dx > 5) setDrag(Math.min(dx, 200));
    else if (dx < -5) setDrag(0); // permite cancelar
  }
  function onPointerUp() {
    if (startX.current === null) return;
    startX.current = null;
    if (drag >= SWIPE_TRIGGER) {
      // Auto-confirma
      handleQuickPay();
    } else if (drag >= SWIPE_THRESHOLD) {
      // Mostra estado "confirma?"
      setConfirming(true);
      setDrag(SWIPE_THRESHOLD);
    } else {
      // Não atingiu threshold — volta
      setDrag(0);
    }
  }

  function handleQuickPay() {
    setConfirming(false);
    setOptimisticPaid(true);
    setDrag(0);
    startTransition(async () => {
      const res = await actionDarBaixa(commitmentId, amount, referenceMonth, {
        paidAmount: amount,
        paidOn: new Date().toISOString().slice(0, 10),
      });
      if (res.ok) {
        router.refresh();
      } else {
        // Reverte otimismo
        setOptimisticPaid(false);
        alert(res.error ?? 'Erro ao dar baixa');
      }
    });
  }

  function handleCancel() {
    setConfirming(false);
    setDrag(0);
  }

  function handleUndo() {
    setOptimisticPaid(false);
    startTransition(async () => {
      const res = await actionDesfazerBaixa(commitmentId, referenceMonth);
      if (res.ok) {
        router.refresh();
      } else {
        setOptimisticPaid(true);
        alert(res.error ?? 'Erro ao desfazer');
      }
    });
  }

  return (
    <div className="relative overflow-hidden rounded-2xl select-none" style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Camada de fundo verde revelada pelo swipe */}
      <div
        className="absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-300 text-sm font-semibold"
        style={{
          width: Math.max(drag, 0),
          background: 'linear-gradient(90deg, rgba(16,185,129,0.18), rgba(16,185,129,0.06))',
          transition: drag === 0 ? 'width 0.2s' : 'none',
        }}
      >
        {drag >= SWIPE_THRESHOLD && (
          <span>✓ Marcar como pago</span>
        )}
      </div>

      {/* Linha principal — translada com o drag */}
      <div
        className="relative flex items-stretch gap-3 transition-transform"
        style={{
          transform: `translateX(${drag}px)`,
          transitionDuration: startX.current === null ? '0.2s' : '0ms',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={handleCancel}
      >
        {/* Borda colorida esquerda — 2px */}
        <div className="w-[3px] flex-shrink-0" style={{ background: borderColor }} />

        <div className="flex items-center gap-3 px-3 py-3 flex-1 min-w-0">
          {/* Dia */}
          <div className="flex-shrink-0 w-9 h-9 rounded-lg flex flex-col items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${borderColor}33` }}>
            <span className="text-[8px] font-bold leading-none" style={{ color: borderColor }}>dia</span>
            <span className="text-sm font-bold leading-none" style={{ color: borderColor }}>{dueDay}</span>
          </div>

          {/* Info */}
          <Link href={`/compromissos/${commitmentId}`} className="flex-1 min-w-0 active:opacity-70">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-white text-sm font-medium truncate">{description}</p>
              {isI2 && (
                <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>i2</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={optimisticPaid ? 'paid' : status} size="xs" />
              <span className="text-[10px] text-white/30">{pmIcon} {recLabel}</span>
              {paidBy && paidBy !== 'iremar' && (
                <span className="text-[9px] px-1 py-0.5 rounded"
                  style={{
                    background: paidBy === 'juliana' ? 'rgba(236,72,153,0.12)' : 'rgba(99,102,241,0.12)',
                    color:      paidBy === 'juliana' ? '#f472b6' : '#a5b4fc',
                  }}>
                  paga: {paidBy === 'juliana' ? 'Ju' : paidBy}
                </span>
              )}
            </div>
          </Link>

          {/* Valor + ação */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-semibold text-white tabular">
              {fmt(amount)}
            </span>
            {optimisticPaid ? (
              <button
                onClick={handleUndo}
                disabled={isPending}
                className="text-[10px] px-2 py-1 rounded-md font-semibold transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                Desfazer
              </button>
            ) : !isCreditCard ? (
              <button
                onClick={handleQuickPay}
                disabled={isPending}
                className="text-[10px] px-2 py-1 rounded-md font-semibold transition-all active:scale-95"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.28)' }}>
                {isPending ? '...' : '✓ Pagar'}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Diálogo inline de confirmação após swipe */}
      {confirming && !optimisticPaid && (
        <div className="absolute inset-0 flex items-center justify-end pr-3 gap-2"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
          <button onClick={handleCancel}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
            Cancelar
          </button>
          <button onClick={handleQuickPay}
            className="px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>
            ✓ Confirmar pagamento
          </button>
        </div>
      )}
    </div>
  );
}
