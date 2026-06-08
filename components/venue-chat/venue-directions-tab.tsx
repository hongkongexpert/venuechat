"use client"

import { useState } from "react"
import useSWR from "swr"
import { Car, Bus, Footprints, Bike, Navigation, Clock, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import type { SerpDirectionsResult, SerpVenue } from "@/lib/serpapi"

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to load directions")
    return r.json()
  })

const TRAVEL_MODES = [
  { value: "0", label: "Drive", icon: Car },
  { value: "3", label: "Transit", icon: Bus },
  { value: "2", label: "Walk", icon: Footprints },
  { value: "1", label: "Cycle", icon: Bike },
]

const PRESETS = [
  "Hong Kong International Airport",
  "Central MTR Station",
  "Tsim Sha Tsui",
  "Hong Kong Station",
]

export function VenueDirectionsTab({ venue }: { venue: SerpVenue }) {
  const [start, setStart] = useState("")
  const [mode, setMode] = useState("0")
  const [submitted, setSubmitted] = useState<{ start: string; mode: string } | null>(
    null,
  )

  const endParam = venue.gps
    ? `end_coords=${venue.gps.lat},${venue.gps.lng}`
    : `end_addr=${encodeURIComponent(venue.address ?? venue.name)}`

  const key =
    submitted && submitted.start.trim()
      ? `/api/venues/directions?start_addr=${encodeURIComponent(
          submitted.start,
        )}&${endParam}&travel_mode=${submitted.mode}`
      : null

  const { data, error, isLoading } = useSWR<SerpDirectionsResult>(key, fetcher)
  const directions = data?.directions ?? []

  const handleSubmit = () => {
    if (!start.trim()) return
    setSubmitted({ start, mode })
  }

  return (
    <div className="flex flex-col gap-4">
      <span className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-widest">
        Get directions
      </span>

      {/* Destination */}
      <div className="flex items-center gap-2 text-sm text-[#3a3a3a] bg-[#faf6f5] rounded-lg px-3 py-2 border border-[#f0eae9]">
        <MapPin size={15} className="text-[#9e0000] shrink-0" />
        <span className="truncate">
          To <span className="font-semibold">{venue.name}</span>
        </span>
      </div>

      {/* Travel mode toggle */}
      <div className="grid grid-cols-4 gap-2">
        {TRAVEL_MODES.map((m) => {
          const Icon = m.icon
          const active = mode === m.value
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 rounded-lg border text-xs font-medium transition-colors",
                active
                  ? "border-[#9e0000] bg-[#9e0000] text-white"
                  : "border-[#e8bdb6] text-[#5e3f3a] hover:bg-[#faf6f5]",
              )}
            >
              <Icon size={16} />
              {m.label}
            </button>
          )
        })}
      </div>

      {/* Start input */}
      <div className="flex gap-2">
        <Input
          value={start}
          onChange={(e) => setStart(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit()
          }}
          placeholder="Starting point…"
          className="border-[#e8bdb6] focus-visible:ring-[#9e0000]/30"
          aria-label="Starting location"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!start.trim()}
          className="px-4 rounded-md bg-[#9e0000] text-white text-sm font-semibold hover:bg-[#cc0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
        >
          <Navigation size={14} />
          Go
        </button>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setStart(p)
              setSubmitted({ start: p, mode })
            }}
            className="text-xs px-2.5 py-1 rounded-full bg-[#f4eceb] text-[#5e3f3a] border border-[#ecdedc] hover:border-[#e8bdb6] transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-8 text-[#5f5e5e]">
          <Spinner className="size-4" />
          <span className="text-sm">Finding routes…</span>
        </div>
      )}

      {error && (
        <p className="text-sm text-[#9e0000] py-2">
          Couldn&apos;t find directions. Try a different starting point.
        </p>
      )}

      {key && !isLoading && !error && directions.length === 0 && (
        <p className="text-sm text-[#5f5e5e] py-2">
          No routes found for this trip.
        </p>
      )}

      {/* Route results */}
      <div className="flex flex-col gap-2">
        {directions.map((d, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#f0eae9] p-3 flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#1a1c1c]">
                  {d.travelMode ?? "Route"}
                </span>
                {d.via && (
                  <span className="text-xs text-[#5f5e5e] truncate">
                    via {d.via}
                  </span>
                )}
              </div>
              {(d.startTime || d.extensions?.length) && (
                <p className="text-xs text-[#5f5e5e] mt-1 leading-relaxed">
                  {d.startTime && d.endTime
                    ? `${d.startTime} → ${d.endTime}`
                    : d.extensions?.[0]}
                </p>
              )}
              {d.cost != null && (
                <p className="text-xs text-[#5e3f3a] mt-0.5 font-medium">
                  {d.currency ?? ""} {d.cost}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 justify-end text-[#9e0000] font-bold text-sm">
                <Clock size={13} />
                {d.formattedDuration ?? "—"}
              </div>
              {d.formattedDistance && (
                <span className="text-xs text-[#a89490]">
                  {d.formattedDistance}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
