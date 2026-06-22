import type { Transaction } from '@i2fin/schema';

/**
 * Classifica gastos do cartão em FIXO (assinaturas/recorrentes) × VARIÁVEL,
 * e agrupa os variáveis por categoria de "vazamento" (restaurante, combustível,
 * mercado, farmácia, outros). Baseado em palavras-chave do merchant (description),
 * porque o category_id não é confiável nos lançamentos importados.
 *
 * Pura e testável — sem dependência de banco.
 */

export type SpendingCategory = 'restaurante' | 'combustivel' | 'mercado' | 'farmacia' | 'outros';

const SUBSCRIPTION_KEYWORDS = [
  'netflix', 'apple.com', 'apple com', 'icloud', 'spotify', 'amazon prime', 'prime video',
  'google workspace', 'google one', 'youtube', 'hbo', 'disney', 'microsoft', 'openai',
  'anthropic', 'claude', 'supabase', 'submagic', 'canva', 'freepik', 'klingai', 'vercel',
  'github', 'cloudflare', 'digitalocean', 'mapfre', 'vivo', 'certisign', 'certificador',
  'registrobr', 'registro.br', 'dropbox', 'notion', 'figma', 'adobe', 'linkedin',
];

const CATEGORY_KEYWORDS: Record<Exclude<SpendingCategory, 'outros'>, string[]> = {
  restaurante: ['ifood', 'ifd', 'boteco', 'pizza', 'burg', 'hamburg', 'padaria', 'restaurante',
    'lanche', 'acai', 'açai', 'sushi', 'china', 'churras', 'toca do', 'delicias', 'camarao',
    'camarão', 'bar ', 'cafe', 'café', 'doceria', 'sorvete', 'amendolandia', 'pina'],
  combustivel: ['petrobras', 'premmia', 'ipiranga', 'shell', 'posto', ' ale ', 'br mania', 'gasolina'],
  mercado: ['atacadao', 'atacadão', 'qualipreco', 'assai', 'assaí', 'carrefour', 'supermercado',
    'mercado', 'hortifruti', 'sacolao', 'sacolão', 'atacarejo'],
  farmacia: ['drogasil', 'drogaria', 'farmacia', 'farmácia', 'pacheco', 'raia', 'pague menos',
    'extrafarma', 'drogal'],
};

function matchAny(haystack: string, needles: string[]): boolean {
  return needles.some(n => haystack.includes(n));
}

function categorizeMerchant(description: string): { fixed: boolean; category: SpendingCategory } {
  const d = description.toLowerCase();
  // IOF e parcelas de financiamento/serviço tratamos como fixo (não controlável no mês)
  if (matchAny(d, SUBSCRIPTION_KEYWORDS)) return { fixed: true, category: 'outros' };
  if (d.includes('parcela') || d.startsWith('iof')) return { fixed: true, category: 'outros' };
  for (const cat of Object.keys(CATEGORY_KEYWORDS) as Array<keyof typeof CATEGORY_KEYWORDS>) {
    if (matchAny(d, CATEGORY_KEYWORDS[cat])) return { fixed: false, category: cat };
  }
  return { fixed: false, category: 'outros' };
}

export interface SpendingBreakdown {
  fixoCartao: number;       // assinaturas/parcelas no cartão
  variavelCartao: number;   // compras avulsas
  categorias: Record<SpendingCategory, number>;
}

/**
 * Recebe transações do cartão (amount negativo = despesa) e devolve o split
 * fixo×variável + totais por categoria de variável. Considera só despesas (amount < 0).
 * Se `onlyResponsibles` informado, filtra por responsável (ex: ['iremar','casal']).
 */
export function splitFixedVariable(
  transactions: Transaction[],
  onlyResponsibles?: string[],
): SpendingBreakdown {
  const categorias: Record<SpendingCategory, number> = {
    restaurante: 0, combustivel: 0, mercado: 0, farmacia: 0, outros: 0,
  };
  let fixoCartao = 0;
  let variavelCartao = 0;

  for (const t of transactions) {
    if (t.amount >= 0) continue; // ignora estornos/pagamentos
    if (onlyResponsibles && !onlyResponsibles.includes(t.responsible)) continue;
    const val = Math.abs(t.amount);
    const { fixed, category } = categorizeMerchant(t.description);
    if (fixed) {
      fixoCartao += val;
    } else {
      variavelCartao += val;
      categorias[category] += val;
    }
  }

  return {
    fixoCartao: Math.round(fixoCartao * 100) / 100,
    variavelCartao: Math.round(variavelCartao * 100) / 100,
    categorias,
  };
}
