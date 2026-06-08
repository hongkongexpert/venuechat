"use client"

import { useEffect, useState } from "react"
import { Spinner } from "@/components/ui/spinner"
import { Calendar, Users } from "lucide-react"
import { useApp } from "../app-context"
import { AuthGate, EmptyState, VenueListItem } from "../panel-shared"
import {
  getEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
} from "@/app/actions/venue-actions"
import type { SerpVenue } from "@/lib/serpapi"

interface EnquiryRow {
  id: string
  venue: SerpVenue
  status: string
  notes: string | null
  event_date: string | null
  guest_count: number | null
}

const STATUSES = ["contacted", "quoted", "booked", "passed"]

const STATUS_STYLES: Record<string, string> = {
  contacted: "bg-[#eef2f7] text-[#3a5573]",
  quoted: "bg-[#fdf3e3] text-[#a06b1f]",
  booked: "bg-[#e7f4ec] text-[#1f7a44]",
  passed: "bg-[#f0eeed] text-[#6b6b6b]",
}

export function EnquiriesPanel({
  onSelectVenue,
}: {
  onSelectVenue: (v: SerpVenue) => void
}) {
  const { user, loadingUser, dataVersion, bumpData } = useApp()
  const [rows, setRows] = useState<EnquiryRow[] | null>(null)

  useEffect(() => {
    if (!user) {
      setRows([])
      return
    }
    setRows(null)
    getEnquiries().then((data) => setRows(data as EnquiryRow[]))
  }, [user, dataVersion])

  if (loadingUser) return <PanelSpinner />
  if (!user)
    return (
      <AuthGate message="Sign in to track the venues you've contacted and manage your bookings." />
    )
  if (rows === null) return <PanelSpinner />
  if (rows.length === 0)
    return (
      <EmptyState message="No enquiries yet. Open a venue and tap 'Enquire' to start tracking it here." />
    )

  const cycleStatus = async (row: EnquiryRow) => {
    const idx = STATUSES.indexOf(row.status)
    const next = STATUSES[(idx + 1) % STATUSES.length]
    setRows(
      (prev) =>
        prev?.map((r) => (r.id === row.id ? { ...r, status: next } : r)) ?? null,
    )
    await updateEnquiryStatus(row.id, next)
  }

  const handleRemove = async (id: string) => {
    setRows((prev) => prev?.filter((r) => r.id !== id) ?? null)
    await deleteEnquiry(id)
    bumpData()
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.id} className="flex flex-col gap-2">
          <VenueListItem
            venue={row.venue}
            onClick={() => onSelectVenue(row.venue)}
            onRemove={() => handleRemove(row.id)}
          />
          <div className="flex flex-wrap items-center gap-2 pl-1">
            <button
              onClick={() => cycleStatus(row)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize transition-opacity hover:opacity-80 ${
                STATUS_STYLES[row.status] ?? STATUS_STYLES.contacted
              }`}
              title="Tap to change status"
            >
              {row.status}
            </button>
            {row.event_date && (
              <span className="flex items-center gap-1 text-xs text-[#5f5e5e]">
                <Calendar size={12} />
                {row.event_date}
              </span>
            )}
            {row.guest_count != null && (
              <span className="flex items-center gap-1 text-xs text-[#5f5e5e]">
                <Users size={12} />
                {row.guest_count}
              </span>
            )}
          </div>
          {row.notes && (
            <p className="pl-1 text-xs text-[#5f5e5e] leading-relaxed">
              {row.notes}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

function PanelSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner className="size-5" />
    </div>
  )
}
