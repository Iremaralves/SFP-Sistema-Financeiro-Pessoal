'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useTransition, useCallback } from 'react';

const RESPONSAVEIS = [
  { value: '', label: 'Todos' },
  { value: 'iremar', label: 'Iremar', color: '#93c5fd' },
  { value: 'juliana', label: 'Juliana', color: '#f9a8d4' },
  { value: 'casal', label: 'Casal', color: '#67e8f9' },
  { value: 'i2', label: 'i2 Soluções', color: '#fcd34d' },
  { value: 'unassigned', label: 'Sem responsável', color: '#fca5a5' },
];

const ORIGENS = [
  { value: '', label: 'Todas' },
  { value: 'csv_import', label: 'Importado CSV' },
  { value: 'manual_pwa', label: 'Manual (app)' },
  { value: 'manual_cli', label: 'Manual (CLI)' },
];

const ORDENS = [
  { value: 'data_desc', label: 'Data ↓ (mais recente)' },
  { value: 'data_asc', label: 'Data ↑ (mais antigo)' },
  { value: 'valor_desc', label: 'Valor ↓ (maior)' },
  { value: 'valor_asc', label: 'Valor ↑ (menor)' },
];

interface Props {
  meses: Array<{ value: string; label: string }>;
  totalResults: number;
  totalValor: number;
  activeFiltersCount: number;
}

export function Filtros({ meses, totalResults, totalValor, activeFiltersCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [aberto, setAberto] = useState(false);

  const get = (key: string, def = '') => searchParams.get(key) ?? def;

  const set = useCallback((updates: Record<string, string>) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [searchParams, pathname, router]);

  function limpar() {
    startTransition(() => router.push(pathname));
  }

  function fmt(n: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  }

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-all";
  const inputStyle = {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.1)',
  };

  return (
    <div className="space-y-2">
      {/* Barra de controle */}
      <div className="flex items-center gap-2">
        {/* Busca rápida */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            defaultValue={get('q')}
            placeholder="Buscar descrição..."
            className={`${inputCls} pl-8 pr-3`}
            style={inputStyle}
            onChange={e => set({ q: e.target.value })}
          />
        </div>

        {/* Botão filtros */}
        <button
          onClick={() => setAberto(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex-shrink-0"
          style={{
            background: aberto || activeFiltersCount > 0 ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.07)',
            border: `1px solid ${aberto || activeFiltersCount > 0 ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: aberto || activeFiltersCount > 0 ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Filtros
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center flex-shrink-0"
              style={{ background: '#6366f1', color: 'white' }}>
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Painel de filtros */}
      {aberto && (
        <div className="rounded-2xl p-4 space-y-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>

          {/* Linha 1: Mês + Responsável */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-white/35 uppercase tracking-wider mb-1.5">Mês</label>
              <select
                value={get('mes')}
                onChange={e => set({ mes: e.target.value })}
                className={inputCls}
                style={{ ...inputStyle, colorScheme: 'dark' }}
              >
                <option value="">Mês atual</option>
                <option value="todos">Todos os meses</option>
                {meses.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-white/35 uppercase tracking-wider mb-1.5">Responsável</label>
              <select
                value={get('responsavel')}
                onChange={e => set({ responsavel: e.target.value })}
                className={inputCls}
                style={{ ...inputStyle, colorScheme: 'dark' }}
              >
                {RESPONSAVEIS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Linha 2: Origem + Ordem */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-white/35 uppercase tracking-wider mb-1.5">Origem</label>
              <select
                value={get('origem')}
                onChange={e => set({ origem: e.target.value })}
                className={inputCls}
                style={{ ...inputStyle, colorScheme: 'dark' }}
              >
                {ORIGENS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-white/35 uppercase tracking-wider mb-1.5">Ordenar por</label>
              <select
                value={get('ordem', 'data_desc')}
                onChange={e => set({ ordem: e.target.value })}
                className={inputCls}
                style={{ ...inputStyle, colorScheme: 'dark' }}
              >
                {ORDENS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Linha 3: Valor min/max */}
          <div>
            <label className="block text-[10px] text-white/35 uppercase tracking-wider mb-1.5">Faixa de valor (R$)</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                defaultValue={get('min')}
                placeholder="Mínimo"
                className={`${inputCls} flex-1`}
                style={inputStyle}
                onChange={e => set({ min: e.target.value })}
              />
              <span className="text-white/20 text-sm flex-shrink-0">até</span>
              <input
                type="text"
                inputMode="decimal"
                defaultValue={get('max')}
                placeholder="Máximo"
                className={`${inputCls} flex-1`}
                style={inputStyle}
                onChange={e => set({ max: e.target.value })}
              />
            </div>
          </div>

          {/* Limpar filtros */}
          {activeFiltersCount > 0 && (
            <button
              onClick={limpar}
              className="w-full py-2.5 rounded-xl text-sm text-white/50 hover:text-white/70 transition-colors"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              ✕ Limpar todos os filtros
            </button>
          )}
        </div>
      )}

      {/* Resumo dos resultados */}
      <div className="flex items-center justify-between px-1">
        <p className="text-white/30 text-xs">
          {isPending ? 'Filtrando...' : `${totalResults} lançamento${totalResults !== 1 ? 's' : ''}`}
          {activeFiltersCount > 0 && <span className="text-indigo-400/60"> · {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} ativo{activeFiltersCount !== 1 ? 's' : ''}</span>}
        </p>
        <p className="text-xs font-semibold" style={{ color: '#f1f5f9', fontVariantNumeric: 'tabular-nums' }}>
          {fmt(totalValor)}
        </p>
      </div>
    </div>
  );
}
