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
    <div className="flex flex-col gap-3">
      {/* Primary row: Enquire (full-width) + icon buttons */}
      <div className="flex items-center gap-2">
        {/* Enquire — primary CTA */}
        <button
          onClick={handleEnquire}
          disabled={submitting}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors disabled:opacity-60",
            done
              ? "bg-[#eaf6ec] text-[#3f8f4f]"
              : "bg-[#9e0000] text-white hover:bg-[#7e0000]",
          )}
        >
          {submitting ? (
            <Spinner className="size-4" />
          ) : done ? (
            <Check size={16} />
          ) : (
            <ClipboardList size={16} />
          )}
          {done ? "Enquiry tracked" : "Enquire"}
        </button>

        {/* Save */}
        <button
          onClick={() => toggleSaved(venue)}
          aria-label={saved ? "Remove from saved" : "Save venue"}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl border transition-colors",
            saved
              ? "border-[#9e0000] bg-[#9e0000] text-white hover:bg-[#7e0000]"
              : "border-[#e8bdb6] bg-white text-[#9e0000] hover:bg-[#fdecea]",
          )}
        >
          <Heart size={17} className={saved ? "fill-current" : ""} />
        </button>

        {/* Compare */}
        <button
          onClick={() => toggleCompare(venue)}
          aria-label={comparing ? "Remove from compare" : "Add to compare"}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl border transition-colors",
            comparing
              ? "border-[#9e0000] bg-[#9e0000] text-white hover:bg-[#7e0000]"
              : "border-[#e8bdb6] bg-white text-[#9e0000] hover:bg-[#fdecea]",
          )}
        >
          <Scale size={17} />
        </button>
      </div>

      {/* Enquiry form */}
      {showForm && (
        <div className="flex flex-col gap-2.5 rounded-xl border border-[#e8bdb6] bg-[#faf6f5] p-4">
          <div className="flex gap-2.5">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#5e3f3a]">Event date</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="rounded-lg border border-[#e2dfde] bg-white px-3 py-2 text-sm outline-none focus:border-[#9e0000] transition-colors"
              />
            </div>
            <div className="flex w-28 flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#5e3f3a]">Guests</label>
              <input
                type="number"
                min={1}
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                placeholder="30"
                className="rounded-lg border border-[#e2dfde] bg-white px-3 py-2 text-sm outline-none focus:border-[#9e0000] transition-colors"
              />
            </div>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes — e.g. asked about catering, waiting on a quote…"
            rows={2}
            className="resize-none rounded-lg border border-[#e2dfde] bg-white px-3 py-2 text-sm outline-none focus:border-[#9e0000] transition-colors"
          />
          <button
            onClick={handleEnquire}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9e0000] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#7e0000] transition-colors disabled:opacity-60"
          >
            {submitting && <Spinner className="size-4" />}
            Add to enquiries
          </button>
        </div>
      )}
    </div>
  )
}
