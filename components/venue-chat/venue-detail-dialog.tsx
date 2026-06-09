"use client"

import useSWR from "swr"
import { MapPin, Phone, Globe, Clock, ExternalLink, ImageIcon } from "lucide-react"
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
        <div className="flex items-center justify-center gap-2 py-12 text-[#8a7a77]">
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
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ImageIcon size={28} className="text-[#e0d8d6] mb-3" />
          <p className="text-sm text-[#8a7a77]">No additional photos available.</p>
        </div>
      )}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.slice(0, 12).map((photo, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={photo.image || "/placeholder.svg"}
              alt={photo.title ?? `${name} photo ${i + 1}`}
              className="aspect-square w-full rounded-xl object-cover bg-[#f0eeed]"
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
      <DialogContent className="max-w-[92vw] sm:max-w-4xl w-full max-h-[92vh] overflow-hidden bg-white border-0 p-0 gap-0 rounded-2xl shadow-2xl flex flex-col sm:flex-row">
        {venue && (
          <>
            {/* LEFT — full-bleed photo hero */}
            <div className="relative sm:w-80 lg:w-96 shrink-0 overflow-hidden min-h-[220px] sm:min-h-0 bg-[#1a0a0a]">
              {venue.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={venue.thumbnail}
                  alt={venue.name}
                  className="absolute inset-0 h-full w-full object-cover opacity-70"
                />
              ) : null}
              {/* Bottom-to-top gradient for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0505] via-[#0d0505]/50 to-transparent" />

              {/* Top badge */}
              {venue.price && (
                <div className="absolute top-5 left-5">
                  <span className="rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white tracking-wide">
                    {venue.price}
                  </span>
                </div>
              )}

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
                {venue.type && (
                  <span className="text-xs font-bold uppercase tracking-widest text-[#f5c0b0]">
                    {venue.type}
                  </span>
                )}
                <h2 className="text-2xl font-bold text-white leading-snug text-balance">
                  {venue.name}
                </h2>
                {venue.district && (
                  <div className="flex items-center gap-1.5 text-sm text-white/70">
                    <MapPin size={13} className="text-[#f5a0a0] shrink-0" />
                    {venue.district}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT — scrollable content */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <DialogHeader className="sr-only">
                <DialogTitle>{venue.name}</DialogTitle>
                <DialogDescription>
                  Photos, updates and directions for {venue.name} in {venue.district}.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto vc-scroll">
                {/* Contact details */}
                <div className="px-7 pt-6 pb-5 flex flex-col gap-3 border-b border-[#f0ebe9]">
                  {venue.address && (
                    <div className="flex items-start gap-3 text-[#2a2a2a]">
                      <MapPin size={16} className="text-[#9e0000] mt-0.5 shrink-0" />
                      <span className="text-sm leading-relaxed">{venue.address}</span>
                    </div>
                  )}
                  {venue.openState && (
                    <div className="flex items-center gap-3 text-[#2a2a2a]">
                      <Clock size={16} className="text-[#9e0000] shrink-0" />
                      <span className="text-sm">{venue.openState}</span>
                    </div>
                  )}
                  {venue.phone && (
                    <a
                      href={`tel:${venue.phone}`}
                      className="flex items-center gap-3 text-[#2a2a2a] hover:text-[#9e0000] transition-colors group"
                    >
                      <Phone size={16} className="text-[#9e0000] shrink-0" />
                      <span className="text-sm group-hover:underline">{venue.phone}</span>
                    </a>
                  )}
                  {venue.website && (
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-[#9e0000] hover:underline truncate"
                    >
                      <Globe size={16} className="shrink-0" />
                      <span className="text-sm truncate">{venue.website}</span>
                    </a>
                  )}
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start flex items-center gap-1.5 text-xs font-semibold text-[#9e0000] hover:underline mt-1"
                  >
                    Open in Google Maps
                    <ExternalLink size={12} />
                  </a>
                  <div className="mt-1">
                    <VenueDetailActions venue={venue} />
                  </div>
                </div>

                {/* Tabbed content */}
                <div className="px-7 py-5">
                  <Tabs defaultValue="photos">
                    <TabsList className="w-full bg-[#f6f2f1] p-1 rounded-xl h-auto gap-1">
                      <TabsTrigger
                        value="photos"
                        className="flex-1 rounded-lg py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#9e0000] text-[#8a7a77]"
                      >
                        Photos
                      </TabsTrigger>
                      <TabsTrigger
                        value="updates"
                        className="flex-1 rounded-lg py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#9e0000] text-[#8a7a77]"
                      >
                        Updates
                      </TabsTrigger>
                      <TabsTrigger
                        value="directions"
                        className="flex-1 rounded-lg py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#9e0000] text-[#8a7a77]"
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
