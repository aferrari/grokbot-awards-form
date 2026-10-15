import { parseEmail } from "@/lib/allowed-emails";
import { ensureSchema, getSql } from "@/lib/db";
import { isAllowedVoterEmail } from "@/lib/voters";

export async function assertVoterCanSubmit(rawEmail: unknown): Promise<{ email: string } | string> {
  const email = parseEmail(rawEmail);
  if (!email) {
    return "Please enter a valid email address";
  }
  if (!(await isAllowedVoterEmail(email))) {
    return "This email is not on the invitation list";
  }

  await ensureSchema();
  const sql = getSql();
  const existing = (await sql`
    SELECT id FROM submissions WHERE lower(email) = ${email} LIMIT 1
  `) as { id: string }[];

  if (existing.length > 0) {
    return "This email has already voted";
  }

  return { email };
}
