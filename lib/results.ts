import { ensureSchema, getSql } from "@/lib/db";
import { listProjects } from "@/lib/quiz-store";

export type ProjectAggregate = {
  projectId: string;
  name: string;
  description: string;
  judgeCount: number;
  creativity: number | null;
  usefulness: number | null;
  demo: number | null;
  overall: number | null;
};

export type ResultsData = {
  aggregates: ProjectAggregate[];
  submissionCount: number;
};

export async function fetchResults(): Promise<ResultsData> {
  await ensureSchema();
  const sql = getSql();
  const projects = await listProjects();

  const aggRows = (await sql`
    SELECT
      project_id,
      COUNT(*)::int AS judge_count,
      AVG(creativity)::float AS creativity,
      AVG(usefulness)::float AS usefulness,
      AVG(demo)::float AS demo,
      AVG((creativity + usefulness + demo) / 3.0)::float AS overall
    FROM scores
    GROUP BY project_id
  `) as {
    project_id: string;
    judge_count: number;
    creativity: number | null;
    usefulness: number | null;
    demo: number | null;
    overall: number | null;
  }[];

  const aggMap = new Map(
    aggRows.map((r) => [
      r.project_id,
      {
        judgeCount: r.judge_count,
        creativity: r.creativity,
        usefulness: r.usefulness,
        demo: r.demo,
        overall: r.overall,
      },
    ]),
  );

  const aggregates: ProjectAggregate[] = projects.map((p) => {
    const a = aggMap.get(p.id);
    return {
      projectId: p.id,
      name: p.name,
      description: p.description,
      judgeCount: a?.judgeCount ?? 0,
      creativity: a?.creativity ?? null,
      usefulness: a?.usefulness ?? null,
      demo: a?.demo ?? null,
      overall: a?.overall ?? null,
    };
  }).sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1));

  const submissionCountRows = (await sql`SELECT COUNT(*)::int AS c FROM submissions`) as {
    c: number;
  }[];
  const submissionCount = submissionCountRows[0]?.c ?? 0;

  return { aggregates, submissionCount };
}
