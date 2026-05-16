import { describe, expect, it } from 'vitest';
import { normalize } from '../normalize.js';

describe('normalize', () => {
  it('lowercases and trims', () => {
    expect(normalize('Google One')).toBe('google one');
    expect(normalize('  NETFLIX  ')).toBe('netflix');
  });

  it('removes * and quotes', () => {
    expect(normalize('Fc* Freepik Premium+ M')).toBe('fc freepik premium+ m');
    // "IOF de Klingai" → still an IOF rename, maps to iof:intl:pos
    expect(normalize('"IOF de Klingai"')).toBe('iof:intl:pos');
  });

  // Pattern 1: IOF rename normalization
  it('[Pattern 1] normalizes "IOF de compra internacional" → iof:intl:pos', () => {
    expect(normalize('IOF de compra internacional')).toBe('iof:intl:pos');
  });

  it('[Pattern 1] normalizes "IOF de volta de Klingai.Com" → iof:intl:neg', () => {
    expect(normalize('IOF de volta de Klingai.Com')).toBe('iof:intl:neg');
  });

  it('[Pattern 1] normalizes renamed IOF "IOF de Klingai.Com" → iof:intl:pos', () => {
    expect(normalize('IOF de "Klingai.Com"')).toBe('iof:intl:pos');
  });

  it('[Pattern 1] normalizes renamed IOF with Freepik → iof:intl:pos', () => {
    expect(normalize('IOF de "Fc* Freepik Premium+ M"')).toBe('iof:intl:pos');
  });

  it('normalizes Premmia variants', () => {
    expect(normalize('Premmia*Br')).toBe('premmia');
    expect(normalize('Petrobras Premmia')).toBe('premmia');
  });
});
