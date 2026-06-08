"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  X,
  User,
  SlidersHorizontal,
  Database,
  LayoutDashboard,
  Sparkles,
  LogOut,
  ChevronRight,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { useApp, type SettingsTab } from "./app-context"
import { AuthGate } from "./panel-shared"
import {
  getProfile,
  updateProfile,
  signOut,
} from "@/app/actions/venue-actions"

const NAV: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: "account", label: "Account", icon: User },
  { id: "preferences", label: "Event defaults", icon: SlidersHorizontal },
  { id: "data", label: "Data controls", icon: Database },
]

export function SettingsDialog() {
  const { settingsOpen, settingsTab, openSettings, closeSettings, user, loadingUser } =
    useApp()

  // Close on Escape
  useEffect(() => {
    if (!settingsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSettings()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [settingsOpen, closeSettings])

  if (!settingsOpen) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      {/* Backdrop */}
      <button
        aria-label="Close settings"
        onClick={closeSettings}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative z-10 flex h-[100dvh] w-full flex-col overflow-hidden bg-[#f9f9f9] shadow-2xl sm:h-[min(640px,90vh)] sm:max-w-3xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8bdb6] px-5 py-4 sm:px-6">
          <h2 className="text-xl font-bold tracking-tight text-[#1a1c1c]">
            Settings
          </h2>
          <button
            aria-label="Close"
            onClick={closeSettings}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#5e3f3a] transition-colors hover:bg-[#e8e8e8]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body: nav + content */}
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          {/* Left nav — horizontal scroll tabs on mobile, vertical rail on desktop */}
          <nav
            aria-label="Settings sections"
            className="flex shrink-0 gap-1 overflow-x-auto border-b border-[#eceae9] px-3 py-2 sm:w-52 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r sm:px-3 sm:py-4"
          >
            {NAV.map(({ id, label, icon: Icon }) => {
              const active = settingsTab === id
              return (
                <button
                  key={id}
                  onClick={() => openSettings(id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[#f0e4e2] text-[#9e0000]"
                      : "text-[#5e3f3a] hover:bg-[#eceae9]",
                  )}
                >
                  <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                  {label}
                </button>
              )
            })}
          </nav>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto vc-scroll px-5 py-5 sm:px-7 sm:py-6">
            {loadingUser ? (
              <div className="flex items-center justify-center py-16">
                <Spinner className="size-5" />
              </div>
            ) : !user ? (
              <AuthGate message="Sign in to manage your account and tune every search to your event." />
            ) : settingsTab === "account" ? (
              <AccountSection />
            ) : settingsTab === "preferences" ? (
              <PreferencesSection />
            ) : (
              <DataControlsSection />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Account ---------------- */

function AccountSection() {
  const { user, closeSettings } = useApp()
  const initial = user?.email ? user.email[0].toUpperCase() : "?"

  return (
    <div className="flex flex-col gap-5">
      {/* Identity row */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-[#e8bdb6] bg-white p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#9e0000] text-base font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#1a1c1c]">
              {user?.user_metadata?.display_name || "Your account"}
            </p>
            <p className="truncate text-sm text-[#8a7a77]">{user?.email}</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          onClick={closeSettings}
          className="shrink-0 rounded-full border border-[#e0dcdb] bg-white px-4 py-2 text-sm font-semibold text-[#5e3f3a] transition-colors hover:border-[#9e0000] hover:text-[#9e0000]"
        >
          Manage
        </Link>
      </div>

      {/* Action rows */}
      <div className="overflow-hidden rounded-xl border border-[#e8bdb6] bg-white">
        <Row
          icon={<LayoutDashboard size={18} className="text-[#9e0000]" />}
          label="Dashboard"
          sub="Saved venues, enquiries and activity"
          href="/dashboard"
          onNavigate={closeSettings}
        />
        <div className="border-t border-[#eceae9]" />
        <Row
          icon={<Sparkles size={18} className="text-[#9e0000]" />}
          label="List your venue"
          sub="Reach event planners across Hong Kong"
          href="/owner"
          onNavigate={closeSettings}
        />
        <div className="border-t border-[#eceae9]" />
        <Row
          icon={<Sparkles size={18} className="text-[#e8a33d]" />}
          label="Upgrade plan"
          sub="Unlock premium listing features"
          href="/pricing"
          onNavigate={closeSettings}
        />
      </div>

      <button
        type="button"
        onClick={async () => {
          await signOut()
          window.location.href = "/"
        }}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#e8bdb6] bg-white px-4 py-2.5 text-sm font-semibold text-[#9e0000] transition-colors hover:bg-[#fdecea]"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  )
}

function Row({
  icon,
  label,
  sub,
  href,
  onNavigate,
}: {
  icon: React.ReactNode
  label: string
  sub: string
  href: string
  onNavigate: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#f7efee]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fbf3f2]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[#1a1c1c]">
          {label}
        </span>
        <span className="block truncate text-xs text-[#8a7a77]">{sub}</span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-[#b5b1b0]" />
    </Link>
  )
}

/* ---------------- Event defaults ---------------- */

const EVENT_TYPES = [
  "Birthday",
  "Wedding",
  "Corporate",
  "Cocktail party",
  "Dinner",
  "Networking",
]
const BUDGETS = ["$", "$$", "$$$", "$$$$"]

function PreferencesSection() {
  const { user } = useApp()
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

  if (loading)
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="size-5" />
      </div>
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
      <p className="text-sm leading-relaxed text-[#8a7a77]">
        Set your defaults once so every search is tuned to your event.
      </p>

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
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                budget === b
                  ? "border-[#9e0000] bg-[#fdecea] text-[#9e0000]"
                  : "border-[#e2dfde] bg-white text-[#5e3f3a] hover:bg-[#f4eceb]",
              )}
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
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                eventType === t
                  ? "border-[#9e0000] bg-[#fdecea] text-[#9e0000]"
                  : "border-[#e2dfde] bg-white text-[#5e3f3a] hover:bg-[#f4eceb]",
              )}
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
        className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-[#9e0000] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {saving && <Spinner className="size-4" />}
        {saved ? "Saved!" : "Save preferences"}
      </button>
    </div>
  )
}

/* ---------------- Data controls ---------------- */

function DataControlsSection() {
  const { clearCompare, compare } = useApp()

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm leading-relaxed text-[#8a7a77]">
        Manage the data stored for this session and your account.
      </p>

      <div className="overflow-hidden rounded-xl border border-[#e8bdb6] bg-white">
        <div className="flex items-center justify-between gap-3 px-4 py-3.5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1a1c1c]">
              Comparison list
            </p>
            <p className="text-xs text-[#8a7a77]">
              {compare.length > 0
                ? `${compare.length} venue${compare.length > 1 ? "s" : ""} in your current comparison`
                : "No venues in your current comparison"}
            </p>
          </div>
          <button
            onClick={clearCompare}
            disabled={compare.length === 0}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#e0dcdb] bg-white px-3.5 py-2 text-sm font-semibold text-[#5e3f3a] transition-colors hover:border-[#9e0000] hover:text-[#9e0000] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-[#b5b1b0]">
        Saved venues and search history are tied to your account and can be
        managed from the dashboard.
      </p>
    </div>
  )
}
