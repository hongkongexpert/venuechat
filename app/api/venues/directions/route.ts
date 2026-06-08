import { type NextRequest, NextResponse } from "next/server"
import { getDirections } from "@/lib/serpapi"

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const startAddr = sp.get("start_addr") ?? undefined
  const startCoords = sp.get("start_coords") ?? undefined
  const endAddr = sp.get("end_addr") ?? undefined
  const endCoords = sp.get("end_coords") ?? undefined
  const endDataId = sp.get("end_data_id") ?? undefined
  const travelMode = sp.get("travel_mode") ?? undefined

  if (!startAddr && !startCoords) {
    return NextResponse.json(
      { error: "A starting location is required" },
      { status: 400 },
    )
  }

  if (!endAddr && !endCoords && !endDataId) {
    return NextResponse.json(
      { error: "A destination is required" },
      { status: 400 },
    )
  }

  try {
    const result = await getDirections({
      startAddr,
      startCoords,
      endAddr,
      endCoords,
      endDataId,
      travelMode,
    })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch directions"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
