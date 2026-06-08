"use client"

import { useEffect, useState } from "react"
import { Spinner } from "@/components/ui/spinner"
import { useApp } from "../app-context"
import { AuthGate, EmptyState, VenueListItem } from "../panel-shared"
import { getSavedVenues, removeSavedVenue } from "@/app/actions/venue-actions"
import type { SerpVenue } from "@/lib/serpapi"

interface SavedRow {
  id: string
  venue: SerpVenue
}

export function SavedPanel({
  onSelectVenue,
}: {
  onSelectVenue: (v: SerpVenue) => void
}) {
  const { user, loadingUser, dataVersion, bumpData } = useApp()
  const [rows, setRows] = useState<SavedRow[] | null>(null)

  useEffect(() => {
    if (!user) {
      setRows([])
      return
    }
    setRows(null)
    getSavedVenues().then((data) => setRows(data as SavedRow[]))
  }, [user, dataVersion])

  if (loadingUser) return <PanelSpinner />
  if (!user)
    return (
      <AuthGate message="Sign in to bookmark venues and keep your shortlist in one place." />
    )
  if (rows === null) return <PanelSpinner />
  if (rows.length === 0)
    return (
      <EmptyState message="No saved venues yet. Tap the heart on any venue to add it to your shortlist." />
    )

  const handleRemove = async (id: string) => {
    setRows((prev) => prev?.filter((r) => r.id !== id) ?? null)
    await removeSavedVenue(id)
    bumpData()
  }

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <VenueListItem
          key={row.id}
          venue={row.venue}
          onClick={() => onSelectVenue(row.venue)}
          onRemove={() => handleRemove(row.id)}
        />
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
