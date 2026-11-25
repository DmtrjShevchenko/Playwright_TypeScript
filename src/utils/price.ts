/** Extracts a number from strings like "$29.99" or "Item total: $39.98". */
export function parsePrice(text: string): number {
  const match = text.match(/\$(\d+(?:\.\d+)?)/);
  if (!match) throw new Error(`Cannot parse price from "${text}"`);
  return Number(match[1]);
}

/** Rounds to cents to avoid floating point noise when comparing money. */
export function toCents(value: number): number {
  return Math.round(value * 100);
}
