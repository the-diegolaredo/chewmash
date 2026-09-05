import { describe, expect, it } from 'vitest';
import { decodePdfLiteral, parseCbordContent } from './cbord';

describe('CBORD PDF parser', () => {
  it('extracts purchases and the official ending balance from statement text', () => {
    const content = [
      'BT 10 700 Td (Statement Period: 08/01/26 to 08/31/26) Tj ET',
      'BT 10 680 Td (Printed: September 4, 2026) Tj ET',
      'BT 10 660 Td (Ending Balance: $3,047.09) Tj ET',
      'BT 100 600 Td (08/29/26 01:10:00 PM) Tj ET',
      'BT 200 600 Td (First Year Plus) Tj ET',
      'BT 300 600 Td (Grubhub Chick-fil-A 1305) Tj ET',
      'BT 500 600 Td (-$11.55) Tj ET',
    ].join('\n');

    const parsed = parseCbordContent([content], 'August.pdf');

    expect(parsed.transactions).toHaveLength(1);
    expect(parsed.transactions[0]).toMatchObject({
      date: '2026-08-29',
      time: '01:10:00 PM',
      location: 'Chick-fil-A',
      amount: 11.55,
      source: 'August.pdf',
    });
    expect(parsed.balanceSnapshot).toEqual({
      date: '2026-09-04',
      balance: 3047.09,
      source: 'August.pdf',
    });
  });

  it('does not invent a zero balance when a statement has no ending balance', () => {
    const content = [
      'BT 100 600 Td (09/04/26 01:13:27 PM) Tj ET',
      'BT 300 600 Td (Subway Aero) Tj ET',
      'BT 500 600 Td (-$13.07) Tj ET',
    ].join('\n');

    const parsed = parseCbordContent([content], 'September.pdf');
    expect(parsed.balanceSnapshot).toBeNull();
    expect(parsed.transactions[0]?.amount).toBe(13.07);
  });

  it('rejects unrelated PDFs rather than guessing', () => {
    expect(() => parseCbordContent(['BT 10 10 Td (hello) Tj ET'], 'notes.pdf'))
      .toThrow(/could not recognize/i);
  });

  it('decodes escaped PDF literal strings', () => {
    expect(decodePdfLiteral('Shake\\040Smart\\050Aero\\051')).toBe('Shake Smart(Aero)');
  });
});
