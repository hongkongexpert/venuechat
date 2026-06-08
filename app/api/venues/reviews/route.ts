import { type NextRequest, NextResponse } from "next/server"
import { getVenueReviews } from "@/lib/serpapi"

export async function GET(req: NextRequest) {
  const dataId = req.nextUrl.searchParams.get("data_id")
  const sortBy = req.nextUrl.searchParams.get("sort_by") ?? "newestFirst"

  if (!dataId) {
    return NextResponse.json({ error: "Missing data_id parameter" }, { status: 400 })
  }

  try {
    const result = await getVenueReviews(dataId, sortBy)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch reviews"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
