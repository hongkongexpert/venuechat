"use client"

import Link from "next/link"
import { MapPin, Trash2, LogIn } from "lucide-react"
import type { SerpVenue } from "@/lib/serpapi"

export function AuthGate({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="w-12 h-12 rounded-full bg-[#fdecea] flex items-center justify-center mb-4">
        <LogIn className="text-[#9e0000]" size={22} />
      </div>
      <p className="text-sm text-[#5f5e5e] leading-relaxed max-w-[260px]">
        {message}
      </p>
      <div className="flex gap-2 mt-5">
        <Link
          href="/auth/login"
          className="rounded-full bg-[#9e0000] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Sign in
        </Link>
        <Link
          href="/auth/sign-up"
          className="rounded-full border border-[#e8bdb6] bg-white px-4 py-2 text-sm font-semibold text-[#9e0000] hover:bg-[#fdecea] transition-colors"
        >
          Sign up
        </Link>
      </div>
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <p className="text-sm text-[#5f5e5e] leading-relaxed max-w-[280px]">
        {message}
      </p>
    </div>
  )
}

export function VenueListItem({
  venue,
  onClick,
  onRemove,
  right,
}: {
  venue: SerpVenue
  onClick?: () => void
  onRemove?: () => void
  right?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e8bdb6] bg-white p-2.5">
      <button
        onClick={onClick}
        className="flex flex-1 items-center gap-3 text-left min-w-0"
      >
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#e8e8e8]">
          {venue.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={venue.thumbnail || "/placeholder.svg"}
              alt={venue.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#1a1c1c]">
            {venue.name}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-[#5f5e5e]">
            {venue.district && (
              <span className="flex items-center gap-0.5 truncate">
                <MapPin size={11} className="text-[#9e0000]" />
                {venue.district}
              </span>
            )}
          </div>
        </div>
      </button>
      {right}
      {onRemove && (
        <button
          aria-label="Remove"
          onClick={onRemove}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#5e3f3a] hover:bg-[#fdecea] hover:text-[#9e0000] transition-colors"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  )
}
