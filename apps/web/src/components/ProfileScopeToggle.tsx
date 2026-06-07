'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setProfileScope } from '@/app/_actions/scope';
import type { ProfileScope } from '@/lib/profile-scope';

interface Props {
  current: ProfileScope;
  /** Se operator, mostra travado em "Pessoal" sem opção de trocar */
  locked?: boolean;
  /** 'compact' (sidebar/mobile) ou 'full' (header desktop) */
  variant?: 'compact' | 'full';
}

const OPTIONS: Array<{ value: ProfileScope; emoji: string; label: string; color: string; bg: string }> = [
  { value: 'pessoal', emoji: '👨‍👩‍👧', label: 'Pessoal', color: '#a5b4fc', bg: 'rgba(99,102,241,0.15)' },
  { value: 'empresa', emoji: '🏢',     label: 'Empresa', color: '#fbbf24', bg: 'rgba(245,158,11,0.15)' },
  { value: 'tudo',    emoji: '🌐',     label: 'Tudo',    color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
];

export function ProfileScopeToggle({ current, locked = false, variant = 'compact' }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick(scope: ProfileScope) {
    if (locked || scope === current) return;
    startTransition(async () => {
      await setProfileScope(scope);
      router.refresh();
    });
  }

  if (locked) {
    const active = OPTIONS.find(o => o.value === current) ?? OPTIONS[0]!;
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px]"
        style={{ background: active.bg, border: `1px solid ${active.color}40`, color: active.color }}
        title="Você só tem acesso aos dados pessoais"
      >
        <span>{active.emoji}</span>
        <span className="font-medium">{active.label}</span>
      </div>
    );
  }

  return (
    <div
      className={variant === 'compact'
        ? 'inline-flex rounded-xl p-0.5 gap-0.5'
        : 'inline-flex rounded-xl p-1 gap-1'}
      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {OPTIONS.map(opt => {
        const isActive = opt.value === current;
        return (
          <button
            key={opt.value}
            onClick={() => handleClick(opt.value)}
            disabled={isPending}
            className={variant === 'compact'
              ? 'px-2 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 disabled:opacity-50'
              : 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50'}
            style={{
              background: isActive ? opt.bg : 'transparent',
              color: isActive ? opt.color : 'rgba(255,255,255,0.45)',
              border: `1px solid ${isActive ? opt.color + '40' : 'transparent'}`,
            }}
          >
            <span>{opt.emoji}</span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
