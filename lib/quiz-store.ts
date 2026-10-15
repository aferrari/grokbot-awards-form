import { ensureSchema, getSql } from "@/lib/db";
import type { Project } from "@/lib/projects";

export async function listProjects(): Promise<Project[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT id, name, description
    FROM quiz_projects
    ORDER BY position ASC
  `) as { id: string; name: string; description: string }[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? "",
  }));
}

export async function replaceQuiz(projects: Project[]): Promise<number> {
  await ensureSchema();
  const sql = getSql();
  const results = await sql.transaction((txn) => {
    const queries = [
      txn`DELETE FROM scores`,
      txn`DELETE FROM submissions RETURNING id`,
      txn`DELETE FROM quiz_projects`,
    ];
    for (const [position, project] of projects.entries()) {
      queries.push(
        txn`
          INSERT INTO quiz_projects (id, name, description, position)
          VALUES (${project.id}, ${project.name}, ${project.description}, ${position})
        `,
      );
    }
    return queries;
  });

  const deleted = results[1];
  return Array.isArray(deleted) ? deleted.length : 0;
}
