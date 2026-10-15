import { NextResponse } from "next/server";
import { CRITERIA, type ProjectScores } from "@/lib/criteria";
import { ensureSchema, getSql } from "@/lib/db";
import { PROJECTS, PROJECT_IDS } from "@/lib/projects";

function parseScore(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 10) {
    return null;
  }
  return value;
}

function validatePayload(body: unknown): { judgeName: string; rows: Array<{ projectId: string } & ProjectScores> } | string {
  if (!body || typeof body !== "object") {
    return "Invalid JSON body";
  }
  const { judgeName, scores } = body as { judgeName?: unknown; scores?: unknown };
  if (typeof judgeName !== "string" || judgeName.trim().length < 2 || judgeName.trim().length > 120) {
    return "Please enter a valid name (2–120 characters)";
  }
  if (!scores || typeof scores !== "object") {
    return "Missing scores";
  }

  const rows: Array<{ projectId: string } & ProjectScores> = [];
  for (const project of PROJECTS) {
    const entry = (scores as Record<string, unknown>)[project.id];
    if (!entry || typeof entry !== "object") {
      return `Missing scores for ${project.name}`;
    }
    const parsed: ProjectScores = { creativity: null, usefulness: null, demo: null };
    for (const c of CRITERIA) {
      const v = parseScore((entry as Record<string, unknown>)[c.key]);
      if (v === null) {
        return `Invalid ${c.label} score for ${project.name}`;
      }
      parsed[c.key] = v;
    }
    rows.push({ projectId: project.id, ...parsed });
  }

  const extra = Object.keys(scores as object).filter((id) => !PROJECT_IDS.has(id));
  if (extra.length > 0) {
    return "Unknown project in submission";
  }

  return { judgeName: judgeName.trim(), rows };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = validatePayload(body);
    if (typeof validated === "string") {
      return NextResponse.json({ error: validated }, { status: 400 });
    }

    await ensureSchema();
    const sql = getSql();

    const inserted = (await sql`
      INSERT INTO submissions (judge_name)
      VALUES (${validated.judgeName})
      RETURNING id
    `) as { id: string }[];
    const submissionId = inserted[0]?.id;
    if (!submissionId) {
      throw new Error("Insert failed");
    }

    for (const row of validated.rows) {
      await sql`
        INSERT INTO scores (submission_id, project_id, creativity, usefulness, demo)
        VALUES (
          ${submissionId},
          ${row.projectId},
          ${row.creativity as number},
          ${row.usefulness as number},
          ${row.demo as number}
        )
      `;
    }

    return NextResponse.json({ ok: true, id: submissionId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    const status = message.includes("DATABASE_URL") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
