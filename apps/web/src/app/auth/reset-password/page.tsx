'use client';

export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const db = createClient();
    const { data: { subscription } } = db.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    setLoading(true);
    setError('');

    const db = createClient();
    const { error: err } = await db.auth.updateUser({ password });
    if (err) {
      setError(err.message);
    } else {
      setDone(true);
      setTimeout(() => { window.location.href = '/dashboard'; }, 2000);
    }
    setLoading(false);
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.1)',
  } as React.CSSProperties;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-4 text-2xl"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.2))', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            💰
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">i2 Finance</h1>
          <p className="text-white/40 text-sm mt-1">Definir senha</p>
        </div>

        <div className="rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {done ? (
            <div className="text-center py-2">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-white font-semibold">Senha definida!</p>
              <p className="text-white/40 text-sm mt-2">Redirecionando...</p>
            </div>
          ) : !ready ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">🔗</div>
              <p className="text-white/60 text-sm">Verificando link...</p>
              <p className="text-white/30 text-xs mt-3">Se esta página não carregar, verifique se clicou no link mais recente do e-mail.</p>
              <a href="/login" className="block mt-4 text-white/40 text-sm hover:text-white/60">← Voltar ao login</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/50 text-xs uppercase tracking-wider mb-2">Nova senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="mínimo 8 caracteres"
                  required
                  autoComplete="new-password"
                  className="w-full rounded-xl px-4 py-3 text-white placeholder-white/25 text-base focus:outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.6)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>
              <div>
                <label className="block text-white/50 text-xs uppercase tracking-wider mb-2">Confirmar senha</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="repita a senha"
                  required
                  autoComplete="new-password"
                  className="w-full rounded-xl px-4 py-3 text-white placeholder-white/25 text-base focus:outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.6)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm rounded-xl px-3 py-2" style={{ background: 'rgba(239,68,68,0.1)' }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full font-semibold py-3.5 rounded-xl text-white transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
              >
                {loading ? 'Salvando...' : 'Salvar senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
