import { isValidEmailFormat, normalizeEmail } from "@/lib/email-format";

export { normalizeEmail } from "@/lib/email-format";

export function parseEmail(raw: unknown): string | null {
  if (typeof raw !== "string" || !isValidEmailFormat(raw)) {
    return null;
  }
  return normalizeEmail(raw);
}
