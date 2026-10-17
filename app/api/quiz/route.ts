import { NextResponse } from "next/server";
import { adminDeniedResponse, isAdminRequest } from "@/lib/admin-auth";
import { databaseErrorResponse } from "@/lib/http-error";
import { parseProjectList } from "@/lib/projects";
import { listProjects, replaceQuiz } from "@/lib/quiz-store";
import { listAllowedVoterEmails, parseAllowedEmailList, replaceAllowedVoterEmails } from "@/lib/voters";

export async function GET(request: Request) {
  const authorized = isAdminRequest(request);
  const sentAuth = Boolean(request.headers.get("authorization"));
  if (sentAuth && !authorized) {
    return adminDeniedResponse();
  }

  try {
    const projects = await listProjects();
    if (!authorized) {
      return NextResponse.json({ projects }, { headers: { "Cache-Control": "no-store" } });
    }
    const allowedEmails = await listAllowedVoterEmails();
    return NextResponse.json(
      { projects, allowedEmails },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e, "Could not load the quiz");
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return adminDeniedResponse();
  }

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
    return NextResponse.json(
      {
        ok: true,
        clearedVotes,
        projects,
        allowedEmails: allowedEmails ?? (await listAllowedVoterEmails()),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e, "Could not create the quiz");
  }
}

function errorResponse(e: unknown, fallback: string) {
  return databaseErrorResponse(e, fallback);
}
