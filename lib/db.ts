import { neon } from "@neondatabase/serverless";

type Sql = ReturnType<typeof neon>;

let sql: Sql | null = null;
let schemaReady: Promise<void> | null = null;

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (!sql) {
    sql = neon(url);
  }
  return sql;
}

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = getSql();
      await db`
        CREATE TABLE IF NOT EXISTS submissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          judge_name TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await db`
        CREATE TABLE IF NOT EXISTS scores (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
          project_id TEXT NOT NULL,
          creativity SMALLINT NOT NULL CHECK (creativity >= 0 AND creativity <= 10),
          usefulness SMALLINT NOT NULL CHECK (usefulness >= 0 AND usefulness <= 10),
          demo SMALLINT NOT NULL CHECK (demo >= 0 AND demo <= 10)
        )
      `;
      await db`
        CREATE INDEX IF NOT EXISTS scores_project_id_idx ON scores (project_id)
      `;
      await db`
        CREATE TABLE IF NOT EXISTS quiz_projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          position INTEGER NOT NULL
        )
      `;
      await db`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS email TEXT`;
      await db`
        CREATE UNIQUE INDEX IF NOT EXISTS submissions_email_lower_unique
        ON submissions (lower(email))
        WHERE email IS NOT NULL
      `;
      await db`
        CREATE TABLE IF NOT EXISTS allowed_voter_emails (
          email TEXT PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    })();
  }
  await schemaReady;
}

export { getSql };
