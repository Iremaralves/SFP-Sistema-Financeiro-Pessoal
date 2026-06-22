'use client';

import { splitFixedVariable } from '@i2fin/core';
import type { Transaction } from '@i2fin/schema';

interface Props {
  renda: number;          // pró-labore + lucros
  fixosPF: number;        // boletos PF mensais que o Iremar paga (inclui poupança)
  faturaParte: number;    // parte do Iremar na fatura
  guardado: number;       // Tesouro + Reserva (poupança do mês)
  transactions: Transaction[];  // do ciclo, pra split fixo×variável
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

const CAT_META: Record<string, { label: string; emoji: string }> = {
  restaurante: { label: 'Restaurante / delivery', emoji: '🍔' },
  combustivel: { label: 'Combustível', emoji: '⛽' },
  mercado:     { label: 'Mercado', emoji: '🛒' },
  farmacia:    { label: 'Farmácia', emoji: '💊' },
  outros:      { label: 'Outros', emoji: '🧾' },
};

export function FinancialHealth({ renda, fixosPF, faturaParte, guardado, transactions }: Props) {
  const comprometido = fixosPF + faturaParte;
  const folga = renda - comprometido;
  const pctComprometido = renda > 0 ? Math.min(130, (comprometido / renda) * 100) : 0;

  // Split fixo×variável da alçada do Iremar (gastos dele + casal)
  const bd = splitFixedVariable(transactions, ['iremar', 'casal']);
  const totalCartao = bd.fixoCartao + bd.variavelCartao;
  const fixoTotal = fixosPF + bd.fixoCartao;
  const variavelTotal = bd.variavelCartao;

  // Categorias de variável ordenadas (maior vazamento primeiro)
  const cats = Object.entries(bd.categorias)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const maiorCat = cats[0];
  const maxCatVal = maiorCat ? maiorCat[1] : 1;

  // Veredito
  const veredito = folga < 0
    ? { txt: 'Frear urgente — o mês fechou no vermelho.', color: '#f87171' }
    : folga < 300
    ? { txt: 'Frear os variáveis. A renda paga as contas e ainda guarda — o aperto está no consumo do cartão.', color: '#fbbf24' }
    : { txt: 'Equilibrado. Dá pra manter o padrão e reforçar a reserva.', color: '#34d399' };

  // Nudge (1 ação)
  const nudge = (() => {
    if (maiorCat && maiorCat[0] === 'restaurante' && maiorCat[1] > 450) {
      return `Comer fora já passou de ${fmt(maiorCat[1])} (seus + casal). Segura os próximos dias e a folga respira.`;
    }
    if (folga < 300) {
      return `Folga apertada (${fmt(folga)}). Evita gasto não-essencial no cartão até o fim do ciclo.`;
    }
    if (maiorCat) {
      return `Maior gasto variável: ${CAT_META[maiorCat[0]]?.label} (${fmt(maiorCat[1])}). De olho nele.`;
    }
    return 'Mês sob controle. Considere subir a reserva.';
  })();

  const ringColor = pctComprometido > 100 ? '#f87171' : pctComprometido > 90 ? '#fbbf24' : '#34d399';

  return (
    <section className="rounded-3xl p-5 md:p-6 space-y-5" style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
      <p className="text-white/40 text-[11px] uppercase tracking-widest font-semibold">Frear ou fazer mais dinheiro?</p>

      {/* Folga + anel comprometido */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-white/40 text-[10px] uppercase tracking-wider">Folga do mês</p>
          <p className="text-3xl md:text-4xl font-bold tabular tracking-tight" style={{ color: folga >= 0 ? '#34d399' : '#f87171' }}>
            {folga >= 0 ? '+' : '−'} {fmt(Math.abs(folga))}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular" style={{ color: ringColor }}>{pctComprometido.toFixed(0)}%</p>
          <p className="text-white/30 text-[10px] uppercase tracking-wider">comprometido</p>
        </div>
      </div>

      <p className="text-sm leading-relaxed" style={{ color: veredito.color }}>{veredito.txt}</p>

      {/* Saved pill */}
      {guardado > 0 && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <span>🐷</span>
          <span className="text-emerald-300 text-xs font-semibold">Você está guardando {fmt(guardado)}/mês</span>
        </div>
      )}

      {/* Fixo × Variável */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-white/40 text-[10px] uppercase tracking-wider">Fixo × Variável (sua alçada)</p>
          <p className="text-white/30 text-[10px]">controlável = o variável</p>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <span style={{ width: `${fixoTotal + variavelTotal > 0 ? (fixoTotal / (fixoTotal + variavelTotal)) * 100 : 0}%`, background: 'rgba(255,255,255,0.25)' }} />
          <span style={{ width: `${fixoTotal + variavelTotal > 0 ? (variavelTotal / (fixoTotal + variavelTotal)) * 100 : 0}%`, background: 'linear-gradient(90deg,#fbbf24,#f59e0b)' }} />
        </div>
        <div className="flex justify-between mt-2 text-[11px]">
          <span className="text-white/50">Fixo <b className="text-white/70 tabular">{fmt(fixoTotal)}</b></span>
          <span style={{ color: '#fbbf24' }}>Variável <b className="tabular">{fmt(variavelTotal)}</b></span>
        </div>
      </div>

      {/* Onde vaza — categorias de variável */}
      {cats.length > 0 && (
        <div>
          <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Onde está vazando (seus + casal)</p>
          <div className="space-y-2">
            {cats.slice(0, 4).map(([cat, val]) => (
              <div key={cat} className="flex items-center gap-2.5">
                <span className="text-sm w-5 text-center flex-shrink-0">{CAT_META[cat]?.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-white/60">{CAT_META[cat]?.label}</span>
                    <span className="text-white/70 tabular font-semibold">{fmt(val)}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(val / maxCatVal) * 100}%`, background: cat === maiorCat?.[0] ? 'linear-gradient(90deg,#ef4444,#f87171)' : 'rgba(255,255,255,0.3)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NudgeCard — a ação do mês */}
      <div className="rounded-2xl p-3.5 flex items-start gap-3" style={{ background: 'radial-gradient(120% 120% at 0% 0%, rgba(99,102,241,0.15), transparent 60%), rgba(0,0,0,0.2)', border: '1px solid rgba(99,102,241,0.25)' }}>
        <span className="text-lg flex-shrink-0">💡</span>
        <p className="text-white/85 text-[13px] leading-relaxed">{nudge}</p>
      </div>
    </section>
  );
}
