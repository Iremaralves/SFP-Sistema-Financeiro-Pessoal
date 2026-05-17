'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

interface Props {
  meses: Array<{ value: string; label: string }>;
  mesSelecionado: string;
}

export function FiltroMes({ meses, mesSelecionado }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function navegar(mes: string) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      // mês atual = sem parâmetro (URL limpa)
      if (mes === meses[0]?.value) {
        params.delete('mes');
      } else {
        params.set('mes', mes);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  const idx = meses.findIndex(m => m.value === mesSelecionado);
  const prev = meses[idx + 1];
  const next = idx > 0 ? meses[idx - 1] : null;

  return (
    <div className="flex items-center gap-2">
      {/* Botão mês anterior */}
      <button
        onClick={() => prev && navegar(prev.value)}
        disabled={!prev || isPending}
        className="w-8 h-8 flex items-center justify-center rounded-xl text-white/40 hover:text-white/70 disabled:opacity-20 transition-colors flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        ‹
      </button>

      {/* Seletor de mês */}
      <select
        value={mesSelecionado}
        onChange={e => navegar(e.target.value)}
        disabled={isPending}
        className="flex-1 rounded-xl px-3 py-2 text-sm font-medium text-white text-center focus:outline-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.1)',
          colorScheme: 'dark',
        }}
      >
        {meses.map(m => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      {/* Botão próximo mês */}
      <button
        onClick={() => next && navegar(next.value)}
        disabled={!next || isPending}
        className="w-8 h-8 flex items-center justify-center rounded-xl text-white/40 hover:text-white/70 disabled:opacity-20 transition-colors flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        ›
      </button>
    </div>
  );
}
