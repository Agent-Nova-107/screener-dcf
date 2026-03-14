import { NextResponse } from "next/server";
import { searchTickers } from "@/lib/api/dataService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (q.trim().length < 1) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchTickers(q);
  return NextResponse.json({ results }, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
