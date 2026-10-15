import { NextResponse } from "next/server";
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
    const message = e instanceof Error ? e.message : "Server error";
    const status = message.includes("DATABASE_URL") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
