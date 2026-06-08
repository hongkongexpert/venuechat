import { type NextRequest, NextResponse } from "next/server"
import { getVenuePosts } from "@/lib/serpapi"

export async function GET(req: NextRequest) {
  const dataId = req.nextUrl.searchParams.get("data_id")

  if (!dataId) {
    return NextResponse.json({ error: "Missing data_id parameter" }, { status: 400 })
  }

  try {
    const posts = await getVenuePosts(dataId)
    return NextResponse.json({ posts })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch posts"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
