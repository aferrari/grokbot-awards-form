import { NextResponse } from "next/server";
import { databaseErrorResponse } from "@/lib/http-error";
import { fetchResults } from "@/lib/results";

export async function GET() {
  try {
    const data = await fetchResults();
    return NextResponse.json(data);
  } catch (e) {
    return databaseErrorResponse(e, "Could not load results");
  }
}
