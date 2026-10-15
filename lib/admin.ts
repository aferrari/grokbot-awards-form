import { timingSafeEqual } from "node:crypto";

export function adminAuthError(token: string): string | null {
  const expected = process.env.QUIZ_ADMIN_TOKEN;
  if (!expected) {
    return "QUIZ_ADMIN_TOKEN is not configured";
  }
  if (!token || !safeEqual(token, expected)) {
    return "Admin token is invalid";
  }
  return null;
}

export function tokenFromRequest(request: Request, body: unknown): string {
  const header = request.headers.get("authorization") ?? "";
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  const headerToken = request.headers.get("x-quiz-token");
  if (headerToken) return headerToken.trim();
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const token = (body as { token?: unknown }).token;
    if (typeof token === "string") return token.trim();
  }
  return "";
}

function safeEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}
