import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const BEARER = "Bearer ";

export function isAdminRequest(request: Request): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return false;

  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith(BEARER)) return false;

  const token = header.slice(BEARER.length);
  if (!token) return false;

  const left = createHash("sha256").update(token).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function adminDeniedResponse(): NextResponse {
  if (!process.env.ADMIN_SECRET) {
    return NextResponse.json(
      {
        error:
          "ADMIN_SECRET is not set. Add it to the server environment and restart, then enter that same value here.",
      },
      { status: 503 },
    );
  }
  return NextResponse.json(
    { error: "That admin secret does not match ADMIN_SECRET." },
    { status: 401 },
  );
}
