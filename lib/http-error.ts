import { NextResponse } from "next/server";

export function databaseErrorResponse(e: unknown, fallback: string) {
  const message = e instanceof Error ? e.message : fallback;
  if (message.includes("DATABASE_URL")) {
    return NextResponse.json(
      {
        error:
          "The database is not configured. Set DATABASE_URL to your Neon Postgres connection string and restart the server.",
      },
      { status: 503 },
    );
  }
  return NextResponse.json({ error: fallback }, { status: 500 });
}
