import { isValidEmailFormat, normalizeEmail } from "@/lib/email-format";
import { ensureSchema, getSql } from "@/lib/db";

const MAX_VOTERS = 500;

export function parseAllowedEmailList(input: unknown): string[] | string {
  const lines = coerceLines(input);
  if (typeof lines === "string") return lines;

  const seen = new Set<string>();
  const emails: string[] = [];

  for (const raw of lines) {
    if (!isValidEmailFormat(raw)) {
      return `Invalid email: ${raw}`;
    }
    const normalized = normalizeEmail(raw);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    emails.push(normalized);
  }

  if (emails.length > MAX_VOTERS) {
    return `Send at most ${MAX_VOTERS} email addresses`;
  }

  return emails;
}

function coerceLines(input: unknown): string[] | string {
  if (typeof input === "string") return linesFromText(input);
  if (Array.isArray(input)) {
    const lines: string[] = [];
    for (const entry of input) {
      if (typeof entry !== "string") return "Each voter must be an email address";
      lines.push(entry);
    }
    return lines;
  }
  if (!input || typeof input !== "object") return "Send a list of email addresses";

  const allowed = (input as { allowedEmails?: unknown }).allowedEmails;
  if (typeof allowed === "string") return linesFromText(allowed);
  if (Array.isArray(allowed)) return coerceLines(allowed);
  return "Send a list of email addresses";
}

function linesFromText(text: string): string[] {
  const lines: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "");
    if (!line || line.startsWith("#")) continue;
    lines.push(line);
  }
  return lines;
}

export async function listAllowedVoterEmails(): Promise<string[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT email FROM allowed_voter_emails ORDER BY email ASC
  `) as { email: string }[];
  return rows.map((row) => row.email);
}

export async function replaceAllowedVoterEmails(emails: string[]): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql.transaction((txn) => {
    const queries = [txn`DELETE FROM allowed_voter_emails`];
    for (const email of emails) {
      queries.push(txn`INSERT INTO allowed_voter_emails (email) VALUES (${email})`);
    }
    return queries;
  });
}

export async function isAllowedVoterEmail(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT email FROM allowed_voter_emails WHERE email = ${normalized} LIMIT 1
  `) as { email: string }[];
  return rows.length > 0;
}
