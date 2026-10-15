import { isValidEmailFormat, normalizeEmail } from "@/lib/email-format";

/** Paste invited voter addresses here (one per entry). Matching is case-insensitive. */
const ALLOWED_VOTER_EMAILS: readonly string[] = [];

export { normalizeEmail } from "@/lib/email-format";

export function isAllowedEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return ALLOWED_VOTER_EMAILS.some((entry) => normalizeEmail(entry) === normalized);
}

export function parseEmail(raw: unknown): string | null {
  if (typeof raw !== "string" || !isValidEmailFormat(raw)) {
    return null;
  }
  return normalizeEmail(raw);
}
