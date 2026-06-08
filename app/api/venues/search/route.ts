import { NextResponse } from "next/server"
import { searchVenues } from "@/lib/serpapi"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")

  if (!q) {
    return NextResponse.json(
      { error: "Missing required query parameter 'q'" },
      { status: 400 },
    )
  }

  const coords =
    lat && lng
      ? { lat: Number.parseFloat(lat), lng: Number.parseFloat(lng) }
      : undefined

  try {
    const venues = await searchVenues(q, {
      coords:
        coords && !Number.isNaN(coords.lat) && !Number.isNaN(coords.lng)
          ? coords
          : undefined,
    })
    return NextResponse.json({ venues, query: q })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search venues"
    console.log("[v0] venue search error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
