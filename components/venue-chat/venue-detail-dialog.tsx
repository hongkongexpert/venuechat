"use client"

import useSWR from "swr"
import { MapPin, Phone, Globe, Clock, ExternalLink } from "lucide-react"
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
        <div className="flex items-center justify-center gap-2 py-10 text-[#8a7a77]">
          <Spinner className="size-4" />
          <span className="text-sm">Loading photos…</span>
        </div>
      )}
      {error && (
        <p className="text-sm text-[#9e0000] py-4">
          Couldn&apos;t load photos for this venue.
        </p>
      )}
      {!isLoading && !error && photos.length === 0 && (
        <p className="text-sm text-[#8a7a77] py-4">No additional photos available.</p>
      )}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
          {photos.slice(0, 12).map((photo, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={photo.image || "/placeholder.svg"}
              alt={photo.title ?? `${name} photo ${i + 1}`}
              className="aspect-square w-full object-cover rounded-xl bg-[#e8e8e8]"
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
      {/* Wide two-column panel */}
      <DialogContent className="max-w-3xl w-full max-h-[92vh] overflow-hidden bg-white border-0 p-0 gap-0 rounded-2xl shadow-2xl flex flex-col sm:flex-row">
        {venue && (
          <>
            {/* LEFT — dark hero column */}
            <div className="relative sm:w-56 md:w-64 shrink-0 bg-[#1a0a0a] overflow-hidden flex flex-col min-h-[180px] sm:min-h-0">
              {venue.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={venue.thumbnail}
                  alt={venue.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
              ) : null}
              {/* dark vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a0a] via-[#1a0a0a]/60 to-transparent" />

              <div className="relative flex flex-col justify-end h-full p-6 gap-3">
                {venue.price && (
                  <span className="self-start rounded-full border border-[#9e0000]/60 bg-[#9e0000]/20 px-3 py-0.5 text-xs font-semibold text-[#f5c0b0] tracking-wide">
                    {venue.price}
                  </span>
                )}
                <h2 className="text-xl font-bold text-white leading-snug text-balance">
                  {venue.name}
                </h2>
                {venue.type && (
                  <p className="text-sm text-[#c8b4b0]">{venue.type}</p>
                )}
                {venue.district && (
                  <span className="flex items-center gap-1.5 text-xs text-[#9e8080]">
                    <MapPin size={12} className="text-[#9e0000]" />
                    {venue.district}
                  </span>
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
                <div className="px-6 pt-5 pb-4 flex flex-col gap-2.5 text-sm border-b border-[#f0ebe9]">
                  {venue.address && (
                    <div className="flex items-start gap-2.5 text-[#3a3a3a]">
                      <MapPin size={15} className="text-[#9e0000] mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{venue.address}</span>
                    </div>
                  )}
                  {venue.openState && (
                    <div className="flex items-start gap-2.5 text-[#3a3a3a]">
                      <Clock size={15} className="text-[#9e0000] mt-0.5 shrink-0" />
                      <span>{venue.openState}</span>
                    </div>
                  )}
                  {venue.phone && (
                    <a
                      href={`tel:${venue.phone}`}
                      className="flex items-center gap-2.5 text-[#3a3a3a] hover:text-[#9e0000] transition-colors"
                    >
                      <Phone size={15} className="text-[#9e0000] shrink-0" />
                      <span>{venue.phone}</span>
                    </a>
                  )}
                  {venue.website && (
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-[#9e0000] hover:underline truncate"
                    >
                      <Globe size={15} className="shrink-0" />
                      <span className="truncate">{venue.website}</span>
                    </a>
                  )}
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 self-start text-xs font-semibold text-[#9e0000] hover:underline"
                  >
                    Open in Google Maps
                    <ExternalLink size={12} />
                  </a>
                  <VenueDetailActions venue={venue} />
                </div>

                {/* Tabbed content */}
                <div className="px-6 py-4">
                  <Tabs defaultValue="photos">
                    <TabsList className="bg-[#f4eceb] !flex !w-full">
                      <TabsTrigger value="photos" className="flex-1 text-xs sm:text-sm">
                        Photos
                      </TabsTrigger>
                      <TabsTrigger value="updates" className="flex-1 text-xs sm:text-sm">
                        Updates
                      </TabsTrigger>
                      <TabsTrigger value="directions" className="flex-1 text-xs sm:text-sm">
                        Directions
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="photos" className="pt-4">
                      <PhotosTab dataId={venue.id} name={venue.name} />
                    </TabsContent>
                    <TabsContent value="updates" className="pt-4">
                      <VenuePostsTab dataId={venue.id} />
                    </TabsContent>
                    <TabsContent value="directions" className="pt-4">
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
