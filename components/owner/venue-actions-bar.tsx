"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Globe, EyeOff, Trash2 } from "lucide-react"
import { setVenueStatus, deleteVenue } from "@/app/actions/venue-actions"
import { Spinner } from "@/components/ui/spinner"

interface VenueActionsBarProps {
  venueId: string
  status: string | null
  hasActiveSub: boolean
}

export function VenueActionsBar({ venueId, status, hasActiveSub }: VenueActionsBarProps) {
  const router = useRouter()
  const published = status === "published"
  const [busy, setBusy] = useState<null | "toggle" | "delete">(null)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  const toggle = async () => {
    setError(null)
    setBusy("toggle")
    const res = await setVenueStatus(venueId, published ? "draft" : "published")
    setBusy(null)
    if (!res.ok) {
      setError(res.error || "Could not update status.")
      return
    }
    router.refresh()
  }

  const remove = async () => {
    setBusy("delete")
    const res = await deleteVenue(venueId)
    if (!res.ok) {
      setError(res.error || "Could not delete.")
      setBusy(null)
      return
    }
    router.push("/owner")
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={toggle}
          disabled={busy !== null || (!published && !hasActiveSub)}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            published
              ? "border border-[#e2dfde] bg-white text-[#5e3f3a] hover:bg-[#f5f5f5]"
              : "bg-[#3f8f4f] text-white hover:opacity-90"
          }`}
        >
          {busy === "toggle" ? (
            <Spinner className="size-4" />
          ) : published ? (
            <EyeOff size={15} />
          ) : (
            <Globe size={15} />
          )}
          {published ? "Unpublish" : "Publish listing"}
        </button>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-2 rounded-full border border-[#e8bdb6] bg-white px-4 py-2.5 text-sm font-semibold text-[#9e0000] hover:bg-[#fdecea] transition-colors"
          >
            <Trash2 size={15} />
            Delete
          </button>
        ) : (
          <span className="inline-flex items-center gap-2">
            <span className="text-sm text-[#5e3f3a]">Delete this venue?</span>
            <button
              onClick={remove}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#9e0000] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              {busy === "delete" && <Spinner className="size-4" />}
              Yes, delete
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-full border border-[#e2dfde] px-3 py-2 text-sm font-semibold text-[#5e3f3a] hover:bg-[#f5f5f5] transition-colors"
            >
              Cancel
            </button>
          </span>
        )}
      </div>

      {!published && !hasActiveSub && (
        <p className="text-xs text-[#9a9999]">
          Choose a plan below to unlock publishing.
        </p>
      )}
      {error && <p className="text-sm text-[#9e0000]">{error}</p>}
    </div>
  )
}
