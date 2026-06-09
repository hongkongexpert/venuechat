const SERPAPI_BASE = "https://serpapi.com/search.json"
// Centered on Victoria Harbour, Hong Kong, zoom 11
const HK_LL = "@22.3193,114.1694,11z"

export interface SerpVenue {
  id: string
  placeId?: string
  position?: number
  name: string
  district: string
  address?: string
  price?: string
  type?: string
  types?: string[]
  thumbnail?: string
  gps?: { lat: number; lng: number }
  phone?: string
  website?: string
  hours?: string
  description?: string
  openState?: string
}

export interface SerpPhoto {
  image: string
  thumbnail?: string
  title?: string
}

export interface SerpPost {
  position?: number
  title?: string
  description?: string
  link?: string
  thumbnails?: string[]
  source?: string
  sourceLogo?: string
  time?: string
  postedAtText?: string
  onlineLink?: string
  onlineLinkText?: string
}

export interface SerpDirectionStep {
  travelMode?: string
  via?: string
  startTime?: string
  endTime?: string
  formattedDistance?: string
  formattedDuration?: string
  cost?: number
  currency?: string
  extensions?: string[]
}

export interface SerpDirectionsResult {
  directions: SerpDirectionStep[]
}

function getKey(): string {
  const key = process.env.SERPAPI_KEY
  if (!key) {
    throw new Error("SERPAPI_KEY environment variable is not set")
  }
  return key
}

const HK_DISTRICTS = [
  "Lan Kwai Fong",
  "Soho",
  "Sheung Wan",
  "Sai Ying Pun",
  "Kennedy Town",
  "Central",
  "Admiralty",
  "Wan Chai",
  "Causeway Bay",
  "Happy Valley",
  "North Point",
  "Quarry Bay",
  "Tai Koo",
  "Shau Kei Wan",
  "Aberdeen",
  "Wong Chuk Hang",
  "Repulse Bay",
  "Stanley",
  "The Peak",
  "Tsim Sha Tsui",
  "Jordan",
  "Yau Ma Tei",
  "Mong Kok",
  "Prince Edward",
  "Kowloon Tong",
  "Kowloon Bay",
  "Kwun Tong",
  "Hung Hom",
  "Sham Shui Po",
  "Cheung Sha Wan",
  "Sha Tin",
  "Tsuen Wan",
  "Tuen Mun",
  "Yuen Long",
  "Tai Po",
  "Sai Kung",
  "Tseung Kwan O",
  "Discovery Bay",
  "Tung Chung",
  "Lantau",
  "Kowloon",
  "Hong Kong Island",
  "New Territories",
]

function deriveDistrict(address?: string, type?: string): string {
  if (address) {
    for (const district of HK_DISTRICTS) {
      if (address.toLowerCase().includes(district.toLowerCase())) {
        return district
      }
    }
  }
  return type ?? "Hong Kong"
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapVenue(r: any): SerpVenue {
  const address: string | undefined = r.address
  const gps = r.gps_coordinates
  return {
    id: r.data_id ?? r.place_id ?? String(r.position ?? Math.random()),
    placeId: r.place_id,
    position: r.position,
    name: r.title ?? "Unnamed venue",
    district: deriveDistrict(address, r.type),
    address,
    price: r.price,
    type: r.type,
    types: r.types,
    thumbnail: r.thumbnail,
    gps: gps ? { lat: gps.latitude, lng: gps.longitude } : undefined,
    phone: r.phone,
    website: r.website,
    hours: r.hours ?? r.operating_hours?.[Object.keys(r.operating_hours ?? {})[0]],
    description: r.description,
    openState: r.open_state,
  }
}

export interface SearchVenuesOptions {
  /** User coordinates for "near me" searches, e.g. { lat, lng } */
  coords?: { lat: number; lng: number }
  /** Zoom level for the ll parameter (higher = tighter radius). Default 11. */
  zoom?: number
}

export async function searchVenues(
  query: string,
  options: SearchVenuesOptions = {},
): Promise<SerpVenue[]> {
  const normalized = query.toLowerCase().includes("hong kong")
    ? query
    : `${query} Hong Kong`

  // When the user wants results near them, center the map on their coords
  // with a tighter zoom so Google Maps ranks by proximity.
  const ll = options.coords
    ? `@${options.coords.lat},${options.coords.lng},${options.zoom ?? 14}z`
    : HK_LL

  const params = new URLSearchParams({
    engine: "google_maps",
    type: "search",
    q: normalized,
    ll,
    hl: "en",
    google_domain: "google.com.hk",
    api_key: getKey(),
  })

  const res = await fetch(`${SERPAPI_BASE}?${params.toString()}`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`SerpAPI request failed with status ${res.status}`)
  }

  const data = await res.json()

  if (data.error) {
    throw new Error(data.error)
  }

  const results: any[] =
    data.local_results ??
    (data.place_results ? [data.place_results] : [])

  return results.map(mapVenue)
}

export async function getVenuePhotos(dataId: string): Promise<SerpPhoto[]> {
  const params = new URLSearchParams({
    engine: "google_maps_photos",
    data_id: dataId,
    hl: "en",
    api_key: getKey(),
  })

  const res = await fetch(`${SERPAPI_BASE}?${params.toString()}`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`SerpAPI photos request failed with status ${res.status}`)
  }

  const data = await res.json()

  if (data.error) {
    throw new Error(data.error)
  }

  const photos: any[] = data.photos ?? []

  return photos
    .map((p) => ({
      image: p.image ?? p.thumbnail,
      thumbnail: p.thumbnail,
      title: p.title,
    }))
    .filter((p: SerpPhoto) => Boolean(p.image))
}

export async function getVenuePosts(dataId: string): Promise<SerpPost[]> {
  const params = new URLSearchParams({
    engine: "google_maps_posts",
    data_id: dataId,
    api_key: getKey(),
  })

  const res = await fetch(`${SERPAPI_BASE}?${params.toString()}`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`SerpAPI posts request failed with status ${res.status}`)
  }

  const data = await res.json()
  if (data.error) throw new Error(data.error)

  return (data.posts ?? []).map((p: any) => ({
    position: p.position,
    title: p.title,
    description: p.description,
    link: p.link,
    thumbnails: p.thumbnails,
    source: p.source,
    sourceLogo: p.source_logo,
    time: p.time,
    postedAtText: p.posted_at_text,
    onlineLink: p.online_link,
    onlineLinkText: p.online_link_text,
  }))
}

export async function getDirections(args: {
  startAddr?: string
  startCoords?: string
  endAddr?: string
  endCoords?: string
  endDataId?: string
  travelMode?: string
}): Promise<SerpDirectionsResult> {
  const params = new URLSearchParams({
    engine: "google_maps_directions",
    hl: "en",
    gl: "hk",
    travel_mode: args.travelMode ?? "6",
    api_key: getKey(),
  })

  if (args.startCoords) params.set("start_coords", args.startCoords)
  else if (args.startAddr) params.set("start_addr", args.startAddr)

  if (args.endDataId) params.set("end_data_id", args.endDataId)
  else if (args.endCoords) params.set("end_coords", args.endCoords)
  else if (args.endAddr) params.set("end_addr", args.endAddr)

  const res = await fetch(`${SERPAPI_BASE}?${params.toString()}`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`SerpAPI directions request failed with status ${res.status}`)
  }

  const data = await res.json()
  if (data.error) throw new Error(data.error)

  const directions: SerpDirectionStep[] = (data.directions ?? []).map(
    (d: any) => ({
      travelMode: d.travel_mode,
      via: d.via,
      startTime: d.start_time,
      endTime: d.end_time,
      formattedDistance: d.formatted_distance,
      formattedDuration: d.formatted_duration,
      cost: d.cost,
      currency: d.currency,
      extensions: d.extensions,
    }),
  )

  return { directions }
}
