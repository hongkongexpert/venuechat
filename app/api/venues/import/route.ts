import { NextResponse } from "next/server"
import { searchVenues } from "@/lib/serpapi"

export const dynamic = "force-dynamic"

// Search Google Maps for venues to import into a new listing.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const results = await searchVenues(q)
    // Keep the picker tidy — only the top handful of matches.
    return NextResponse.json({ results: results.slice(0, 6) })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search Google Maps"
    console.log("[v0] venue import search error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
