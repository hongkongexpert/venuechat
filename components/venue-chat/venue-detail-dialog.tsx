"use client"

import useSWR from "swr"
import { Star, MapPin, Phone, Globe, Clock, ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { VenueReviewsTab } from "./venue-reviews-tab"
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
      <span className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-widest">
        Photos
      </span>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-10 text-[#5f5e5e]">
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
        <p className="text-sm text-[#5f5e5e] py-4">
          No additional photos available.
        </p>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
          {photos.slice(0, 12).map((photo, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={photo.image || "/placeholder.svg"}
              alt={photo.title ?? `${name} photo ${i + 1}`}
              className="aspect-square w-full object-cover rounded-lg bg-[#e8e8e8]"
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
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto vc-scroll bg-[#ffffff] border-[#e8bdb6] p-0 gap-0">
        {venue && (
          <>
            {/* Hero image */}
            <div className="relative h-56 w-full bg-[#e8e8e8] overflow-hidden rounded-t-lg">
              {venue.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={venue.thumbnail || "/placeholder.svg"}
                  alt={venue.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#926e69]">
                  No image
                </div>
              )}
              {venue.price && (
                <span className="absolute top-3 right-3 bg-[#f9f9f9]/95 backdrop-blur px-2.5 py-1 rounded-full text-sm font-semibold text-[#9e0000] shadow-sm">
                  {venue.price}
                </span>
              )}
            </div>

            <DialogHeader className="px-6 pt-5 text-left">
              <DialogTitle className="text-xl font-bold text-[#1a1c1c] leading-snug">
                {venue.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Photos, reviews, updates and directions for {venue.name} in{" "}
                {venue.district}.
              </DialogDescription>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm">
                {venue.rating != null && (
                  <span className="flex items-center gap-1 font-semibold text-[#1a1c1c]">
                    <Star size={14} className="fill-[#e8a33d] text-[#e8a33d]" />
                    {venue.rating}
                    {venue.reviews != null && (
                      <span className="text-[#5f5e5e] font-normal">
                        ({venue.reviews.toLocaleString()})
                      </span>
                    )}
                  </span>
                )}
                {venue.type && (
                  <span className="text-[#5e3f3a]">{venue.type}</span>
                )}
              </div>
            </DialogHeader>

            {/* Meta details */}
            <div className="px-6 py-4 flex flex-col gap-2.5 text-sm">
              {venue.address && (
                <div className="flex items-start gap-2.5 text-[#3a3a3a]">
                  <MapPin size={16} className="text-[#9e0000] mt-0.5 shrink-0" />
                  <span>{venue.address}</span>
                </div>
              )}
              {venue.openState && (
                <div className="flex items-start gap-2.5 text-[#3a3a3a]">
                  <Clock size={16} className="text-[#9e0000] mt-0.5 shrink-0" />
                  <span>{venue.openState}</span>
                </div>
              )}
              {venue.phone && (
                <a
                  href={`tel:${venue.phone}`}
                  className="flex items-center gap-2.5 text-[#3a3a3a] hover:text-[#9e0000] transition-colors"
                >
                  <Phone size={16} className="text-[#9e0000] shrink-0" />
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
                  <Globe size={16} className="shrink-0" />
                  <span className="truncate">{venue.website}</span>
                </a>
              )}
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 mt-1 self-start text-sm font-semibold text-[#9e0000] hover:underline"
              >
                Open in Google Maps
                <ExternalLink size={14} />
              </a>

              <VenueDetailActions venue={venue} />
            </div>

            {/* Tabbed content */}
            <div className="px-6 pb-6">
              <Tabs defaultValue="photos">
                <TabsList className="bg-[#f4eceb] !flex !w-full">
                  <TabsTrigger value="photos" className="flex-1 text-xs sm:text-sm">
                    Photos
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="flex-1 text-xs sm:text-sm">
                    Reviews
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
                <TabsContent value="reviews" className="pt-4">
                  <VenueReviewsTab dataId={venue.id} />
                </TabsContent>
                <TabsContent value="updates" className="pt-4">
                  <VenuePostsTab dataId={venue.id} />
                </TabsContent>
                <TabsContent value="directions" className="pt-4">
                  <VenueDirectionsTab venue={venue} />
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
