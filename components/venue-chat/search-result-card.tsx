"use client"

import { Star, MapPin, ImageIcon, Heart, Scale } from "lucide-react"
import type { SerpVenue } from "@/lib/serpapi"
import { useApp } from "./app-context"
import { cn } from "@/lib/utils"

interface SearchResultCardProps {
  venue: SerpVenue
  onClick: (venue: SerpVenue) => void
}

export function SearchResultCard({ venue, onClick }: SearchResultCardProps) {
  const { isSaved, toggleSaved, isComparing, toggleCompare } = useApp()
  const saved = isSaved(venue)
  const comparing = isComparing(venue)

  return (
    <div className="group relative bg-[#ffffff] border border-[#e8bdb6]/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#9e0000]/40 transition-all flex flex-col">
      {/* Quick actions */}
      <div className="absolute top-2 left-2 z-10 flex gap-1.5">
        <button
          type="button"
          aria-label={saved ? "Remove from saved" : "Save venue"}
          onClick={(e) => {
            e.stopPropagation()
            toggleSaved(venue)
          }}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full backdrop-blur shadow-sm transition-colors",
            saved
              ? "bg-[#9e0000] text-white"
              : "bg-[#f9f9f9]/95 text-[#9e0000] hover:bg-white",
          )}
        >
          <Heart size={14} className={saved ? "fill-current" : ""} />
        </button>
        <button
          type="button"
          aria-label={comparing ? "Remove from compare" : "Add to compare"}
          onClick={(e) => {
            e.stopPropagation()
            toggleCompare(venue)
          }}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full backdrop-blur shadow-sm transition-colors",
            comparing
              ? "bg-[#9e0000] text-white"
              : "bg-[#f9f9f9]/95 text-[#9e0000] hover:bg-white",
          )}
        >
          <Scale size={14} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => onClick(venue)}
        className="text-left flex flex-col flex-1"
      >
        <div className="h-28 sm:h-36 w-full relative overflow-hidden bg-[#e8e8e8] shrink-0">
          {venue.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={venue.thumbnail || "/placeholder.svg"}
              alt={venue.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#bda5a0]">
              <ImageIcon size={28} aria-hidden />
            </div>
          )}
          {venue.price && (
            <span className="absolute top-2 right-2 bg-[#f9f9f9]/95 backdrop-blur px-2 py-0.5 rounded-full text-xs font-semibold text-[#9e0000] shadow-sm">
              {venue.price}
            </span>
          )}
        </div>

        <div className="p-3 sm:p-3.5 flex flex-col gap-1 flex-1">
          <h4 className="font-bold text-sm sm:text-[15px] text-[#1a1c1c] leading-snug line-clamp-2 sm:line-clamp-1">
            {venue.name}
          </h4>

          <div className="flex items-center gap-2 text-xs">
            {venue.rating != null && (
              <span className="flex items-center gap-0.5 font-semibold text-[#1a1c1c]">
                <Star size={12} className="fill-[#e8a33d] text-[#e8a33d]" />
                {venue.rating}
                {venue.reviews != null && (
                  <span className="text-[#5f5e5e] font-normal">
                    ({venue.reviews.toLocaleString()})
                  </span>
                )}
              </span>
            )}
            {venue.type && (
              <span className="text-[#5e3f3a] line-clamp-1">{venue.type}</span>
            )}
          </div>

          {venue.address && (
            <p className="flex items-start gap-1 text-xs text-[#5f5e5e] leading-snug mt-0.5 line-clamp-1 sm:line-clamp-2">
              <MapPin size={12} className="text-[#9e0000] mt-0.5 shrink-0" />
              {venue.address}
            </p>
          )}

          <span className="mt-auto pt-2 text-xs font-semibold text-[#9e0000] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-block">
            View details &amp; photos →
          </span>
        </div>
      </button>
    </div>
  )
}
