import { NextResponse } from "next/server";
import { adminDeniedResponse, isAdminRequest } from "@/lib/admin-auth";
import { databaseErrorResponse } from "@/lib/http-error";
import { parseAllowedEmailList, replaceAllowedVoterEmails } from "@/lib/voters";

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

    const emails = parseAllowedEmailList(body);
    if (typeof emails === "string") {
      return NextResponse.json({ error: emails }, { status: 400 });
    }

    await replaceAllowedVoterEmails(emails);
    return NextResponse.json(
      { ok: true, count: emails.length, allowedEmails: emails },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e, "Could not save the voter list");
  }
}

function errorResponse(e: unknown, fallback: string) {
  return databaseErrorResponse(e, fallback);
}
