"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Search,
  X,
  MapPin,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react"
import type { SerpVenue } from "@/lib/serpapi"
import { submitClaim } from "@/app/actions/claim-actions"

interface ClaimDialogProps {
  open: boolean
  onClose: () => void
  onApproved?: (venueId?: string) => void
  onPending?: () => void
}

type Step = "search" | "details" | "done"

export function ClaimDialog({
  open,
  onClose,
  onApproved,
  onPending,
}: ClaimDialogProps) {
  const [step, setStep] = useState<Step>("search")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SerpVenue[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selected, setSelected] = useState<SerpVenue | null>(null)
  const [role, setRole] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [outcome, setOutcome] = useState<"approved" | "pending" | null>(null)
  const [approvedVenueId, setApprovedVenueId] = useState<string | undefined>()

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setStep("search")
      setQuery("")
      setResults([])
      setSearched(false)
      setError(null)
      setSelected(null)
      setRole("")
      setPhone("")
      setNotes("")
      setOutcome(null)
      setApprovedVenueId(undefined)
    }
  }, [open])

  const runSearch = useCallback(async () => {
    const q = query.trim()
    if (q.length < 2 || searching) return
    setSearching(true)
    setError(null)
    setSearched(true)
    try {
      const res = await fetch(`/api/venues/import?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Search failed")
      setResults(data.results ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [query, searching])

  const choose = (v: SerpVenue) => {
    setSelected(v)
    setError(null)
    setStep("details")
  }

  const submit = async () => {
    if (!selected || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await submitClaim({
        venue: selected,
        photos: selected.thumbnail ? [selected.thumbnail] : [],
        claimantPhone: phone.trim() || undefined,
        claimantRole: role.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      if (!res.ok) {
        setError(res.error || "Could not submit your claim.")
        return
      }
      setOutcome(res.status ?? "pending")
      setApprovedVenueId(res.venueId)
      setStep("done")
      if (res.status === "approved") onApproved?.(res.venueId)
      else onPending?.()
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const websiteHost = (() => {
    try {
      if (!selected?.website) return null
      const u = new URL(
        selected.website.includes("://")
          ? selected.website
          : `https://${selected.website}`,
      )
      return u.hostname.replace(/^www\./, "")
    } catch {
      return null
    }
  })()

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[90vh] sm:max-h-[84vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Claim your venue"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#eceae9]">
          {step === "details" && (
            <button
              onClick={() => setStep("search")}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#8a7a77] hover:bg-[#f3f3f3]"
              aria-label="Back"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#9e0000]/10 text-[#9e0000]">
            <ShieldCheck size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-[#1a1c1c] leading-tight">
              Claim your venue
            </h2>
            <p className="text-xs text-[#8a7a77] truncate">
              {step === "search"
                ? "Find your business on Google Maps"
                : step === "details"
                  ? "Verify you represent this venue"
                  : "Claim submitted"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#8a7a77] hover:bg-[#f3f3f3]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* SEARCH STEP */}
        {step === "search" && (
          <>
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center gap-2 rounded-full border border-[#e0dcdb] bg-[#f9f9f9] px-3.5 py-2 focus-within:border-[#9e0000]">
                <Search size={16} className="text-[#b8aeac] shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runSearch()}
                  placeholder="e.g. The Peninsula, Tsim Sha Tsui"
                  className="flex-1 bg-transparent text-sm text-[#1a1c1c] placeholder:text-[#b8aeac] outline-none"
                />
                <button
                  onClick={runSearch}
                  disabled={query.trim().length < 2 || searching}
                  className="shrink-0 rounded-full bg-[#9e0000] px-3 py-1 text-xs font-semibold text-white disabled:opacity-40 hover:bg-[#7e0000] transition-colors"
                >
                  {searching ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    "Search"
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto vc-scroll px-3 pb-4">
              {error && (
                <p className="mx-2 text-sm text-[#9e0000] bg-[#fdecea] rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              {!error && searched && !searching && results.length === 0 && (
                <p className="text-center text-sm text-[#8a7a77] py-10">
                  No matches found. Try a different name or add the district.
                </p>
              )}
              {!searched && !searching && (
                <p className="text-center text-sm text-[#8a7a77] py-10">
                  Search for your venue by name to claim it.
                </p>
              )}
              <div className="flex flex-col gap-1.5">
                {results.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => choose(v)}
                    className="flex items-center gap-3 rounded-xl p-2 text-left hover:bg-[#f7efee] transition-colors"
                  >
                    <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-[#f0eeed]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={v.thumbnail || "/placeholder.svg"}
                        alt={v.name}
                        className="h-full w-full object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1a1c1c] truncate">
                        {v.name}
                      </p>
                      <p className="text-xs text-[#8a7a77] truncate">
                        {[v.type, v.district].filter(Boolean).join(" · ")}
                      </p>
                      {v.address && (
                        <span className="flex items-center gap-1 text-[11px] text-[#b8aeac] truncate mt-0.5">
                          <MapPin size={10} /> {v.address}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-[#9e0000]">
                      Claim
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* DETAILS STEP */}
        {step === "details" && selected && (
          <div className="flex-1 overflow-y-auto vc-scroll px-5 py-4">
            <div className="flex items-center gap-3 rounded-xl bg-[#f7efee] p-3 mb-4">
              <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-[#f0eeed]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.thumbnail || "/placeholder.svg"}
                  alt={selected.name}
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1a1c1c] truncate">
                  {selected.name}
                </p>
                <p className="text-xs text-[#8a7a77] truncate">
                  {[selected.type, selected.district]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>

            {websiteHost ? (
              <div className="flex items-start gap-2 rounded-xl border border-[#cfe8d3] bg-[#f1faf2] p-3 mb-4">
                <CheckCircle2
                  size={16}
                  className="text-[#3f8f4f] mt-0.5 shrink-0"
                />
                <p className="text-xs text-[#2f6f3c] leading-relaxed">
                  Instant approval available. Sign in with an email at{" "}
                  <span className="font-semibold">@{websiteHost}</span> and your
                  claim is verified automatically. Otherwise our team reviews it
                  within a couple of days.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-[#f0e3c0] bg-[#fdf8ec] p-3 mb-4">
                <ShieldCheck
                  size={16}
                  className="text-[#b8860b] mt-0.5 shrink-0"
                />
                <p className="text-xs text-[#6b5618] leading-relaxed">
                  This listing has no website on file, so our team will review
                  your claim manually. Add details below to help us verify you.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-[#5e3f3a]">
                  Your role at the venue
                </span>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Owner, Manager, Marketing"
                  className="mt-1 w-full rounded-lg border border-[#e0dcdb] bg-white px-3 py-2 text-sm text-[#1a1c1c] outline-none focus:border-[#9e0000]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-[#5e3f3a]">
                  Contact phone{" "}
                  <span className="font-normal text-[#b8aeac]">(optional)</span>
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Business phone number"
                  className="mt-1 w-full rounded-lg border border-[#e0dcdb] bg-white px-3 py-2 text-sm text-[#1a1c1c] outline-none focus:border-[#9e0000]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-[#5e3f3a]">
                  Anything to help us verify?{" "}
                  <span className="font-normal text-[#b8aeac]">(optional)</span>
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. business registration number, link to a page listing you as staff"
                  className="mt-1 w-full rounded-lg border border-[#e0dcdb] bg-white px-3 py-2 text-sm text-[#1a1c1c] outline-none focus:border-[#9e0000] resize-none"
                />
              </label>
            </div>

            {error && (
              <p className="mt-3 text-sm text-[#9e0000] bg-[#fdecea] rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={submit}
              disabled={submitting}
              className="mt-4 w-full rounded-xl bg-[#9e0000] py-2.5 text-sm font-semibold text-white hover:bg-[#7e0000] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              Submit claim
            </button>
          </div>
        )}

        {/* DONE STEP */}
        {step === "done" && (
          <div className="flex-1 overflow-y-auto vc-scroll px-5 py-8 text-center">
            <span
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                outcome === "approved"
                  ? "bg-[#eaf6ec] text-[#3f8f4f]"
                  : "bg-[#fdf8ec] text-[#b8860b]"
              }`}
            >
              {outcome === "approved" ? (
                <CheckCircle2 size={28} />
              ) : (
                <ShieldCheck size={28} />
              )}
            </span>
            <h3 className="mt-4 text-base font-bold text-[#1a1c1c]">
              {outcome === "approved"
                ? "Verified — it's yours!"
                : "Claim submitted for review"}
            </h3>
            <p className="mt-1.5 text-sm text-[#8a7a77] leading-relaxed max-w-sm mx-auto">
              {outcome === "approved"
                ? "Your email matched the venue's website, so we verified you instantly. The listing is now in your dashboard as a draft — edit and publish it anytime."
                : "Our team will review your claim and email you once it's approved, usually within a couple of days. You can track its status under Claims."}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {outcome === "approved" && approvedVenueId && (
                <a
                  href={`/owner/venues/${approvedVenueId}`}
                  className="w-full rounded-xl bg-[#9e0000] py-2.5 text-sm font-semibold text-white hover:bg-[#7e0000] transition-colors"
                >
                  Edit my listing
                </a>
              )}
              <button
                onClick={onClose}
                className="w-full rounded-xl border border-[#e0dcdb] py-2.5 text-sm font-semibold text-[#5e3f3a] hover:bg-[#f6f4f3] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
