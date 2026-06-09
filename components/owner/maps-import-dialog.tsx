"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Search, X, MapPin, Loader2, Download, Sparkles } from "lucide-react"
import { serpVenueToDraft, type ListingDraft } from "@/lib/listing-template"
import type { SerpVenue } from "@/lib/serpapi"
import { getPlanLimits, type AccountPlan } from "@/lib/account-plan"

interface MapsImportDialogProps {
  open: boolean
  plan: AccountPlan
  onClose: () => void
  onImport: (patch: Partial<ListingDraft>, photos: string[]) => void
}

export function MapsImportDialog({
  open,
  plan,
  onClose,
  onImport,
}: MapsImportDialogProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SerpVenue[]>([])
  const [searching, setSearching] = useState(false)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const limits = getPlanLimits(plan)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery("")
      setResults([])
      setSearched(false)
      setError(null)
      setImportingId(null)
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

  const importVenue = useCallback(
    async (v: SerpVenue) => {
      setImportingId(v.id)
      setError(null)
      const patch = serpVenueToDraft(v)
      let photos: string[] = []
      try {
        const photoCap = limits.fullMapsImport ? limits.maxPhotosPerListing : 1
        if (photoCap > 0 && v.id) {
          const res = await fetch(
            `/api/venues/photos?data_id=${encodeURIComponent(v.id)}`,
          )
          if (res.ok) {
            const data = await res.json()
            photos = (data.photos ?? [])
              .map((p: { image?: string }) => p.image)
              .filter(Boolean)
              .slice(0, photoCap)
          }
        }
      } catch {
        // Photos are best-effort
      }
      if (!photos.length && v.thumbnail) photos = [v.thumbnail]
      onImport(patch, photos)
      setImportingId(null)
      onClose()
    },
    [limits, onImport, onClose],
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[84vh] flex flex-col sm:flex-row rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Import from Google Maps"
      >
        {/* LEFT — dark branded panel */}
        <div className="relative sm:w-52 shrink-0 bg-[#1a0a0a] flex flex-col justify-between p-7 min-h-[130px] sm:min-h-0">
          {/* subtle texture overlay */}
          <div className="absolute inset-0 opacity-[0.04] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')]" />

          <div className="relative">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#9e0000]">
              <MapPin size={20} className="text-white" />
            </span>
          </div>

          <div className="relative mt-auto">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9e0000] mb-2">
              Google Maps
            </p>
            <h2 className="text-xl font-bold text-white leading-snug text-balance">
              Import your venue
            </h2>
            <p className="mt-2 text-sm text-[#9e8080] leading-relaxed">
              Find your business and autofill name, address, hours and photos instantly.
            </p>

            {!limits.fullMapsImport && (
              <div className="mt-5 flex items-start gap-2 rounded-xl bg-white/5 border border-white/10 p-3">
                <Sparkles size={13} className="text-[#f5c0b0] mt-0.5 shrink-0" />
                <p className="text-[11px] text-[#c8b4b0] leading-relaxed">
                  Upgrade to Pro to import the full photo gallery.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — search + results */}
        <div className="flex-1 flex flex-col bg-white min-h-0">
          {/* Search bar header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#f0ebe9]">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#e0dcdb] bg-[#faf9f8] px-3.5 py-2.5 focus-within:border-[#9e0000] transition-colors">
              <Search size={15} className="text-[#b8aeac] shrink-0" />
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
              className="shrink-0 rounded-xl bg-[#9e0000] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-[#7e0000] transition-colors"
            >
              {searching ? <Loader2 size={15} className="animate-spin" /> : "Search"}
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#8a7a77] hover:bg-[#f3f3f3] transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Results list */}
          <div className="flex-1 overflow-y-auto vc-scroll px-4 py-3">
            {error && (
              <p className="text-sm text-[#9e0000] bg-[#fdecea] rounded-xl px-4 py-3 mb-3">
                {error}
              </p>
            )}

            {!error && searched && !searching && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <MapPin size={28} className="text-[#e0d8d6] mb-3" />
                <p className="text-sm font-semibold text-[#5e3f3a]">No matches found</p>
                <p className="text-xs text-[#8a7a77] mt-1">Try a different name or add the district.</p>
              </div>
            )}

            {!searched && !searching && (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <Search size={28} className="text-[#e0d8d6] mb-3" />
                <p className="text-sm font-semibold text-[#5e3f3a]">Search for your venue</p>
                <p className="text-xs text-[#8a7a77] mt-1">Type the name above to get started.</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {results.map((v) => (
                <button
                  key={v.id}
                  onClick={() => importVenue(v)}
                  disabled={importingId !== null}
                  className="group flex items-center gap-4 rounded-xl border border-transparent p-3 text-left hover:border-[#f0ebe9] hover:bg-[#faf9f8] transition-all disabled:opacity-50"
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
                    <p className="text-sm font-bold text-[#1a1c1c] truncate">
                      {v.name}
                    </p>
                    <p className="text-xs text-[#8a7a77] truncate mt-0.5">
                      {[v.type, v.district].filter(Boolean).join(" · ")}
                    </p>
                    {v.address && (
                      <p className="text-[11px] text-[#b8aeac] truncate mt-0.5">
                        {v.address}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 flex items-center gap-1.5 rounded-lg bg-[#9e0000]/8 px-3 py-1.5 text-xs font-bold text-[#9e0000] group-hover:bg-[#9e0000] group-hover:text-white transition-colors">
                    {importingId === v.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Download size={13} />
                    )}
                    Import
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
