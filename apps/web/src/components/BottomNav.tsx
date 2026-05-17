'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', icon: '⌂', label: 'Início' },
  { href: '/lancamentos', icon: '≡', label: 'Lançamentos' },
  { href: '/lancamentos/novo', icon: '+', label: 'Adicionar' },
  { href: '/mes', icon: '◎', label: 'Mês' },
];

export function BottomNav({ role }: { role: 'admin' | 'operator' }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || role === 'admin');

  return (
    <nav className="fixed bottom-0 left-0 right-0 safe-bottom" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/lancamentos' && pathname.startsWith(item.href + '/'));
          const isAdd = item.href === '/lancamentos/novo';
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 px-5 py-2 transition-all duration-200 ${
                isAdd
                  ? 'text-white'
                  : isActive
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/70'
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
                  <span className="text-xl leading-none">{item.icon}</span>
                  <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
