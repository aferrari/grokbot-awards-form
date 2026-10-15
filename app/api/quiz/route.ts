import { NextResponse } from "next/server";
import { parseProjectList } from "@/lib/projects";
import { listProjects, replaceQuiz } from "@/lib/quiz-store";
import { listAllowedVoterEmails, parseAllowedEmailList, replaceAllowedVoterEmails } from "@/lib/voters";

export async function GET() {
  try {
    const [projects, allowedEmails] = await Promise.all([listProjects(), listAllowedVoterEmails()]);
    return NextResponse.json({ projects, allowedEmails });
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

    const projects = parseProjectList(body);
    if (typeof projects === "string") {
      return NextResponse.json({ error: projects }, { status: 400 });
    }

    let allowedEmails: string[] | undefined;
    if (body && typeof body === "object" && "allowedEmails" in body) {
      const parsed = parseAllowedEmailList(body);
      if (typeof parsed === "string") {
        return NextResponse.json({ error: parsed }, { status: 400 });
      }
      allowedEmails = parsed;
    }

    const clearedVotes = await replaceQuiz(projects);
    if (allowedEmails !== undefined) {
      await replaceAllowedVoterEmails(allowedEmails);
    }
    return NextResponse.json({
      ok: true,
      clearedVotes,
      projects,
      allowedEmails: allowedEmails ?? (await listAllowedVoterEmails()),
    });
  } catch (e) {
    return errorResponse(e, "Could not create the quiz");
  }
}

function errorResponse(e: unknown, fallback: string) {
  const message = e instanceof Error ? e.message : fallback;
  const status = message.includes("DATABASE_URL") ? 503 : 500;
  return NextResponse.json({ error: message }, { status });
}
