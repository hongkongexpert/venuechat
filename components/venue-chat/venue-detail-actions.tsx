"use client"

import { useState } from "react"
import { Heart, Scale, ClipboardList, Check } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useApp } from "./app-context"
import { createEnquiry } from "@/app/actions/venue-actions"
import type { SerpVenue } from "@/lib/serpapi"

export function VenueDetailActions({ venue }: { venue: SerpVenue }) {
  const { user, isSaved, toggleSaved, isComparing, toggleCompare } = useApp()
  const saved = isSaved(venue)
  const comparing = isComparing(venue)

  const [showForm, setShowForm] = useState(false)
  const [notes, setNotes] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [guestCount, setGuestCount] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleEnquire = async () => {
    if (!user) {
      window.location.href = "/auth/login"
      return
    }
    if (!showForm) {
      setShowForm(true)
      return
    }
    setSubmitting(true)
    const res = await createEnquiry(venue, {
      notes: notes || undefined,
      event_date: eventDate || undefined,
      guest_count: guestCount ? Number.parseInt(guestCount, 10) : undefined,
    })
    setSubmitting(false)
    if (res.ok) {
      setDone(true)
      setShowForm(false)
      setNotes("")
      setEventDate("")
      setGuestCount("")
      setTimeout(() => setDone(false), 2500)
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => toggleSaved(venue)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
            saved
              ? "bg-[#9e0000] text-white hover:opacity-90"
              : "border border-[#e8bdb6] bg-white text-[#9e0000] hover:bg-[#fdecea]",
          )}
        >
          <Heart size={15} className={saved ? "fill-current" : ""} />
          {saved ? "Saved" : "Save"}
        </button>

        <button
          onClick={() => toggleCompare(venue)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
            comparing
              ? "bg-[#9e0000] text-white hover:opacity-90"
              : "border border-[#e8bdb6] bg-white text-[#9e0000] hover:bg-[#fdecea]",
          )}
        >
          <Scale size={15} />
          {comparing ? "Comparing" : "Compare"}
        </button>

        <button
          onClick={handleEnquire}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#e8bdb6] bg-white px-3.5 py-2 text-sm font-semibold text-[#9e0000] hover:bg-[#fdecea] transition-colors disabled:opacity-60"
        >
          {submitting ? (
            <Spinner className="size-4" />
          ) : done ? (
            <Check size={15} />
          ) : (
            <ClipboardList size={15} />
          )}
          {done ? "Tracked" : "Enquire"}
        </button>
      </div>

      {showForm && (
        <div className="flex flex-col gap-2.5 rounded-xl border border-[#e8bdb6] bg-[#faf6f5] p-3">
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs font-medium text-[#5e3f3a]">
                Event date
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="rounded-lg border border-[#e2dfde] bg-white px-2.5 py-2 text-sm outline-none focus:border-[#9e0000]"
              />
            </div>
            <div className="flex w-24 flex-col gap-1">
              <label className="text-xs font-medium text-[#5e3f3a]">Guests</label>
              <input
                type="number"
                min={1}
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                placeholder="30"
                className="rounded-lg border border-[#e2dfde] bg-white px-2.5 py-2 text-sm outline-none focus:border-[#9e0000]"
              />
            </div>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (e.g. asked about catering, waiting on a quote)…"
            rows={2}
            className="resize-none rounded-lg border border-[#e2dfde] bg-white px-2.5 py-2 text-sm outline-none focus:border-[#9e0000]"
          />
          <button
            onClick={handleEnquire}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#9e0000] px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting && <Spinner className="size-4" />}
            Add to enquiries
          </button>
        </div>
      )}
    </div>
  )
}
