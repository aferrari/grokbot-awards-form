import { NextResponse } from "next/server";
import { CRITERIA, type ProjectScores } from "@/lib/criteria";
import { databaseErrorResponse } from "@/lib/http-error";
import { ensureSchema, getSql } from "@/lib/db";
import { listProjects } from "@/lib/quiz-store";
import { assertVoterCanSubmit } from "@/lib/voter-eligibility";

function parseScore(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 10) {
    return null;
  }
  return value;
}

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "23505"
  );
}

async function validatePayload(
  body: unknown,
): Promise<{ email: string; rows: Array<{ projectId: string } & ProjectScores> } | string> {
  if (!body || typeof body !== "object") {
    return "Invalid JSON body";
  }
  const { email, scores } = body as { email?: unknown; scores?: unknown };

  const voter = await assertVoterCanSubmit(email);
  if (typeof voter === "string") {
    return voter;
  }

  if (!scores || typeof scores !== "object") {
    return "Missing scores";
  }

  const projects = await listProjects();
  if (projects.length === 0) {
    return "This quiz has no projects yet";
  }

  const submittedIds = Object.keys(scores as object);
  const expectedIds = projects.map((project) => project.id);
  const sameProjects =
    submittedIds.length === expectedIds.length &&
    expectedIds.every((id) => submittedIds.includes(id));
  if (!sameProjects) {
    return "This quiz was replaced. Refresh the page and start again.";
  }

  const rows: Array<{ projectId: string } & ProjectScores> = [];
  for (const project of projects) {
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

  return { email: voter.email, rows };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = await validatePayload(body);
    if (typeof validated === "string") {
      return NextResponse.json({ error: validated }, { status: 400 });
    }

    await ensureSchema();
    const sql = getSql();

    let submissionId: string;
    try {
      const inserted = (await sql`
        INSERT INTO submissions (judge_name, email)
        VALUES (${validated.email}, ${validated.email})
        RETURNING id
      `) as { id: string }[];
      submissionId = inserted[0]?.id ?? "";
      if (!submissionId) {
        throw new Error("Insert failed");
      }
    } catch (e) {
      if (isUniqueViolation(e)) {
        return NextResponse.json({ error: "This email has already voted" }, { status: 409 });
      }
      throw e;
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
    return databaseErrorResponse(e, "Could not save this vote");
  }
}
