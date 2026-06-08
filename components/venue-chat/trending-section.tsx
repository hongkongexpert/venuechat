import { VenueCard, type Venue } from "./venue-card"

const GRID_VENUES: Venue[] = [
  {
    id: "victoria-peak",
    name: "Victoria Peak Lookout",
    district: "Peak District",
    price: "$$$",
    image: "/venues/victoria-peak.png",
    searchQuery: "event venue The Peak Victoria Peak",
  },
  {
    id: "soho-loft",
    name: "Soho Creative Loft",
    district: "Central & Western",
    price: "$$",
    image: "/venues/soho-loft.png",
    searchQuery: "creative loft event space Soho Central",
  },
  {
    id: "peninsula-suite",
    name: "The Peninsula Suite",
    district: "Tsim Sha Tsui",
    price: "$$$$",
    image: "/venues/peninsula-suite.png",
    searchQuery: "luxury hotel event venue Tsim Sha Tsui",
  },
]

const SCROLL_VENUES: Venue[] = [
  {
    id: "skyline-rooftop",
    name: "Skyline Rooftops",
    district: "Various",
    description: "Breathtaking views for cocktails",
    price: "$$$",
    image: "/venues/skyline-rooftop.png",
    topRated: true,
    ctaLabel: "View collection",
    searchQuery: "rooftop bar venue with view",
  },
  {
    id: "wedding-banquet",
    name: "Wedding Banquets",
    district: "Various",
    description: "Elegant spaces for your big day",
    price: "$$$",
    image: "/venues/wedding-banquet.png",
    ctaLabel: "Explore venues",
    searchQuery: "wedding banquet venue",
  },
  {
    id: "creative-studio",
    name: "Creative Studios",
    district: "Various",
    description: "Unique spaces for workshops",
    price: "$$",
    image: "/venues/creative-studio.png",
    ctaLabel: "Book a tour",
    searchQuery: "creative studio space for workshops",
  },
]

interface TrendingSectionProps {
  variant?: "grid" | "scroll"
  onSelect?: (query: string) => void
}

export function TrendingSection({ variant = "grid", onSelect }: TrendingSectionProps) {
  const venues = variant === "scroll" ? SCROLL_VENUES : GRID_VENUES

  return (
    <section aria-labelledby="trending-heading" className="w-full">
      {variant === "grid" ? (
        <>
          <h3
            id="trending-heading"
            className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-widest mb-5"
          >
            Trending in Hong Kong
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} variant="grid" onSelect={onSelect} />
            ))}
          </div>
        </>
      ) : (
        <>
          <h3
            id="trending-heading"
            className="text-2xl font-bold text-[#1a1c1c] mb-4 leading-tight"
          >
            Trending in Hong Kong
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 vc-scroll snap-x scroll-smooth">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} variant="scroll" onSelect={onSelect} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
