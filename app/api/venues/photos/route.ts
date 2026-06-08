import { NextResponse } from "next/server"
import { getVenuePhotos } from "@/lib/serpapi"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dataId = searchParams.get("data_id")?.trim()

  if (!dataId) {
    return NextResponse.json(
      { error: "Missing required query parameter 'data_id'" },
      { status: 400 },
    )
  }

  try {
    const photos = await getVenuePhotos(dataId)
    return NextResponse.json({ photos })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch photos"
    console.log("[v0] venue photos error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
