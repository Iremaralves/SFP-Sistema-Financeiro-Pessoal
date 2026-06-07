'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface Ctx {
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (t: Theme) => void;
}

const ThemeCtx = createContext<Ctx | null>(null);

function resolve(t: Theme): 'light' | 'dark' {
  if (t === 'system') {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return t;
}

function apply(resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', resolved);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolved, setResolvedState] = useState<'light' | 'dark'>('dark');

  // Carrega preferência do localStorage uma vez
  useEffect(() => {
    const stored = (typeof window !== 'undefined' && localStorage.getItem('i2-theme')) as Theme | null;
    const initial: Theme = stored ?? 'dark';
    setThemeState(initial);
    const r = resolve(initial);
    setResolvedState(r);
    apply(r);
  }, []);

  // Reage a mudanças no system theme
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => {
      const r = resolve('system');
      setResolvedState(r);
      apply(r);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    if (typeof window !== 'undefined') localStorage.setItem('i2-theme', t);
    const r = resolve(t);
    setResolvedState(r);
    apply(r);
  }, []);

  return <ThemeCtx.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) return { theme: 'dark' as Theme, resolved: 'dark' as const, setTheme: () => {} };
  return ctx;
}
