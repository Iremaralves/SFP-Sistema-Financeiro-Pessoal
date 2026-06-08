'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ProfileScopeToggle } from './ProfileScopeToggle';
import type { ProfileScope } from '@/lib/profile-scope';

const NAV_ADMIN = [
  { href: '/dashboard',        icon: '⌂', label: 'Início' },
  { href: '/compromissos',     icon: '◫', label: 'A Pagar' },
  { href: '/lancamentos/novo', icon: '+', label: '' },
  { href: '/lancamentos',      icon: '≡', label: 'Lançamentos' },
  { href: '#mais',             icon: '⋯', label: 'Mais' },
];

const NAV_OPERATOR = [
  { href: '/dashboard',        icon: '⌂', label: 'Início' },
  { href: '/lancamentos',      icon: '≡', label: 'Lançamentos' },
  { href: '/lancamentos/novo', icon: '+', label: '' },
  { href: '/importar',         icon: '↑', label: 'Importar' },
  { href: '#mais',             icon: '⋯', label: 'Mais' },
];

const MAIS_ITEMS_OPERATOR = [
  { href: '/contas',     icon: '◉',  label: 'Contas',       desc: 'Saldos e contas bancárias' },
  { href: '/acerto',     icon: '⚖️', label: 'Acerto Casal', desc: 'Fechamento Iremar × Juliana' },
  { href: '/mes',        icon: '📅', label: 'Fechamento',   desc: 'Resumo do mês atual' },
  { href: '/relatorios', icon: '📊', label: 'Relatórios',   desc: 'Resumos e gráficos' },
];

const MAIS_ITEMS = [
  { href: '/contas',          icon: '◉',  label: 'Contas',          desc: 'Saldos das contas bancárias' },
  { href: '/importar',        icon: '↑',  label: 'Importar CSV',    desc: 'Importar extratos do cartão' },
  { href: '/categorizar',     icon: '🏷️', label: 'Categorizar',     desc: 'Lançamentos pendentes' },
  { href: '/empresa',         icon: '🏢', label: 'Empresa',         desc: 'DRE e gestão i2 Soluções' },
  { href: '/relatorios',      icon: '📊', label: 'Relatórios',      desc: 'Fluxo de caixa, contas a pagar' },
  { href: '/transferencias',  icon: '⇄',  label: 'Transferências',  desc: 'Movimentações entre contas' },
  { href: '/acerto',          icon: '⚖️', label: 'Acerto Casal',    desc: 'Fechamento Iremar × Juliana (dia 13)' },
  { href: '/empresa/notas',   icon: '🧾', label: 'Notas Fiscais',   desc: 'NFs dos recebimentos da i2' },
  { href: '/backups',         icon: '🛡️', label: 'Backups',         desc: 'Pontos de restore antes de mudanças' },
];

export function BottomNav({
  role,
  name = '',
  scope = 'tudo',
}: {
  role: 'admin' | 'operator';
  name?: string;
  scope?: ProfileScope;
}) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [maisOpen, setMaisOpen] = useState(false);

  const isOp = role === 'operator';
  const items = role === 'admin' ? NAV_ADMIN : NAV_OPERATOR;
  const allMaisItems = role === 'admin' ? MAIS_ITEMS : MAIS_ITEMS_OPERATOR;
  // Filtra "Mais" pelo escopo ativo
  const maisItems = allMaisItems.filter(item => {
    if (scope === 'pessoal' && (item.href === '/empresa' || item.href === '/empresa/notas')) return false;
    if (scope === 'empresa' && (item.href === '/acerto' || item.href === '/categorizar' || item.href === '/mes')) return false;
    return true;
  });

  function handleClick(href: string) {
    if (href === '#mais') {
      setMaisOpen(true);
    } else {
      router.push(href);
    }
  }

  return (
    <>
      {/* ── Sidebar desktop (só admin) ─────────────────── */}
      <Sidebar role={role} name={name} scope={scope} />

      {/* ── Bottom Nav (mobile) ────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 md:hidden z-40"
        style={{
          background: 'rgba(0,0,0,0.9)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-center justify-between px-1 py-1.5 max-w-lg mx-auto">
          {items.map((item) => {
            const isAdd    = item.href === '/lancamentos/novo';
            const isMais   = item.href === '#mais';
            const isActive =
              !isAdd &&
              !isMais &&
              (pathname === item.href || pathname.startsWith(item.href + '/'));

            return (
              <button
                key={item.href}
                onClick={() => handleClick(item.href)}
                className={`relative flex flex-col items-center gap-0.5 flex-1 py-1.5 bg-transparent border-0 transition-all duration-200 ${
                  isAdd ? 'text-white' : isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {isAdd ? (
                  <span
                    className="flex items-center justify-center w-10 h-10 rounded-2xl text-white font-bold text-xl"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                  >
                    {item.icon}
                  </span>
                ) : (
                  <>
                    <span className="text-lg leading-none">{item.icon}</span>
                    <span className="text-[9px] font-medium tracking-wide leading-tight">{item.label}</span>
                    {isActive && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Drawer "Mais" ──────────────────────────────── */}
      {maisOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 md:hidden"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMaisOpen(false)}
          />

          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden rounded-t-3xl"
            style={{
              background: 'rgba(8,8,16,0.98)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderBottom: 'none',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="px-4 pt-2 pb-5">
              {/* Toggle de perfil ficou só no header do dashboard */}
              <p className="text-white/25 text-[10px] uppercase tracking-widest mb-3 px-1">
                Menu
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {maisItems.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMaisOpen(false)}
                      className="flex flex-col gap-1.5 p-4 rounded-2xl transition-all active:scale-95"
                      style={{
                        background: isActive
                          ? 'rgba(59,130,246,0.12)'
                          : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${
                          isActive
                            ? 'rgba(59,130,246,0.25)'
                            : 'rgba(255,255,255,0.08)'
                        }`,
                      }}
                    >
                      <span className="text-2xl leading-none">{item.icon}</span>
                      <span
                        className="text-sm font-semibold leading-tight"
                        style={{ color: isActive ? '#60a5fa' : 'rgba(255,255,255,0.85)' }}
                      >
                        {item.label}
                      </span>
                      <span
                        className="text-[10px] leading-tight"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        {item.desc}
                      </span>
                    </Link>
                  );
                })}
              </div>

              <button
                onClick={() => setMaisOpen(false)}
                className="w-full mt-3 py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.35)',
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
