import { NextResponse } from "next/server";
import { adminAuthError, tokenFromRequest } from "@/lib/admin";
import { parseProjectList } from "@/lib/projects";
import { listProjects, replaceQuiz } from "@/lib/quiz-store";

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (e) {
    return errorResponse(e, "Could not load the quiz");
  }
}

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    let body: unknown = raw;
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        body = JSON.parse(trimmed) as unknown;
      } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }
    }

    const authError = adminAuthError(tokenFromRequest(request, body));
    if (authError) {
      const status = authError.includes("not configured") ? 503 : 401;
      return NextResponse.json({ error: authError }, { status });
    }

    const projects = parseProjectList(body);
    if (typeof projects === "string") {
      return NextResponse.json({ error: projects }, { status: 400 });
    }

    const clearedVotes = await replaceQuiz(projects);
    return NextResponse.json({ ok: true, clearedVotes, projects });
  } catch (e) {
    return errorResponse(e, "Could not create the quiz");
  }
}

function errorResponse(e: unknown, fallback: string) {
  const message = e instanceof Error ? e.message : fallback;
  const status = message.includes("DATABASE_URL") ? 503 : 500;
  return NextResponse.json({ error: message }, { status });
}
