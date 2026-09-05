import { describe, expect, it } from 'vitest';
import { moneyNumber, parseGetBalanceText, parseGetRowCells, toIsoDate } from './parser';

describe('GET parser', () => {
  it('parses GET charges with a space between minus and dollar sign', () => {
    const transaction = parseGetRowCells([
      'First Year Plus',
      '09/04/2026 01:13:27 PM',
      'Subway Aero',
      '- $13.07',
    ]);

    expect(transaction).toEqual({
      date: '2026-09-04',
      time: '01:13:27 PM',
      rawLocation: 'Subway Aero',
      location: 'Subway Aero',
      amount: 13.07,
      source: 'GET sync',
    });
  });

  it('normalizes Grubhub merchant prefixes and numeric suffixes', () => {
    const transaction = parseGetRowCells([
      'First Year Plus',
      '09/04/26 11:15:00 AM',
      'Grubhub Jamba Juice 1305',
      '− $9.49',
    ]);

    expect(transaction?.location).toBe('Jamba Juice');
    expect(transaction?.amount).toBe(9.49);
  });

  it('ignores positive loads and header rows', () => {
    expect(parseGetRowCells([
      'ACCOUNT NAME:',
      'DATE & TIME',
      'ACTIVITY DETAILS',
      'AMOUNT (CURRENCY)',
    ])).toBeNull();

    expect(parseGetRowCells([
      'First Year Plus',
      '09/01/2026 09:00 AM',
      'Dining Dollars Deposit',
      '$100.00',
    ])).toBeNull();
  });

  it('keeps missing balances as null instead of zero', () => {
    expect(parseGetBalanceText('Transaction History')).toBeNull();
    expect(parseGetBalanceText('Current Balance: $2,927.31')).toBe(2927.31);
  });

  it('parses dates and signed money safely', () => {
    expect(toIsoDate('8/19/26')).toBe('2026-08-19');
    expect(moneyNumber('- $13.07')).toBe(-13.07);
    expect(moneyNumber('− $9.49')).toBe(-9.49);
  });
});
