import { NextResponse } from "next/server";
import { fetchCompanyAsset } from "@/lib/api/dataService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  try {
    const { data, source } = await fetchCompanyAsset(ticker);
    return NextResponse.json({ data, source }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 404 }
    );
  }
}
