"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LogOut, LayoutDashboard, Sparkles, ChevronRight } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { useApp } from "../app-context"
import { AuthGate } from "../panel-shared"
import { getProfile, updateProfile, signOut } from "@/app/actions/venue-actions"

const EVENT_TYPES = [
  "Birthday",
  "Wedding",
  "Corporate",
  "Cocktail party",
  "Dinner",
  "Networking",
]
const BUDGETS = ["$", "$$", "$$$", "$$$$"]

export function ProfilePanel() {
  const { user, loadingUser } = useApp()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [displayName, setDisplayName] = useState("")
  const [guestCount, setGuestCount] = useState("")
  const [budget, setBudget] = useState("")
  const [eventType, setEventType] = useState("")
  const [district, setDistrict] = useState("")

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    getProfile().then((p) => {
      if (p) {
        setDisplayName(p.display_name ?? "")
        setGuestCount(p.default_guest_count ? String(p.default_guest_count) : "")
        setBudget(p.default_budget ?? "")
        setEventType(p.default_event_type ?? "")
        setDistrict(p.default_district ?? "")
      }
      setLoading(false)
    })
  }, [user])

  if (loadingUser || (user && loading))
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-5" />
      </div>
    )

  if (!user)
    return (
      <AuthGate message="Sign in to set your event defaults so every search is tuned to your needs." />
    )

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    await updateProfile({
      display_name: displayName || null,
      default_guest_count: guestCount ? Number.parseInt(guestCount, 10) : null,
      default_budget: budget || null,
      default_event_type: eventType || null,
      default_district: district || null,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-[#e8bdb6] bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#926e69]">
          Signed in as
        </p>
        <p className="mt-1 text-sm font-medium text-[#1a1c1c]">{user.email}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-xl border border-[#e2dfde] bg-white px-4 py-3 text-sm font-medium text-[#1a1c1c] transition-colors hover:bg-[#f4eceb]"
        >
          <LayoutDashboard size={18} className="text-[#9e0000]" />
          <span className="flex-1">Open dashboard</span>
          <ChevronRight size={16} className="text-[#b5b1b0]" />
        </Link>
        <Link
          href="/pricing"
          className="flex items-center gap-3 rounded-xl border border-[#e2dfde] bg-white px-4 py-3 text-sm font-medium text-[#1a1c1c] transition-colors hover:bg-[#f4eceb]"
        >
          <Sparkles size={18} className="text-[#9e0000]" />
          <span className="flex-1">List your venue</span>
          <ChevronRight size={16} className="text-[#b5b1b0]" />
        </Link>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1a1c1c]">Name</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-lg border border-[#e2dfde] bg-white px-3 py-2.5 text-base outline-none focus:border-[#9e0000]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1a1c1c]">
          Default guest count
        </label>
        <input
          type="number"
          min={1}
          value={guestCount}
          onChange={(e) => setGuestCount(e.target.value)}
          placeholder="e.g. 30"
          className="w-full rounded-lg border border-[#e2dfde] bg-white px-3 py-2.5 text-base outline-none focus:border-[#9e0000]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1a1c1c]">Budget</label>
        <div className="flex gap-2">
          {BUDGETS.map((b) => (
            <button
              key={b}
              onClick={() => setBudget(b === budget ? "" : b)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                budget === b
                  ? "border-[#9e0000] bg-[#fdecea] text-[#9e0000]"
                  : "border-[#e2dfde] bg-white text-[#5e3f3a] hover:bg-[#f4eceb]"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1a1c1c]">Event type</label>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setEventType(t === eventType ? "" : t)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                eventType === t
                  ? "border-[#9e0000] bg-[#fdecea] text-[#9e0000]"
                  : "border-[#e2dfde] bg-white text-[#5e3f3a] hover:bg-[#f4eceb]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1a1c1c]">
          Preferred district
        </label>
        <input
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          placeholder="e.g. Central"
          className="w-full rounded-lg border border-[#e2dfde] bg-white px-3 py-2.5 text-base outline-none focus:border-[#9e0000]"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9e0000] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {saving && <Spinner className="size-4" />}
        {saved ? "Saved!" : "Save preferences"}
      </button>

      <button
        type="button"
        onClick={async () => {
          await signOut()
          window.location.href = "/"
        }}
        className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#e8bdb6] bg-white px-4 py-2.5 text-sm font-semibold text-[#9e0000] transition-colors hover:bg-[#fdecea]"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  )
}
