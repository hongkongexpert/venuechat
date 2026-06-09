"use client"

import useSWR from "swr"
import { MapPin, Phone, Globe, Clock, ExternalLink, ImageIcon, ChevronRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { VenuePostsTab } from "./venue-posts-tab"
import { VenueDirectionsTab } from "./venue-directions-tab"
import { VenueDetailActions } from "./venue-detail-actions"
import type { SerpVenue, SerpPhoto } from "@/lib/serpapi"

interface VenueDetailDialogProps {
  venue: SerpVenue | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to load photos")
    return r.json()
  })

function PhotosTab({ dataId, name }: { dataId: string; name: string }) {
  const { data, error, isLoading } = useSWR<{ photos: SerpPhoto[] }>(
    `/api/venues/photos?data_id=${encodeURIComponent(dataId)}`,
    fetcher,
  )
  const photos = data?.photos ?? []

  return (
    <div>
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-[#8a7a77]">
          <Spinner className="size-4" />
          <span className="text-sm">Loading photos…</span>
        </div>
      )}
      {error && (
        <p className="py-4 text-sm text-[#9e0000]">
          Couldn&apos;t load photos for this venue.
        </p>
      )}
      {!isLoading && !error && photos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ImageIcon size={28} className="text-[#e0d8d6] mb-3" />
          <p className="text-sm text-[#8a7a77]">No additional photos available.</p>
        </div>
      )}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {photos.slice(0, 12).map((photo, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={photo.image || "/placeholder.svg"}
              alt={photo.title ?? `${name} photo ${i + 1}`}
              className="aspect-[4/3] w-full rounded-xl object-cover bg-[#f0eeed]"
              loading="lazy"
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function VenueDetailDialog({
  venue,
  open,
  onOpenChange,
}: VenueDetailDialogProps) {
  const mapsHref = venue?.gps
    ? `https://www.google.com/maps/search/?api=1&query=${venue.gps.lat},${venue.gps.lng}`
    : venue
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.name)}`
    : "#"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] sm:max-w-5xl w-full max-h-[92vh] overflow-hidden bg-white border-0 p-0 gap-0 rounded-2xl shadow-2xl flex flex-col sm:flex-row">
        {venue && (
          <>
            {/* ── LEFT — cinematic hero panel ── */}
            <div className="relative sm:w-[340px] lg:w-[380px] shrink-0 overflow-hidden min-h-[260px] sm:min-h-0 bg-[#0d0505]">
              {venue.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={venue.thumbnail}
                  alt={venue.name}
                  className="absolute inset-0 h-full w-full object-cover opacity-80 scale-105"
                />
              ) : null}

              {/* Cinematic gradient — strong dark bottom, subtle top fade */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0505] via-[#0d0505]/60 to-[#0d0505]/10" />
              {/* Left-edge vignette for seamless bleed into right panel */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0d0505]/20" />

              {/* Price badge — top left */}
              {venue.price && (
                <div className="absolute top-5 left-5 z-10">
                  <span className="inline-flex items-center rounded-full border border-white/25 bg-black/35 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-white tracking-wider shadow-sm">
                    {venue.price}
                  </span>
                </div>
              )}

              {/* Bottom content */}
              <div className="absolute bottom-0 left-0 right-0 p-7 flex flex-col gap-2 z-10">
                {venue.type && (
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#f5b8a8]">
                    {venue.type}
                  </span>
                )}
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight text-balance drop-shadow-sm">
                  {venue.name}
                </h2>
                {venue.district && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin size={13} className="text-[#f5a0a0] shrink-0" />
                    <span className="text-sm text-white/75 font-medium">{venue.district}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT — scrollable info & tabs ── */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
              <DialogHeader className="sr-only">
                <DialogTitle>{venue.name}</DialogTitle>
                <DialogDescription>
                  Photos, updates and directions for {venue.name} in {venue.district}.
                </DialogDescription>
              </DialogHeader>

              {/* Action row — Save / Compare / Enquire */}
              <div className="px-7 pt-6 pb-5 border-b border-[#f0ebe9]">
                <VenueDetailActions venue={venue} />
              </div>

              <div className="flex-1 overflow-y-auto vc-scroll">
                {/* Contact / venue info */}
                <div className="px-7 py-5 flex flex-col gap-3.5 border-b border-[#f0ebe9]">
                  {venue.address && (
                    <a
                      href={mapsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3.5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fdecea]">
                        <MapPin size={15} className="text-[#9e0000]" />
                      </span>
                      <span className="text-sm leading-relaxed text-[#2a2a2a] group-hover:text-[#9e0000] transition-colors pt-1">
                        {venue.address}
                      </span>
                    </a>
                  )}
                  {venue.openState && (
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fdecea]">
                        <Clock size={15} className="text-[#9e0000]" />
                      </span>
                      <span className="text-sm text-[#2a2a2a]">{venue.openState}</span>
                    </div>
                  )}
                  {venue.phone && (
                    <a
                      href={`tel:${venue.phone}`}
                      className="group flex items-center gap-3.5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fdecea]">
                        <Phone size={15} className="text-[#9e0000]" />
                      </span>
                      <span className="text-sm text-[#2a2a2a] group-hover:text-[#9e0000] group-hover:underline transition-colors">
                        {venue.phone}
                      </span>
                    </a>
                  )}
                  {venue.website && (
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3.5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fdecea]">
                        <Globe size={15} className="text-[#9e0000]" />
                      </span>
                      <span className="text-sm text-[#9e0000] truncate group-hover:underline">
                        {venue.website.replace(/^https?:\/\/(www\.)?/, "")}
                      </span>
                    </a>
                  )}
                  {/* Maps CTA */}
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start mt-1 flex items-center gap-1.5 rounded-lg border border-[#e8bdb6] bg-[#fdf9f8] px-4 py-2 text-xs font-bold text-[#9e0000] hover:bg-[#fdecea] transition-colors"
                  >
                    <ExternalLink size={13} />
                    Open in Google Maps
                    <ChevronRight size={13} />
                  </a>
                </div>

                {/* Tabbed content */}
                <div className="px-7 py-6">
                  <Tabs defaultValue="photos">
                    <TabsList className="w-full bg-[#f6f2f1] p-1 rounded-xl h-auto gap-1">
                      <TabsTrigger
                        value="photos"
                        className="flex-1 rounded-lg py-2.5 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#9e0000] text-[#8a7a77] transition-all"
                      >
                        Photos
                      </TabsTrigger>
                      <TabsTrigger
                        value="updates"
                        className="flex-1 rounded-lg py-2.5 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#9e0000] text-[#8a7a77] transition-all"
                      >
                        Updates
                      </TabsTrigger>
                      <TabsTrigger
                        value="directions"
                        className="flex-1 rounded-lg py-2.5 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#9e0000] text-[#8a7a77] transition-all"
                      >
                        Directions
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="photos" className="mt-5">
                      <PhotosTab dataId={venue.id} name={venue.name} />
                    </TabsContent>
                    <TabsContent value="updates" className="mt-5">
                      <VenuePostsTab dataId={venue.id} />
                    </TabsContent>
                    <TabsContent value="directions" className="mt-5">
                      <VenueDirectionsTab venue={venue} />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
