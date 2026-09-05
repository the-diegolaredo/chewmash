import { normalizeLocation } from '../lib/transactions';
import type { BalanceSnapshot, DiningTransaction } from '../lib/types';

interface PdfTextChunk {
  x: number;
  y: number;
  text: string;
}

export interface ParsedCbordStatement {
  transactions: DiningTransaction[];
  balanceSnapshot: BalanceSnapshot | null;
}

export function parseShortDate(value: string): string | null {
  const match = String(value || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!match) return null;
  const [, monthRaw, dayRaw, yearRaw] = match;
  if (!monthRaw || !dayRaw || !yearRaw) return null;
  const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
  return `${year}-${monthRaw.padStart(2, '0')}-${dayRaw.padStart(2, '0')}`;
}

export function parseLongDate(value: string): string | null {
  const match = String(value || '').match(
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/i,
  );
  if (!match) return null;
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ];
  const month = months.indexOf(match[1]!.toLowerCase()) + 1;
  return `${match[3]}-${String(month).padStart(2, '0')}-${String(match[2]).padStart(2, '0')}`;
}

export function decodePdfLiteral(value: string): string {
  let output = '';
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character !== '\\') {
      output += character;
      continue;
    }

    const next = value[++index];
    if (next === undefined) break;
    const escapes: Record<string, string> = {
      n: '\n', r: '\r', t: '\t', b: '\b', f: '\f',
      '(': '(', ')': ')', '\\': '\\',
    };
    if (next in escapes) {
      output += escapes[next];
      continue;
    }

    if (/[0-7]/.test(next)) {
      let octal = next;
      for (let count = 0; count < 2 && index + 1 < value.length && /[0-7]/.test(value[index + 1]!); count += 1) {
        octal += value[++index];
      }
      output += String.fromCharCode(Number.parseInt(octal, 8));
      continue;
    }

    if (next === '\r' && value[index + 1] === '\n') index += 1;
    else if (next !== '\n' && next !== '\r') output += next;
  }
  return output;
}

export function parseCbordContent(contents: string[], source: string): ParsedCbordStatement {
  const chunks: PdfTextChunk[] = [];
  const textCommand = /BT\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+Td\s+\(((?:\\.|[^\\)])*)\)\s+Tj\s+ET/g;

  for (const content of contents) {
    textCommand.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = textCommand.exec(content))) {
      chunks.push({
        x: Number(match[1]),
        y: Number(match[2]),
        text: decodePdfLiteral(match[3] ?? '').replace(/\s+/g, ' ').trim(),
      });
    }
  }

  const allText = chunks.map(chunk => chunk.text).join('\n');
  const endingBalanceText = allText.match(/Ending Balance:\s*\$([\d,]+\.\d{2})/i)?.[1];
  const printedText = allText.match(/Printed:\s*([^\n]+)/i)?.[1] ?? '';
  const statementPeriod = allText.match(
    /Statement Period:\s*(\d{2}\/\d{2}\/\d{2})\s+to\s+(\d{2}\/\d{2}\/\d{2})/i,
  );

  const rowGroups = new Map<string, PdfTextChunk[]>();
  for (const chunk of chunks) {
    const key = (Math.round(chunk.y * 10) / 10).toFixed(1);
    const group = rowGroups.get(key) ?? [];
    group.push(chunk);
    rowGroups.set(key, group);
  }

  const transactions: DiningTransaction[] = [];
  for (const group of rowGroups.values()) {
    const date = group.find(chunk => /^\d{2}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\s+[AP]M$/i.test(chunk.text));
    const amount = group.find(chunk => /^-?\$\d[\d,]*\.\d{2}$/.test(chunk.text));
    if (!date || !amount) continue;

    const location = group
      .filter(chunk => chunk !== date && chunk !== amount && !/^First Year Plus$/i.test(chunk.text) && chunk.x > 230 && chunk.x < 450)
      .sort((left, right) => left.x - right.x)[0];
    if (!location) continue;

    const dateMatch = date.text.match(/^(\d{2}\/\d{2}\/\d{2})\s+(.+)$/);
    const signedAmount = Number(amount.text.replace(/[^0-9.-]/g, ''));
    if (!dateMatch || !Number.isFinite(signedAmount) || signedAmount >= 0) continue;

    const isoDate = parseShortDate(dateMatch[1] ?? '');
    if (!isoDate) continue;

    transactions.push({
      date: isoDate,
      time: dateMatch[2],
      rawLocation: location.text,
      location: normalizeLocation(location.text),
      amount: Math.abs(signedAmount),
      source,
    });
  }

  const snapshotDate = parseLongDate(printedText)
    ?? parseShortDate(statementPeriod?.[2] ?? '');
  const endingBalance = endingBalanceText
    ? Number(endingBalanceText.replace(/,/g, ''))
    : null;

  if (!transactions.length && endingBalance === null) {
    throw new Error('I could not recognize this as a Cal Poly CBORD GET statement.');
  }

  return {
    transactions,
    balanceSnapshot: endingBalance !== null && snapshotDate
      ? { date: snapshotDate, balance: endingBalance, source }
      : null,
  };
}

export async function inflatePdfStreams(buffer: ArrayBuffer): Promise<string[]> {
  if (!('DecompressionStream' in globalThis)) {
    throw new Error('This browser cannot parse the PDF locally. Use a current Chrome, Edge, Firefox, or Safari browser.');
  }

  const bytes = new Uint8Array(buffer);
  const binary = new TextDecoder('latin1').decode(bytes);
  const output: string[] = [];
  let position = 0;

  while (true) {
    const streamMarker = binary.indexOf('stream', position);
    if (streamMarker < 0) break;
    let start = streamMarker + 6;
    if (binary[start] === '\r' && binary[start + 1] === '\n') start += 2;
    else if (binary[start] === '\n' || binary[start] === '\r') start += 1;

    const end = binary.indexOf('endstream', start);
    if (end < 0) break;

    let chunk = bytes.slice(start, end);
    while (chunk.length && (chunk.at(-1) === 10 || chunk.at(-1) === 13)) {
      chunk = chunk.slice(0, -1);
    }

    try {
      const decompressor = new DecompressionStream('deflate');
      const stream = new Blob([chunk]).stream().pipeThrough(decompressor);
      const inflated = await new Response(stream).arrayBuffer();
      output.push(new TextDecoder('latin1').decode(inflated));
    } catch {
      // Some PDF streams are not Flate-compressed text streams. Ignore those.
    }
    position = end + 9;
  }

  return output;
}

export async function parseCbordPdfFile(file: File): Promise<ParsedCbordStatement> {
  const streams = await inflatePdfStreams(await file.arrayBuffer());
  if (!streams.length) throw new Error('The PDF text stream could not be decompressed.');
  return parseCbordContent(streams, file.name);
}
