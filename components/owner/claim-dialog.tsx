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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[86vh] flex flex-col sm:flex-row rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Claim your venue"
      >
        {/* LEFT — premium dark branding panel */}
        <div className="relative sm:w-52 shrink-0 bg-[#1a0a0a] flex flex-col justify-between p-7 min-h-[130px] sm:min-h-0">
          <div className="absolute inset-0 opacity-[0.04] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')]" />

          {/* Step back button (details step only) */}
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
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#9e0000]">
              <ShieldCheck size={20} className="text-white" />
            </span>
          </div>

          <div className="relative mt-auto">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9e0000] mb-2">
              Venue ownership
            </p>
            <h2 className="text-xl font-bold text-white leading-snug text-balance">
              {step === "done"
                ? outcome === "approved"
                  ? "You're verified"
                  : "Claim received"
                : "Claim your venue"}
            </h2>
            <p className="mt-2 text-sm text-[#9e8080] leading-relaxed">
              {step === "search"
                ? "Take control of your listing, edit your details and respond to enquiries."
                : step === "details"
                ? "Tell us how you're connected to this business."
                : outcome === "approved"
                ? "Your listing is live and ready to edit."
                : "Our team will verify and approve your claim."}
            </p>

            {/* Step indicators */}
            <div className="mt-6 flex items-center gap-2">
              {(["search", "details", "done"] as Step[]).map((s, i) => (
                <span
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    step === s
                      ? "w-6 bg-[#9e0000]"
                      : i < ["search", "details", "done"].indexOf(step)
                      ? "w-3 bg-[#9e0000]/50"
                      : "w-3 bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — content */}
        <div className="flex-1 flex flex-col bg-white min-h-0 overflow-hidden">
          {/* Close button */}
          <div className="flex items-center justify-end px-5 pt-4 pb-0">
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#8a7a77] hover:bg-[#f3f3f3] transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* SEARCH STEP */}
          {step === "search" && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-5 pb-5">
              <div className="flex items-center gap-2 rounded-xl border border-[#e0dcdb] bg-[#faf9f8] px-3.5 py-2.5 focus-within:border-[#9e0000] transition-colors mb-3">
                <Search size={15} className="text-[#b8aeac] shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runSearch()}
                  placeholder="e.g. The Peninsula, Tsim Sha Tsui"
                  className="flex-1 bg-transparent text-sm text-[#1a1c1c] placeholder:text-[#c8c0be] outline-none"
                />
                <button
                  onClick={runSearch}
                  disabled={query.trim().length < 2 || searching}
                  className="shrink-0 rounded-lg bg-[#9e0000] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-[#7e0000] transition-colors"
                >
                  {searching ? <Loader2 size={14} className="animate-spin" /> : "Search"}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto vc-scroll -mx-1 px-1">
                {error && (
                  <p className="text-sm text-[#9e0000] bg-[#fdecea] rounded-xl px-4 py-3 mb-3">
                    {error}
                  </p>
                )}
                {!error && searched && !searching && results.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MapPin size={28} className="text-[#e0d8d6] mb-3" />
                    <p className="text-sm font-semibold text-[#5e3f3a]">No matches found</p>
                    <p className="text-xs text-[#8a7a77] mt-1">Try a different name or add the district.</p>
                  </div>
                )}
                {!searched && !searching && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search size={28} className="text-[#e0d8d6] mb-3" />
                    <p className="text-sm font-semibold text-[#5e3f3a]">Find your business</p>
                    <p className="text-xs text-[#8a7a77] mt-1">Type the venue name to search.</p>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {results.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => choose(v)}
                      className="group flex items-center gap-4 rounded-xl border border-transparent p-3 text-left hover:border-[#f0ebe9] hover:bg-[#faf9f8] transition-all"
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
                          <p className="text-[11px] text-[#b8aeac] truncate mt-0.5">{v.address}</p>
                        )}
                      </div>
                      <span className="shrink-0 rounded-lg border border-[#9e0000]/20 px-3 py-1.5 text-xs font-bold text-[#9e0000] group-hover:bg-[#9e0000] group-hover:text-white group-hover:border-transparent transition-colors">
                        Claim
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DETAILS STEP */}
          {step === "details" && selected && (
            <div className="flex-1 overflow-y-auto vc-scroll px-5 pb-5">
              {/* Selected venue card */}
              <div className="flex items-center gap-3 rounded-xl bg-[#faf9f8] border border-[#f0ebe9] p-3 mb-4">
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
                  <p className="text-xs text-[#8a7a77] truncate">
                    {[selected.type, selected.district].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>

              {/* Verification hint */}
              {websiteHost ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-[#cfe8d3] bg-[#f1faf2] p-3.5 mb-4">
                  <CheckCircle2 size={15} className="text-[#3f8f4f] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#2f6f3c] leading-relaxed">
                    Instant approval available — sign in with a{" "}
                    <span className="font-semibold">@{websiteHost}</span> email and your claim is verified automatically.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 rounded-xl border border-[#f0e3c0] bg-[#fdf8ec] p-3.5 mb-4">
                  <ShieldCheck size={15} className="text-[#b8860b] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#6b5618] leading-relaxed">
                    No website on file — our team will review your claim manually. Add details below to help us verify you quickly.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3.5">
                <label className="block">
                  <span className="text-xs font-bold text-[#1a1c1c] tracking-wide uppercase">
                    Your role at the venue
                  </span>
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Owner, Manager, Marketing Director"
                    className="mt-1.5 w-full rounded-xl border border-[#e0dcdb] bg-white px-3.5 py-2.5 text-sm text-[#1a1c1c] outline-none focus:border-[#9e0000] transition-colors"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-[#1a1c1c] tracking-wide uppercase">
                    Contact phone{" "}
                    <span className="font-normal text-[#b8aeac] normal-case">optional</span>
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Business phone number"
                    className="mt-1.5 w-full rounded-xl border border-[#e0dcdb] bg-white px-3.5 py-2.5 text-sm text-[#1a1c1c] outline-none focus:border-[#9e0000] transition-colors"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-[#1a1c1c] tracking-wide uppercase">
                    Supporting notes{" "}
                    <span className="font-normal text-[#b8aeac] normal-case">optional</span>
                  </span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="e.g. business registration number, link to a page listing you as staff"
                    className="mt-1.5 w-full rounded-xl border border-[#e0dcdb] bg-white px-3.5 py-2.5 text-sm text-[#1a1c1c] outline-none focus:border-[#9e0000] transition-colors resize-none"
                  />
                </label>
              </div>

              {error && (
                <p className="mt-3 text-sm text-[#9e0000] bg-[#fdecea] rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                onClick={submit}
                disabled={submitting}
                className="mt-5 w-full rounded-xl bg-[#9e0000] py-3 text-sm font-bold text-white hover:bg-[#7e0000] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 tracking-wide"
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                Submit claim
              </button>
            </div>
          )}

          {/* DONE STEP */}
          {step === "done" && (
            <div className="flex-1 overflow-y-auto vc-scroll px-5 pb-5 flex flex-col items-center justify-center text-center">
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                  outcome === "approved"
                    ? "bg-[#eaf6ec] text-[#3f8f4f]"
                    : "bg-[#fdf8ec] text-[#b8860b]"
                }`}
              >
                {outcome === "approved" ? (
                  <Crown size={30} />
                ) : (
                  <ShieldCheck size={30} />
                )}
              </span>
              <h3 className="mt-5 text-lg font-bold text-[#1a1c1c] text-balance">
                {outcome === "approved"
                  ? "Verified — the venue is yours"
                  : "Claim submitted for review"}
              </h3>
              <p className="mt-2 text-sm text-[#8a7a77] leading-relaxed max-w-xs mx-auto">
                {outcome === "approved"
                  ? "Your email matched the venue's website domain, so we verified you instantly. Your listing is now a draft — edit and publish it anytime."
                  : "Our team will review your claim and notify you once approved, usually within a couple of days. Track progress under Claims."}
              </p>
              <div className="mt-6 flex flex-col gap-2.5 w-full max-w-xs">
                {outcome === "approved" && approvedVenueId && (
                  <a
                    href={`/owner/venues/${approvedVenueId}`}
                    className="w-full rounded-xl bg-[#9e0000] py-3 text-sm font-bold text-white hover:bg-[#7e0000] transition-colors text-center"
                  >
                    Edit my listing
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="w-full rounded-xl border border-[#e0dcdb] py-3 text-sm font-semibold text-[#5e3f3a] hover:bg-[#f6f4f3] transition-colors"
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
