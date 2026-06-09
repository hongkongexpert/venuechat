"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Search, X, MapPin, Loader2, Download } from "lucide-react"
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
      // Reset when closed
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
        // Free accounts get the cover photo only; premium pulls the gallery.
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
        // Photos are best-effort; import the text fields regardless.
      }
      // Fall back to the thumbnail if the photos engine returned nothing.
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[88vh] sm:max-h-[80vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Import from Google Maps"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#eceae9]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#9e0000]/10 text-[#9e0000]">
            <MapPin size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-[#1a1c1c] leading-tight">
              Import from Google Maps
            </h2>
            <p className="text-xs text-[#8a7a77] truncate">
              Find your venue to autofill the details
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

        {/* Search bar */}
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
              {searching ? <Loader2 size={13} className="animate-spin" /> : "Search"}
            </button>
          </div>
          {!limits.fullMapsImport && (
            <p className="text-[11px] text-[#8a7a77] mt-2 px-1">
              Free plan imports the cover photo. Upgrade to Pro to import the
              full photo gallery.
            </p>
          )}
        </div>

        {/* Results */}
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
              Search for your venue by name to get started.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            {results.map((v) => (
              <button
                key={v.id}
                onClick={() => importVenue(v)}
                disabled={importingId !== null}
                className="flex items-center gap-3 rounded-xl p-2 text-left hover:bg-[#f7efee] transition-colors disabled:opacity-50"
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
                  <div className="flex items-center gap-2 mt-0.5">
                    {v.address && (
                      <span className="text-[11px] text-[#b8aeac] truncate">
                        {v.address}
                      </span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-[#9e0000]">
                  {importingId === v.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  Import
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
