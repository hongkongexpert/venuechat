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
  Crown,
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

  const STEPS: Step[] = ["search", "details", "done"]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[86vh] flex flex-col sm:flex-row rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Claim your venue"
      >
        {/* LEFT — premium dark branding panel */}
        <div className="relative sm:w-64 shrink-0 bg-[#1a0a0a] flex flex-col justify-between p-8 min-h-[140px] sm:min-h-0">
          {/* Back button */}
          {step === "details" && (
            <button
              onClick={() => setStep("search")}
              className="relative self-start flex items-center gap-1.5 text-xs text-[#9e8080] hover:text-white transition-colors mb-2"
              aria-label="Back"
            >
              <ChevronLeft size={14} />
              Back
            </button>
          )}

          <div className="relative">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#9e0000]">
              <ShieldCheck size={22} className="text-white" />
            </span>
          </div>

          <div className="relative mt-auto">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9e0000] mb-2.5">
              Venue ownership
            </p>
            <h2 className="text-2xl font-bold text-white leading-snug text-balance">
              {step === "done"
                ? outcome === "approved"
                  ? "You&apos;re verified"
                  : "Claim received"
                : "Claim your venue"}
            </h2>
            <p className="mt-3 text-sm text-[#9e8080] leading-relaxed">
              {step === "search"
                ? "Take control of your listing, edit your details and respond to enquiries."
                : step === "details"
                ? "Tell us how you're connected to this business."
                : outcome === "approved"
                ? "Your listing is live and ready to edit."
                : "Our team will verify and approve your claim."}
            </p>

            {/* Step dots */}
            <div className="mt-8 flex items-center gap-2">
              {STEPS.map((s, i) => (
                <span
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step === s
                      ? "w-7 bg-[#9e0000]"
                      : i < STEPS.indexOf(step)
                      ? "w-3.5 bg-[#9e0000]/50"
                      : "w-3.5 bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — content area */}
        <div className="flex-1 flex flex-col bg-white min-h-0 overflow-hidden">
          {/* Header row with close */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0ebe9]">
            <p className="text-sm font-bold text-[#1a1c1c]">
              {step === "search"
                ? "Find your business"
                : step === "details"
                ? "Verify your connection"
                : "All done"}
            </p>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#8a7a77] hover:bg-[#f3f3f3] transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* SEARCH STEP */}
          {step === "search" && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="px-6 pt-4 pb-3 flex items-center gap-3">
                <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-[#e0dcdb] bg-[#faf9f8] px-4 py-3 focus-within:border-[#9e0000] transition-colors">
                  <Search size={16} className="text-[#b8aeac] shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && runSearch()}
                    placeholder="e.g. The Peninsula, Tsim Sha Tsui"
                    className="flex-1 bg-transparent text-sm text-[#1a1c1c] placeholder:text-[#c8c0be] outline-none"
                  />
                </div>
                <button
                  onClick={runSearch}
                  disabled={query.trim().length < 2 || searching}
                  className="shrink-0 rounded-xl bg-[#9e0000] px-5 py-3 text-sm font-bold text-white disabled:opacity-40 hover:bg-[#7e0000] transition-colors"
                >
                  {searching ? <Loader2 size={15} className="animate-spin" /> : "Search"}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto vc-scroll px-4 pb-4">
                {error && (
                  <p className="mb-3 rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-[#9e0000]">
                    {error}
                  </p>
                )}
                {!error && searched && !searching && results.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <MapPin size={32} className="text-[#e0d8d6] mb-3" />
                    <p className="text-sm font-bold text-[#5e3f3a]">No matches found</p>
                    <p className="text-xs text-[#8a7a77] mt-1.5">
                      Try a different name or add the district.
                    </p>
                  </div>
                )}
                {!searched && !searching && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Search size={32} className="text-[#e0d8d6] mb-3" />
                    <p className="text-sm font-bold text-[#5e3f3a]">Find your business</p>
                    <p className="text-xs text-[#8a7a77] mt-1.5">
                      Type the venue name to search.
                    </p>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {results.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => choose(v)}
                      className="group flex items-center gap-4 rounded-xl border border-[#f0ebe9] bg-white p-4 text-left hover:border-[#9e0000]/20 hover:bg-[#fdf9f8] transition-all shadow-sm"
                    >
                      <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-[#f0eeed]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={v.thumbnail || "/placeholder.svg"}
                          alt={v.name}
                          className="h-full w-full object-cover"
                          crossOrigin="anonymous"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#1a1c1c] truncate">{v.name}</p>
                        <p className="text-xs text-[#8a7a77] truncate mt-0.5">
                          {[v.type, v.district].filter(Boolean).join(" · ")}
                        </p>
                        {v.address && (
                          <p className="text-[11px] text-[#b8aeac] truncate mt-0.5">
                            {v.address}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 rounded-xl border border-[#9e0000]/20 bg-[#9e0000]/5 px-3.5 py-2 text-xs font-bold text-[#9e0000] group-hover:bg-[#9e0000] group-hover:text-white group-hover:border-transparent transition-colors">
                        Select
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DETAILS STEP */}
          {step === "details" && selected && (
            <div className="flex-1 overflow-y-auto vc-scroll px-6 pb-6">
              {/* Selected venue summary */}
              <div className="flex items-center gap-4 rounded-xl bg-[#faf9f8] border border-[#f0ebe9] p-4 mt-4 mb-5">
                <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-[#f0eeed]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selected.thumbnail || "/placeholder.svg"}
                    alt={selected.name}
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1a1c1c] truncate">{selected.name}</p>
                  <p className="text-xs text-[#8a7a77] truncate mt-0.5">
                    {[selected.type, selected.district].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>

              {/* Verification hint */}
              {websiteHost ? (
                <div className="flex items-start gap-3 rounded-xl border border-[#cfe8d3] bg-[#f1faf2] p-4 mb-5">
                  <CheckCircle2 size={16} className="text-[#3f8f4f] mt-0.5 shrink-0" />
                  <p className="text-sm text-[#2f6f3c] leading-relaxed">
                    Instant approval available — sign in with a{" "}
                    <span className="font-bold">@{websiteHost}</span> email and your
                    claim is verified automatically.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-xl border border-[#f0e3c0] bg-[#fdf8ec] p-4 mb-5">
                  <ShieldCheck size={16} className="text-[#b8860b] mt-0.5 shrink-0" />
                  <p className="text-sm text-[#6b5618] leading-relaxed">
                    No website on file — our team will review your claim manually.
                    Add details below to help us verify you quickly.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-[#1a1c1c]">
                    Your role at the venue
                  </span>
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Owner, Manager, Marketing Director"
                    className="mt-2 w-full rounded-xl border border-[#e0dcdb] bg-white px-4 py-3 text-sm text-[#1a1c1c] outline-none focus:border-[#9e0000] transition-colors"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-[#1a1c1c]">
                    Contact phone{" "}
                    <span className="font-normal text-[#b8aeac] normal-case">optional</span>
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Business phone number"
                    className="mt-2 w-full rounded-xl border border-[#e0dcdb] bg-white px-4 py-3 text-sm text-[#1a1c1c] outline-none focus:border-[#9e0000] transition-colors"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-[#1a1c1c]">
                    Supporting notes{" "}
                    <span className="font-normal text-[#b8aeac] normal-case">optional</span>
                  </span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="e.g. business registration number, link to a page listing you as staff"
                    className="mt-2 w-full rounded-xl border border-[#e0dcdb] bg-white px-4 py-3 text-sm text-[#1a1c1c] outline-none focus:border-[#9e0000] transition-colors resize-none"
                  />
                </label>
              </div>

              {error && (
                <p className="mt-4 rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-[#9e0000]">
                  {error}
                </p>
              )}

              <button
                onClick={submit}
                disabled={submitting}
                className="mt-6 w-full rounded-xl bg-[#9e0000] py-3.5 text-sm font-bold text-white hover:bg-[#7e0000] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 tracking-wide"
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                Submit claim
              </button>
            </div>
          )}

          {/* DONE STEP */}
          {step === "done" && (
            <div className="flex-1 overflow-y-auto vc-scroll px-6 pb-6 flex flex-col items-center justify-center text-center">
              <span
                className={`flex h-20 w-20 items-center justify-center rounded-2xl ${
                  outcome === "approved"
                    ? "bg-[#eaf6ec] text-[#3f8f4f]"
                    : "bg-[#fdf8ec] text-[#b8860b]"
                }`}
              >
                {outcome === "approved" ? (
                  <Crown size={36} />
                ) : (
                  <ShieldCheck size={36} />
                )}
              </span>
              <h3 className="mt-6 text-xl font-bold text-[#1a1c1c] text-balance">
                {outcome === "approved"
                  ? "Verified — the venue is yours"
                  : "Claim submitted for review"}
              </h3>
              <p className="mt-2.5 text-sm text-[#8a7a77] leading-relaxed max-w-xs mx-auto">
                {outcome === "approved"
                  ? "Your email matched the venue's website domain, so we verified you instantly. Your listing is a draft — edit and publish it anytime."
                  : "Our team will review your claim and notify you once approved, usually within a couple of days. Track progress under Claims."}
              </p>
              <div className="mt-7 flex flex-col gap-3 w-full max-w-xs">
                {outcome === "approved" && approvedVenueId && (
                  <a
                    href={`/owner/venues/${approvedVenueId}`}
                    className="w-full rounded-xl bg-[#9e0000] py-3.5 text-sm font-bold text-white hover:bg-[#7e0000] transition-colors text-center"
                  >
                    Edit my listing
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="w-full rounded-xl border border-[#e0dcdb] py-3.5 text-sm font-semibold text-[#5e3f3a] hover:bg-[#f6f4f3] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
