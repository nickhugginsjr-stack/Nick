const E164_PATTERN = /^\+[1-9]\d{1,14}$/;

/**
 * Normalizes a loosely-formatted phone number to E.164, assuming US/Canada
 * (+1) when no country code is present. Returns null if it can't be
 * confidently normalized.
 */
export function normalizePhoneUS(raw: string): string | null {
  const trimmed = raw.trim();
  if (E164_PATTERN.test(trimmed)) return trimmed;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}
