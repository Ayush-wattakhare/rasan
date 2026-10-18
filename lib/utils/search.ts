/**
 * Makes user search text safe to embed in a PostgREST `.or()` / `ilike` filter.
 * Commas, brackets, dots-as-operators, wildcards and backslashes break the
 * filter grammar (a search like "dal, rice" returned nothing before).
 */
export function sanitizeSearch(input: unknown, maxLength = 64): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[,()*%\\:"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/** Parses a ?page= value into an integer >= 1. */
export function parsePageParam(value: unknown): number {
  const n = typeof value === 'string' ? Number.parseInt(value, 10) : NaN;
  return Number.isFinite(n) && n >= 1 ? n : 1;
}
