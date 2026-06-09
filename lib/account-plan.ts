// Per-user account plan model.
// Free is the default for every new signup. Premium unlocks more listings,
// more photos, deeper Google Maps import and premium-only listing features.

export type AccountPlan = "free" | "premium"

export interface PlanLimits {
  /** How many venues a user may own in total. */
  maxListings: number
  /** Max photos that can be stored per listing. */
  maxPhotosPerListing: number
  /** Whether the AI may auto-look-up venues on Google Maps during chat. */
  aiMapsLookup: boolean
  /** Whether import pulls in the richer fields (reviews, full hours, all photos). */
  fullMapsImport: boolean
  /** Whether the owner may publish a listing live (vs. draft only). */
  canPublish: boolean
  /** Featured / priority placement badge. */
  featured: boolean
  /** Listing performance analytics. */
  analytics: boolean
}

export const PLAN_LIMITS: Record<AccountPlan, PlanLimits> = {
  free: {
    maxListings: 1,
    maxPhotosPerListing: 5,
    aiMapsLookup: true,
    fullMapsImport: false,
    canPublish: false,
    featured: false,
    analytics: false,
  },
  premium: {
    maxListings: 25,
    maxPhotosPerListing: 30,
    aiMapsLookup: true,
    fullMapsImport: true,
    canPublish: true,
    featured: true,
    analytics: true,
  },
}

export const PLAN_LABELS: Record<AccountPlan, string> = {
  free: "Free",
  premium: "Premium",
}

/** Marketing bullet points shown on the upgrade screen. */
export const PREMIUM_PERKS: string[] = [
  "Publish unlimited listings live",
  "Up to 30 photos per venue",
  "Full Google Maps import (reviews, hours & every photo)",
  "Featured placement in search",
  "Listing performance analytics",
]

export function normalizePlan(value: unknown): AccountPlan {
  return value === "premium" ? "premium" : "free"
}

export function getPlanLimits(plan: AccountPlan): PlanLimits {
  return PLAN_LIMITS[plan]
}

export function isPremium(plan: AccountPlan): boolean {
  return plan === "premium"
}
