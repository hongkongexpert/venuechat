import { NextResponse } from "next/server"
import { getAllClaims, isAdmin } from "@/app/actions/claim-actions"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const filter =
    status === "approved" || status === "rejected" || status === "pending"
      ? status
      : undefined
  const claims = await getAllClaims(filter)
  return NextResponse.json({ claims })
}
