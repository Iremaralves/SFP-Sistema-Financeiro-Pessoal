'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from './LogoutButton';
import { ThemeToggle } from './ThemeToggle';
import { ProfileScopeToggle } from './ProfileScopeToggle';
import type { ProfileScope } from '@/lib/profile-scope';

const NAV_ITEMS_ADMIN = [
  { href: '/dashboard',       icon: '⌂',  label: 'Início' },
  { href: '/lancamentos',     icon: '≡',  label: 'Lançamentos' },
  { href: '/compromissos',    icon: '◫',  label: 'Compromissos' },
  { href: '/contas',          icon: '◉',  label: 'Contas' },
  { href: '/transferencias',  icon: '⇄',  label: 'Transferências' },
  { href: '/acerto',          icon: '⚖️', label: 'Acerto Casal' },
  { href: '/empresa',         icon: '🏢', label: 'Empresa' },
  { href: '/relatorios',      icon: '📊', label: 'Relatórios' },
  { href: '/importar',        icon: '↑',  label: 'Importar CSV' },
];

const NAV_ITEMS_OPERATOR = [
  { href: '/dashboard',       icon: '⌂',  label: 'Início' },
  { href: '/lancamentos',     icon: '≡',  label: 'Lançamentos' },
  { href: '/categorizar',     icon: '🏷️', label: 'Categorizar' },
  { href: '/importar',        icon: '↑',  label: 'Importar CSV' },
  { href: '/compromissos',    icon: '◫',  label: 'Compromissos' },
  { href: '/contas',          icon: '◉',  label: 'Contas' },
  { href: '/acerto',          icon: '⚖️', label: 'Acerto Casal' },
  { href: '/mes',             icon: '📅', label: 'Fechamento' },
  { href: '/relatorios',      icon: '📊', label: 'Relatórios' },
];

export function Sidebar({
  role,
  name,
  scope = 'tudo',
}: {
  role: 'admin' | 'operator';
  name: string;
  scope?: ProfileScope;
}) {
  const pathname = usePathname();
  const NAV_BASE = role === 'admin' ? NAV_ITEMS_ADMIN : NAV_ITEMS_OPERATOR;
  // Filtra itens irrelevantes ao escopo ativo
  const NAV_ITEMS = NAV_BASE.filter(item => {
    if (scope === 'pessoal' && item.href === '/empresa') return false;
    if (scope === 'empresa' && (item.href === '/acerto' || item.href === '/categorizar' || item.href === '/mes')) return false;
    return true;
  });
  const isOp = role === 'operator';
  // Cor de active state: azul para admin, rosa para operator
  const accentActive   = isOp ? '#f9a8d4' : '#60a5fa';
  const accentBg       = isOp ? 'rgba(236,72,153,0.12)' : 'rgba(59,130,246,0.12)';
  const accentBorder   = isOp ? 'rgba(236,72,153,0.2)'  : 'rgba(59,130,246,0.2)';
  const logoGradient   = isOp ? 'linear-gradient(135deg, #ec4899, #f472b6)' : 'linear-gradient(135deg, #3b82f6, #6366f1)';

  const firstName = (name || '').split(' ')[0] || (isOp ? 'Juliana' : 'Iremar');

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-60 hidden md:flex flex-col z-40"
      style={{
        background: 'rgba(5,5,10,0.97)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/05">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: logoGradient }}
          >
            <span className="text-white text-xs font-bold">i2</span>
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-tight">i2 Finance</p>
            <p className="text-white/25 text-[10px]">Gestão financeira</p>
          </div>
        </div>
      </div>

      {/* Toggle de perfil ficou só no header do dashboard pra evitar redundância */}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                background: isActive ? accentBg : 'transparent',
                color: isActive ? accentActive : 'rgba(255,255,255,0.45)',
                border: `1px solid ${isActive ? accentBorder : 'transparent'}`,
              }}
            >
              <span className="w-5 text-center text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-white/05 space-y-2">
        <div className="flex items-center justify-center px-3">
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between px-3 py-2">
          <div>
            <p className="text-white/50 text-xs font-medium">{firstName}</p>
            <p className="text-white/20 text-[10px]">{role}</p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
