"use client"

import { useState } from "react"
import {
  Star,
  MapPin,
  Tag,
  Users,
  Mail,
  Phone,
  Globe,
  Check,
  ImageIcon,
  Heart,
  Scale,
  RotateCw,
  LayoutGrid,
  FileText,
  ExternalLink,
  Clock,
  Eye,
} from "lucide-react"
import type { ListingDraft } from "@/lib/listing-template"

function formatHKD(n: number | null | undefined) {
  if (n === null || n === undefined) return null
  return `HK$${n.toLocaleString()}`
}

/** Derive the consumer "$" price level from the starting HKD price. */
function priceLevel(min: number | null | undefined): string | null {
  if (!min) return null
  if (min < 3000) return "$"
  if (min < 10000) return "$$"
  if (min < 30000) return "$$$"
  return "$$$$"
}

interface ListingPreviewProps {
  draft: ListingDraft
  photos: string[]
}

type ViewMode = "card" | "detail"

export function ListingPreview({ draft, photos }: ListingPreviewProps) {
  const [view, setView] = useState<ViewMode>("card")
  const cover = photos[0] ?? null
  const location = [draft.district, draft.area].filter(Boolean).join(", ")
  const level = priceLevel(draft.price_min)
  const slug =
    (draft.name || "your-venue")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "your-venue"

  // Nothing meaningful in the draft yet → show the "preview will appear here" state.
  const hasContent = Boolean(
    draft.name ||
      draft.short_description ||
      draft.description ||
      draft.venue_type ||
      draft.district ||
      draft.area ||
      draft.address ||
      draft.capacity_max ||
      draft.price_min ||
      (draft.amenities && draft.amenities.length > 0) ||
      photos.length > 0,
  )

  return (
    <div className="flex flex-col rounded-2xl border border-[#e8bdb6]/70 bg-[#f3f3f3] overflow-hidden shadow-sm">
      {/* Browser-style chrome */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-[#e2dfde] bg-[#ece9e8]">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 flex items-center gap-2 rounded-md bg-white border border-[#e2dfde] px-2.5 py-1 text-xs text-[#8a7a77] min-w-0">
          <Globe size={12} className="shrink-0 text-[#b8aeac]" />
          <span className="truncate">venuechat.app/venues/{slug}</span>
        </div>
        <RotateCw size={13} className="text-[#b8aeac] shrink-0" />
      </div>

      {!hasContent ? (
        /* Empty state — mirrors the homepage's calm, centered aesthetic */
        <div className="flex flex-col items-center justify-center text-center px-6 py-16 bg-[#f9f9f9] min-h-[340px]">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9e0000]/10 text-[#9e0000] mb-4">
            <Eye size={26} />
          </span>
          <h3 className="text-base font-bold text-[#1a1c1c]">
            Your preview will be visible here
          </h3>
          <p className="text-sm text-[#8a7a77] mt-1.5 max-w-xs leading-relaxed">
            Start chatting on the left. As you describe your venue, your live
            listing — exactly how guests will see it — builds here in real time.
          </p>
          <div className="mt-5 flex items-center gap-1.5 text-[11px] font-medium text-[#b8aeac]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c4b8b5]" />
            Waiting for your first message
          </div>
        </div>
      ) : (
        <>
          {/* View toggle */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#e2dfde] bg-[#f3f3f3]">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a7a77]">
              Live preview
            </span>
            <div className="flex items-center gap-1 rounded-full bg-[#e2dedc] p-0.5">
              <ToggleBtn active={view === "card"} onClick={() => setView("card")} icon={<LayoutGrid size={13} />}>
                Search card
              </ToggleBtn>
              <ToggleBtn active={view === "detail"} onClick={() => setView("detail")} icon={<FileText size={13} />}>
                Detail page
              </ToggleBtn>
            </div>
          </div>

          {/* Preview surface */}
          <div className="p-4 sm:p-5 bg-[#f9f9f9]">
            {view === "card" ? (
              <PreviewCard draft={draft} cover={cover} location={location} level={level} />
            ) : (
              <PreviewDetail draft={draft} photos={photos} cover={cover} location={location} level={level} />
            )}
          </div>
        </>
      )}
    </div>
  )
}

function ToggleBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
        active ? "bg-white text-[#9e0000] shadow-sm" : "text-[#8a7a77] hover:text-[#5e3f3a]"
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

/* --------------------------------------------------------------------------
 * Card view — mirrors components/venue-chat/search-result-card.tsx exactly
 * ------------------------------------------------------------------------ */
function PreviewCard({
  draft,
  cover,
  location,
  level,
}: {
  draft: ListingDraft
  cover: string | null
  location: string
  level: string | null
}) {
  return (
    <div className="max-w-[300px] mx-auto">
      <div className="group relative bg-white border border-[#e8bdb6]/60 rounded-xl overflow-hidden shadow-sm flex flex-col">
        {/* Quick actions (static — for visual parity) */}
        <div className="absolute top-2 left-2 z-10 flex gap-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f9f9f9]/95 text-[#9e0000] backdrop-blur shadow-sm">
            <Heart size={14} />
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f9f9f9]/95 text-[#9e0000] backdrop-blur shadow-sm">
            <Scale size={14} />
          </span>
        </div>

        <div className="h-36 w-full relative overflow-hidden bg-[#e8e8e8] shrink-0">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover || "/placeholder.svg"} alt={draft.name ?? "Venue"} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#bda5a0]">
              <ImageIcon size={28} aria-hidden />
            </div>
          )}
          {level && (
            <span className="absolute top-2 right-2 bg-[#f9f9f9]/95 backdrop-blur px-2 py-0.5 rounded-full text-xs font-semibold text-[#9e0000] shadow-sm">
              {level}
            </span>
          )}
        </div>

        <div className="p-3.5 flex flex-col gap-1 flex-1">
          <h4 className="font-bold text-[15px] text-[#1a1c1c] leading-snug line-clamp-1">
            {draft.name || <span className="text-[#b8aeac] font-medium">Your venue name</span>}
          </h4>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf6ec] px-1.5 py-0.5 font-semibold text-[#3f8f4f]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3f8f4f]" />
              New
            </span>
            {draft.venue_type && <span className="text-[#5e3f3a] line-clamp-1">{draft.venue_type}</span>}
          </div>

          {(draft.address || location) && (
            <p className="flex items-start gap-1 text-xs text-[#5f5e5e] leading-snug mt-0.5 line-clamp-2">
              <MapPin size={12} className="text-[#9e0000] mt-0.5 shrink-0" />
              {draft.address || location}
            </p>
          )}

          <span className="mt-auto pt-2 text-xs font-semibold text-[#9e0000]">
            View details &amp; photos →
          </span>
        </div>
      </div>
      <p className="text-center text-[11px] text-[#8a7a77] mt-3">
        This is how your venue appears in chat search results.
      </p>
    </div>
  )
}

/* --------------------------------------------------------------------------
 * Detail view — mirrors components/venue-chat/venue-detail-dialog.tsx
 * ------------------------------------------------------------------------ */
function PreviewDetail({
  draft,
  photos,
  cover,
  location,
  level,
}: {
  draft: ListingDraft
  photos: string[]
  cover: string | null
  location: string
  level: string | null
}) {
  const priceRange =
    draft.price_min && draft.price_max
      ? `${formatHKD(draft.price_min)} – ${formatHKD(draft.price_max)}`
      : draft.price_min
        ? `From ${formatHKD(draft.price_min)}`
        : null
  const capacityLabel =
    draft.capacity_min && draft.capacity_max
      ? `${draft.capacity_min}–${draft.capacity_max} guests`
      : draft.capacity_max
        ? `Up to ${draft.capacity_max} guests`
        : null

  return (
    <article className="max-w-xl mx-auto bg-white border border-[#e8bdb6] rounded-xl overflow-hidden shadow-sm">
      {/* Hero */}
      <div className="relative h-52 w-full bg-[#e8e8e8] overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover || "/placeholder.svg"} alt={draft.name ?? "Venue"} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#b8aeac]">
            <ImageIcon size={28} />
            <span className="text-xs font-medium">Add photos to set a cover</span>
          </div>
        )}
        {level && (
          <span className="absolute top-3 right-3 bg-[#f9f9f9]/95 backdrop-blur px-2.5 py-1 rounded-full text-sm font-semibold text-[#9e0000] shadow-sm">
            {level}
          </span>
        )}
        {draft.venue_type && (
          <span className="absolute top-3 left-3 rounded-full bg-[#1a1c1c]/80 text-white text-xs font-semibold px-3 py-1 backdrop-blur">
            {draft.venue_type}
          </span>
        )}
      </div>

      {/* Header */}
      <div className="px-6 pt-5">
        <h2 className="text-xl font-bold text-[#1a1c1c] leading-snug text-balance">
          {draft.name || <span className="text-[#b8aeac]">Your venue name</span>}
        </h2>
        {draft.short_description ? (
          <p className="text-sm text-[#9e0000] font-medium mt-1">{draft.short_description}</p>
        ) : (
          <p className="text-sm text-[#b8aeac] mt-1">A short tagline appears here</p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm">
          <span className="flex items-center gap-1 font-semibold text-[#1a1c1c]">
            <Star size={14} className="fill-[#e8a33d] text-[#e8a33d]" />
            New listing
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="px-6 py-4 flex flex-col gap-2.5 text-sm">
        {(draft.address || location) && (
          <div className="flex items-start gap-2.5 text-[#3a3a3a]">
            <MapPin size={16} className="text-[#9e0000] mt-0.5 shrink-0" />
            <span>{draft.address || location}</span>
          </div>
        )}
        {capacityLabel && (
          <div className="flex items-start gap-2.5 text-[#3a3a3a]">
            <Users size={16} className="text-[#9e0000] mt-0.5 shrink-0" />
            <span>{capacityLabel}</span>
          </div>
        )}
        {priceRange && (
          <div className="flex items-start gap-2.5 text-[#3a3a3a]">
            <Tag size={16} className="text-[#9e0000] mt-0.5 shrink-0" />
            <span>{priceRange}</span>
          </div>
        )}
        {draft.contact_phone && (
          <div className="flex items-center gap-2.5 text-[#3a3a3a]">
            <Phone size={16} className="text-[#9e0000] shrink-0" />
            <span>{draft.contact_phone}</span>
          </div>
        )}
        {draft.contact_email && (
          <div className="flex items-center gap-2.5 text-[#3a3a3a]">
            <Mail size={16} className="text-[#9e0000] shrink-0" />
            <span>{draft.contact_email}</span>
          </div>
        )}
        {draft.website_url && (
          <div className="flex items-center gap-2.5 text-[#9e0000] truncate">
            <Globe size={16} className="shrink-0" />
            <span className="truncate">{draft.website_url}</span>
          </div>
        )}
        <span className="flex items-center gap-2 mt-1 self-start text-sm font-semibold text-[#9e0000]">
          Open in Google Maps
          <ExternalLink size={14} />
        </span>
      </div>

      {/* Description */}
      <div className="px-6 pb-2">
        <span className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-widest">About</span>
        <div className="mt-2">
          {draft.description ? (
            <div className="text-sm leading-relaxed text-[#3a3a3a] whitespace-pre-line">
              {draft.description}
            </div>
          ) : (
            <div className="space-y-2" aria-hidden="true">
              <div className="h-3 rounded bg-[#f0eeed]" />
              <div className="h-3 rounded bg-[#f0eeed] w-[92%]" />
              <div className="h-3 rounded bg-[#f0eeed] w-[78%]" />
            </div>
          )}
        </div>
      </div>

      {/* Amenities */}
      {draft.amenities && draft.amenities.length > 0 && (
        <div className="px-6 pt-3">
          <span className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-widest">Highlights</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {draft.amenities.map((a, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-[#f6f4f3] text-[#3a3a3a] text-xs font-medium px-2.5 py-1"
              >
                <Check size={12} className="text-[#9e0000]" />
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Photo grid (mirrors the Photos tab) */}
      {photos.length > 1 && (
        <div className="px-6 pt-4">
          <span className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-widest">Photos</span>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {photos.slice(1, 10).map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={p || "/placeholder.svg"}
                alt={`Venue photo ${i + 2}`}
                className="aspect-square w-full object-cover rounded-lg bg-[#e8e8e8]"
              />
            ))}
          </div>
        </div>
      )}

      <div className="px-6 py-5 mt-2 border-t border-[#f0eeed]">
        <span className="inline-flex items-center gap-1.5 text-xs text-[#8a7a77]">
          <Clock size={13} />
          This is how planners will see your full listing.
        </span>
      </div>
    </article>
  )
}
