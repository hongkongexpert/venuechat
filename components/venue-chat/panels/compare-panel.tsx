"use client"

import { X } from "lucide-react"
import { useApp } from "../app-context"
import { EmptyState } from "../panel-shared"
import type { SerpVenue } from "@/lib/serpapi"

const ROWS: { label: string; get: (v: SerpVenue) => string }[] = [
  { label: "Price", get: (v) => v.price || "—" },
  { label: "Type", get: (v) => v.type || "—" },
  { label: "District", get: (v) => v.district || "—" },
  { label: "Hours", get: (v) => v.openState || "—" },
]

export function ComparePanel({
  onSelectVenue,
}: {
  onSelectVenue: (v: SerpVenue) => void
}) {
  const { compare, toggleCompare, clearCompare } = useApp()

  if (compare.length === 0)
    return (
      <EmptyState message="Add up to 3 venues with the compare button on any venue card to see them side by side." />
    )

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={clearCompare}
        className="self-end text-xs font-semibold text-[#9e0000] hover:underline"
      >
        Clear all
      </button>

      {/* Venue headers */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${compare.length}, minmax(0,1fr))` }}
      >
        {compare.map((v) => (
          <div
            key={v.id || v.name}
            className="relative rounded-xl border border-[#e8bdb6] bg-white p-2"
          >
            <button
              aria-label={`Remove ${v.name}`}
              onClick={() => toggleCompare(v)}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#9e0000] text-white shadow"
            >
              <X size={12} />
            </button>
            <button onClick={() => onSelectVenue(v)} className="w-full text-left">
              <div className="mb-1.5 h-16 w-full overflow-hidden rounded-lg bg-[#e8e8e8]">
                {v.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.thumbnail || "/placeholder.svg"}
                    alt={v.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
              <p className="line-clamp-2 text-xs font-semibold leading-snug text-[#1a1c1c]">
                {v.name}
              </p>
            </button>
          </div>
        ))}
      </div>

      {/* Comparison rows */}
      <div className="overflow-hidden rounded-xl border border-[#e8bdb6] bg-white">
        {ROWS.map((row, i) => (
          <div
            key={row.label}
            className={i % 2 === 0 ? "bg-[#faf6f5]" : "bg-white"}
          >
            <p className="px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-[#926e69]">
              {row.label}
            </p>
            <div
              className="grid gap-2 px-3 pb-2"
              style={{
                gridTemplateColumns: `repeat(${compare.length}, minmax(0,1fr))`,
              }}
            >
              {compare.map((v) => (
                <span
                  key={v.id || v.name}
                  className="flex items-center gap-1 text-sm text-[#1a1c1c]"
                >
                  {row.get(v)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
