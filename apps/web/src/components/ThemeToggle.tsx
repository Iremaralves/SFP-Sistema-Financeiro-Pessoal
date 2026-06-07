'use client';

import { useTheme } from './ThemeProvider';

const OPTS: { v: 'light' | 'dark' | 'system'; icon: string; label: string }[] = [
  { v: 'light',  icon: '☀',  label: 'Claro'    },
  { v: 'dark',   icon: '☾',  label: 'Escuro'   },
  { v: 'system', icon: '◐',  label: 'Auto'     },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className="flex items-center gap-0.5 rounded-xl p-0.5"
      style={{ background: 'var(--surface-1)', border: '1px solid var(--border-soft)' }}
    >
      {OPTS.map((o) => {
        const active = theme === o.v;
        return (
          <button
            key={o.v}
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            title={o.label}
            onClick={() => setTheme(o.v)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-all"
            style={{
              background: active ? 'rgba(59,130,246,0.18)' : 'transparent',
              color: active ? '#93c5fd' : 'var(--text-3)',
              border: `1px solid ${active ? 'rgba(59,130,246,0.3)' : 'transparent'}`,
            }}
          >
            {o.icon}
          </button>
        );
      })}
    </div>
  );
}
