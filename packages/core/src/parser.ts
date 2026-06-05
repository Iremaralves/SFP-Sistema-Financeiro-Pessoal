import type { NubankCsvRow } from '@i2fin/schema';
import { NubankCsvRow as NubankCsvRowSchema } from '@i2fin/schema';
import { createHash } from 'node:crypto';

export interface ParseResult {
  rows: NubankCsvRow[];
  sha256: string;
  errors: Array<{ line: number; error: string }>;
}

/**
 * Parse a Nubank CSV string into validated rows.
 * Calculates SHA-256 of the raw content for import deduplication.
 */
export function parseNubankCsv(content: string): ParseResult {
  const sha256 = createHash('sha256').update(content).digest('hex');
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], sha256, errors: [{ line: 0, error: 'Empty file' }] };
  }

  const header = lines[0]?.toLowerCase();
  if (!header?.includes('date') || !header.includes('title') || !header.includes('amount')) {
    return {
      rows: [],
      sha256,
      errors: [{ line: 1, error: `Invalid header: "${lines[0]}". Expected: date,title,amount` }],
    };
  }

  const rows: NubankCsvRow[] = [];
  const errors: Array<{ line: number; error: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Handle quoted fields (e.g., "IOF de ""Klingai.Com""")
    const parsed = parseCsvLine(line);
    if (parsed.length < 3) {
      errors.push({ line: i + 1, error: `Too few columns: "${line}"` });
      continue;
    }

    const [date, title, amountStr] = parsed;
    const result = NubankCsvRowSchema.safeParse({
      date: date?.trim(),
      title: title?.trim(),
      amount: normalizeAmount(amountStr ?? ''),
    });

    if (!result.success) {
      errors.push({ line: i + 1, error: result.error.issues.map((e) => e.message).join('; ') });
    } else {
      rows.push(result.data);
    }
  }

  return { rows, sha256, errors };
}

/**
 * Normaliza valor monetário aceitando:
 *  - Formato US: "47.19", "-9913.67"  (padrão Nubank histórico)
 *  - Formato BR: "47,19", "- 9.913,67" (Nubank começou a usar 06/2026)
 *  - Espaço entre sinal e número: "- 19,91"
 */
function normalizeAmount(raw: string): string {
  let s = raw.trim().replace(/^-\s+/, '-');  // "- 19,91" → "-19,91"
  if (s.includes(',')) {
    // BR: ponto é separador de milhar, vírgula é decimal
    s = s.replace(/\./g, '').replace(',', '.');
  }
  return s;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
