'use client';

import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LogoutButton() {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);

  async function handleLogout() {
    const db = createClient();
    await db.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-white/40 text-xs">Sair?</span>
        <button
          onClick={handleLogout}
          className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded-lg"
          style={{ background: 'rgba(239,68,68,0.12)' }}
        >
          Sim
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          Não
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="w-8 h-8 flex items-center justify-center rounded-xl text-white/30 hover:text-white/60 transition-colors"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
      title="Sair"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16,17 21,12 16,7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    </button>
  );
}
