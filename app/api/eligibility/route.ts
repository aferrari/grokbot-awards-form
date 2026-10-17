import { NextResponse } from "next/server";
import { databaseErrorResponse } from "@/lib/http-error";
import { assertVoterCanSubmit } from "@/lib/voter-eligibility";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown };
    const result = await assertVoterCanSubmit(body.email);
    if (typeof result === "string") {
      return NextResponse.json({ error: result }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return databaseErrorResponse(e, "Could not check this email");
  }
}
