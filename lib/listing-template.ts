import { z } from "zod"

/**
 * The canonical listing template. Every venue listing follows this exact
 * shape so listings stay consistent across the platform, even when an owner
 * only provides some of the information. Missing fields stay null and the UI
 * renders a consistent template either way.
 */
export const listingDraftSchema = z.object({
  name: z.string().nullable().describe("The venue name"),
  short_description: z
    .string()
    .nullable()
    .describe("A punchy one-line tagline, max ~120 chars"),
  description: z
    .string()
    .nullable()
    .describe("A polished 2-4 paragraph description written in an inviting, professional tone"),
  venue_type: z
    .string()
    .nullable()
    .describe("e.g. Rooftop Bar, Banquet Hall, Restaurant, Gallery, Studio, Garden"),
  district: z.string().nullable().describe("Hong Kong district, e.g. Central, Tsim Sha Tsui"),
  area: z.string().nullable().describe("Region, e.g. Hong Kong Island, Kowloon, New Territories"),
  address: z.string().nullable().describe("Full street address if provided"),
  capacity_min: z.number().int().nullable().describe("Minimum guest capacity"),
  capacity_max: z.number().int().nullable().describe("Maximum guest capacity"),
  price_min: z.number().int().nullable().describe("Starting price in HKD (whole dollars)"),
  price_max: z.number().int().nullable().describe("Upper price in HKD (whole dollars)"),
  amenities: z
    .array(z.string())
    .describe("Key features/amenities, e.g. 'Sea view', 'In-house catering', 'AV equipment'"),
  contact_email: z.string().nullable().describe("Contact email if provided"),
  contact_phone: z.string().nullable().describe("Contact phone if provided"),
  website_url: z.string().nullable().describe("Website URL if provided"),
})

export type ListingDraft = z.infer<typeof listingDraftSchema>

export const EMPTY_DRAFT: ListingDraft = {
  name: null,
  short_description: null,
  description: null,
  venue_type: null,
  district: null,
  area: null,
  address: null,
  capacity_min: null,
  capacity_max: null,
  price_min: null,
  price_max: null,
  amenities: [],
  contact_email: null,
  contact_phone: null,
  website_url: null,
}

/** Fields that meaningfully indicate the listing is ready to save. */
export function listingCompletion(draft: ListingDraft): {
  filled: number
  total: number
  ready: boolean
} {
  const tracked: (keyof ListingDraft)[] = [
    "name",
    "short_description",
    "description",
    "venue_type",
    "district",
    "capacity_max",
    "price_min",
  ]
  const filled = tracked.filter((k) => {
    const v = draft[k]
    return v !== null && v !== undefined && v !== ""
  }).length
  return {
    filled,
    total: tracked.length,
    ready: Boolean(draft.name && draft.description && draft.venue_type),
  }
}
