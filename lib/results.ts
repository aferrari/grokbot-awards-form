import { ensureSchema, getSql } from "@/lib/db";
import { PROJECTS } from "@/lib/projects";

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

export type JudgeRow = {
  judgeName: string;
  createdAt: string;
  projectId: string;
  projectName: string;
  creativity: number;
  usefulness: number;
  demo: number;
  overall: number;
};

export type ResultsData = {
  aggregates: ProjectAggregate[];
  judges: JudgeRow[];
  submissionCount: number;
};

export async function fetchResults(): Promise<ResultsData> {
  await ensureSchema();
  const sql = getSql();

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

  const aggregates: ProjectAggregate[] = PROJECTS.map((p) => {
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

  const judgeRows = (await sql`
    SELECT
      s.judge_name,
      s.created_at,
      sc.project_id,
      sc.creativity,
      sc.usefulness,
      sc.demo
    FROM submissions s
    JOIN scores sc ON sc.submission_id = s.id
    ORDER BY s.created_at DESC, sc.project_id ASC
  `) as {
    judge_name: string;
    created_at: string;
    project_id: string;
    creativity: number;
    usefulness: number;
    demo: number;
  }[];

  const nameById = Object.fromEntries(PROJECTS.map((p) => [p.id, p.name]));

  const judges: JudgeRow[] = judgeRows.map((r) => {
    const creativity = r.creativity;
    const usefulness = r.usefulness;
    const demo = r.demo;
    return {
      judgeName: r.judge_name,
      createdAt: new Date(r.created_at).toISOString(),
      projectId: r.project_id,
      projectName: nameById[r.project_id] ?? r.project_id,
      creativity,
      usefulness,
      demo,
      overall: (creativity + usefulness + demo) / 3,
    };
  });

  const submissionCountRows = (await sql`SELECT COUNT(*)::int AS c FROM submissions`) as {
    c: number;
  }[];
  const submissionCount = submissionCountRows[0]?.c ?? 0;

  return { aggregates, judges, submissionCount };
}
