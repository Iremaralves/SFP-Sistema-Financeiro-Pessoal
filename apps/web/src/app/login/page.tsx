'use client';

import { createClient } from '@/lib/supabase';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const db = createClient();
    const { error: err } = await db.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-4 text-2xl"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.2))', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            💰
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">i2 Finance</h1>
          <p className="text-white/40 text-sm mt-1">Gestão financeira familiar</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📧</div>
              <h2 className="font-semibold text-white mb-2">Link enviado!</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                Verifique seu e-mail <span className="text-white/80 font-medium">{email}</span> e clique no link para entrar.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/50 text-xs uppercase tracking-wider mb-2">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full rounded-xl px-4 py-3 text-white placeholder-white/25 text-base focus:outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
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
                style={{ background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
              >
                {loading ? 'Enviando...' : 'Entrar com magic link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
