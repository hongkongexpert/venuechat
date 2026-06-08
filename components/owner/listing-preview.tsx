"use client"

import Image from "next/image"
import { MapPin, Users, Tag, Mail, Phone, Globe, Check, ImageIcon } from "lucide-react"
import type { ListingDraft } from "@/lib/listing-template"

function formatHKD(n: number | null) {
  if (n === null || n === undefined) return null
  return `HK$${n.toLocaleString()}`
}

interface ListingPreviewProps {
  draft: ListingDraft
  photos: string[]
}

export function ListingPreview({ draft, photos }: ListingPreviewProps) {
  const cover = photos[0] ?? null
  const priceLabel =
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
  const location = [draft.district, draft.area].filter(Boolean).join(", ")

  return (
    <article className="rounded-2xl border border-[#eceae9] bg-white overflow-hidden shadow-sm">
      {/* Cover */}
      <div className="relative aspect-[16/9] bg-[#f6f4f3] flex items-center justify-center overflow-hidden">
        {cover ? (
          <Image
            src={cover || "/placeholder.svg"}
            alt={draft.name ? `${draft.name} cover photo` : "Venue cover photo"}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#b8aeac]">
            <ImageIcon size={28} />
            <span className="text-xs font-medium">Drop photos to add a cover</span>
          </div>
        )}
        {draft.venue_type && (
          <span className="absolute top-3 left-3 rounded-full bg-[#1a1c1c]/80 text-white text-xs font-semibold px-3 py-1 backdrop-blur">
            {draft.venue_type}
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto border-b border-[#f0eeed]">
          {photos.slice(1).map((p, i) => (
            <div
              key={i}
              className="relative h-14 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-[#f6f4f3]"
            >
              <Image
                src={p || "/placeholder.svg"}
                alt={`Venue photo ${i + 2}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ))}
        </div>
      )}

      <div className="p-5">
        <h2 className="text-xl font-bold text-[#1a1c1c] text-balance">
          {draft.name || <span className="text-[#b8aeac]">Your venue name</span>}
        </h2>
        {draft.short_description ? (
          <p className="text-sm text-[#9e0000] font-medium mt-1">{draft.short_description}</p>
        ) : (
          <p className="text-sm text-[#b8aeac] mt-1">A short tagline will appear here</p>
        )}

        {/* Key facts */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-[#5e3f3a]">
          {location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} className="text-[#9e0000]" />
              {location}
            </span>
          )}
          {capacityLabel && (
            <span className="inline-flex items-center gap-1.5">
              <Users size={15} className="text-[#9e0000]" />
              {capacityLabel}
            </span>
          )}
          {priceLabel && (
            <span className="inline-flex items-center gap-1.5">
              <Tag size={15} className="text-[#9e0000]" />
              {priceLabel}
            </span>
          )}
        </div>

        {/* Description */}
        <div className="mt-4">
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

        {/* Amenities */}
        {draft.amenities && draft.amenities.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8a7a77] mb-2">
              Highlights
            </h3>
            <div className="flex flex-wrap gap-2">
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

        {/* Contact */}
        {(draft.contact_email || draft.contact_phone || draft.website_url) && (
          <div className="mt-4 pt-4 border-t border-[#f0eeed] flex flex-col gap-1.5 text-sm text-[#5e3f3a]">
            {draft.contact_email && (
              <span className="inline-flex items-center gap-2">
                <Mail size={14} className="text-[#9e0000]" />
                {draft.contact_email}
              </span>
            )}
            {draft.contact_phone && (
              <span className="inline-flex items-center gap-2">
                <Phone size={14} className="text-[#9e0000]" />
                {draft.contact_phone}
              </span>
            )}
            {draft.website_url && (
              <span className="inline-flex items-center gap-2">
                <Globe size={14} className="text-[#9e0000]" />
                {draft.website_url}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
