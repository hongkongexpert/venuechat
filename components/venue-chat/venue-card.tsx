import Image from "next/image"
import { TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

export type PriceLevel = "$" | "$$" | "$$$" | "$$$$"

export interface Venue {
  id: string
  name: string
  district: string
  description?: string
  price: PriceLevel
  image: string
  badge?: string
  ctaLabel?: string
  topRated?: boolean
  searchQuery?: string
}

interface VenueCardProps {
  venue: Venue
  variant?: "grid" | "scroll"
  onSelect?: (query: string) => void
}

export function VenueCard({ venue, variant = "grid", onSelect }: VenueCardProps) {
  const isScroll = variant === "scroll"
  const handleActivate = () => onSelect?.(venue.searchQuery ?? venue.name)

  return (
    <article
      onClick={handleActivate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleActivate()
        }
      }}
      className={cn(
        "group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#9e0000]/40 rounded-xl",
        isScroll && "min-w-[280px] max-w-[280px] flex-shrink-0 snap-start"
      )}
    >
      {isScroll ? (
        /* Scroll card: image + info in a bordered card */
        <div className="bg-[#ffffff] border border-[#e8bdb6]/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="h-40 w-full relative overflow-hidden bg-[#e8e8e8]">
            <Image
              src={venue.image}
              alt={venue.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="280px"
            />
            {venue.topRated && (
              <div className="absolute top-2 right-2 bg-[#f9f9f9]/90 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <TrendingUp size={12} className="text-[#9e0000]" aria-hidden />
                <span className="text-xs font-semibold text-[#1a1c1c]">Top Rated</span>
              </div>
            )}
          </div>
          <div className="p-4 flex flex-col gap-1">
            <h4 className="font-bold text-base text-[#1a1c1c] truncate leading-snug">
              {venue.name}
            </h4>
            {venue.description && (
              <p className="text-sm text-[#5f5e5e] truncate leading-snug">
                {venue.description}
              </p>
            )}
            <button className="mt-3 w-full py-2 px-4 border border-[#9e0000] text-[#9e0000] text-sm font-semibold rounded-full hover:bg-[#9e0000]/5 transition-colors">
              {venue.ctaLabel ?? "View venue"}
            </button>
          </div>
        </div>
      ) : (
        /* Grid card: image above, info below */
        <>
          <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#e8e8e8] mb-3">
            <Image
              src={venue.image}
              alt={venue.name}
              width={400}
              height={250}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
          <div className="flex justify-between items-start px-0.5">
            <div>
              <h4 className="font-semibold text-base text-[#1a1c1c] leading-snug">
                {venue.name}
              </h4>
              <p className="text-sm text-[#5e3f3a] mt-0.5">{venue.district}</p>
            </div>
            <span className="text-sm font-semibold text-[#9e0000] shrink-0 ml-2 mt-0.5">
              {venue.price}
            </span>
          </div>
        </>
      )}
    </article>
  )
}
