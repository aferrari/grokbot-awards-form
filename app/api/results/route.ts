import { NextResponse } from "next/server";
import { fetchResults } from "@/lib/results";

export async function GET() {
  try {
    const data = await fetchResults();
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load results";
    const status = message.includes("DATABASE_URL") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
