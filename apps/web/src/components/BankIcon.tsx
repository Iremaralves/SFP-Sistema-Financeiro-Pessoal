/**
 * Ícones inline dos bancos. SVG simples baseado na identidade visual de cada um.
 * Quando brand é nulo/desconhecido, cai num genérico baseado no kind.
 */

interface Props {
  brand?: string | null;
  kind?: 'checking' | 'credit_card' | 'company' | 'investment' | null;
  size?: number;
  className?: string;
}

export function BankIcon({ brand, kind, size = 28, className }: Props) {
  const s = size;

  // Mapa de brands conhecidos
  if (brand === 'nubank') {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32" className={className}>
        <rect width="32" height="32" rx="8" fill="#820AD1" />
        <path
          d="M9 9.5h3.5l3 4.5 3-4.5H22v13h-3.2v-7.7l-2.9 4.3h-.4l-2.9-4.3v7.7H9v-13z"
          fill="#fff"
        />
      </svg>
    );
  }

  if (brand === 'nuinvest') {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32" className={className}>
        <rect width="32" height="32" rx="8" fill="#1a1a1a" />
        <path d="M9 9.5h3.5l3 4.5 3-4.5H22v13h-3.2v-7.7l-2.9 4.3h-.4l-2.9-4.3v7.7H9v-13z" fill="#820AD1" />
        <circle cx="24" cy="24" r="4" fill="#00D4A0" />
      </svg>
    );
  }

  if (brand === 'inter') {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32" className={className}>
        <rect width="32" height="32" rx="8" fill="#FF7A00" />
        <text
          x="16" y="22"
          textAnchor="middle"
          fontSize="16"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#fff"
        >i</text>
      </svg>
    );
  }

  if (brand === 'itau') {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32" className={className}>
        <rect width="32" height="32" rx="8" fill="#EC7000" />
        <circle cx="16" cy="13" r="2.2" fill="#003399" />
        <path d="M11 17h10v3a5 5 0 0 1-10 0v-3z" fill="#003399" />
      </svg>
    );
  }

  if (brand === 'caixa') {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32" className={className}>
        <rect width="32" height="32" rx="8" fill="#0070AF" />
        <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="800" fill="#F39200">CEF</text>
      </svg>
    );
  }

  if (brand === 'bb') {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32" className={className}>
        <rect width="32" height="32" rx="8" fill="#FFEF00" />
        <text x="16" y="22" textAnchor="middle" fontSize="16" fontWeight="800" fill="#003399">BB</text>
      </svg>
    );
  }

  if (brand === 'bradesco') {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32" className={className}>
        <rect width="32" height="32" rx="8" fill="#CC092F" />
        <text x="16" y="22" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">BRA</text>
      </svg>
    );
  }

  if (brand === 'santander') {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32" className={className}>
        <rect width="32" height="32" rx="8" fill="#EC0000" />
        <path d="M10 16c0-3 3-5 6-5s6 2 6 5-3 5-6 5-6-2-6-5z" fill="#fff" />
        <circle cx="16" cy="16" r="2" fill="#EC0000" />
      </svg>
    );
  }

  // Fallback por kind
  const fallback: Record<string, { bg: string; emoji: string }> = {
    checking:    { bg: '#3b82f6', emoji: '🏦' },
    company:     { bg: '#f59e0b', emoji: '💼' },
    credit_card: { bg: '#ec4899', emoji: '💳' },
    investment:  { bg: '#10b981', emoji: '📈' },
  };
  const meta = fallback[kind ?? 'checking'] ?? fallback.checking;
  return (
    <div
      className={className}
      style={{
        width: s,
        height: s,
        borderRadius: 8,
        background: meta.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: s * 0.55,
      }}
    >
      {meta.emoji}
    </div>
  );
}
