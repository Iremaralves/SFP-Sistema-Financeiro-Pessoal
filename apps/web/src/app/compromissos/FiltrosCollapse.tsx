'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Tab { id: string; label: string; color: string }
interface OrdemOpcao { id: string; label: string }

interface Props {
  entidadeFiltro: string;
  ordem: string;
  tabs: Tab[];
  ordemOpcoes: OrdemOpcao[];
  buildHref: (overrides: Record<string, string>) => string;
}

/**
 * Esconde Entidade + Ordenação atrás de um botão "Filtros".
 * Status e Mês continuam visíveis (uso frequente).
 * Badge com contador quando há filtros ativos além do default.
 */
export function FiltrosCollapse({ entidadeFiltro, ordem, tabs, ordemOpcoes, buildHref }: Props) {
  const [open, setOpen] = useState(false);

  const activeCount =
    (entidadeFiltro !== 'todos' ? 1 : 0) +
    (ordem !== 'venc_asc' ? 1 : 0);

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all flex-shrink-0"
        style={{
          background: activeCount > 0 ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${activeCount > 0 ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)'}`,
          color: activeCount > 0 ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
        }}
      >
        <span>{open ? '▾' : '▸'} Filtros</span>
        {activeCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
            style={{ background: '#a5b4fc', color: '#1a1a1a' }}>
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="rounded-2xl p-3 mt-2 space-y-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Entidade */}
          <div>
            <p className="text-white/30 text-[9px] uppercase tracking-widest mb-1.5">Entidade</p>
            <div className="flex gap-2">
              {tabs.map(tab => {
                const isActive = entidadeFiltro === tab.id;
                return (
                  <Link
                    key={tab.id}
                    href={buildHref({ entidade: tab.id })}
                    className="flex-1 py-1.5 rounded-xl text-center text-xs font-semibold transition-all"
                    style={{
                      background: isActive ? `${tab.color}20` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isActive ? tab.color + '50' : 'rgba(255,255,255,0.08)'}`,
                      color: isActive ? tab.color : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Ordenação */}
          <div>
            <p className="text-white/30 text-[9px] uppercase tracking-widest mb-1.5">Ordenar por</p>
            <div className="flex gap-1.5 flex-wrap">
              {ordemOpcoes.map(o => {
                const isActive = ordem === o.id;
                return (
                  <Link
                    key={o.id}
                    href={buildHref({ ordem: o.id })}
                    className="px-2.5 py-1.5 rounded-full text-[10px] font-semibold transition-all"
                    style={{
                      background: isActive ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isActive ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.45)',
                    }}
                  >
                    {o.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
