// Per-user account plan model.
// Free is the default for every new signup. Pro unlocks more listings,
// more photos, deeper Google Maps import and pro-only listing features.

export type AccountPlan = "free" | "pro"

export interface PlanLimits {
  /** How many venues a user may own in total. */
  maxListings: number
  /** Max photos that can be stored per listing. */
  maxPhotosPerListing: number
  /** Whether the AI may auto-look-up venues on Google Maps during chat. */
  aiMapsLookup: boolean
  /** Whether import pulls in the richer fields (full hours, all photos). */
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
  pro: {
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
  pro: "Pro",
}

/** Marketing bullet points shown on the upgrade screen. */
export const PRO_PERKS: string[] = [
  "Publish multiple listings live",
  "Up to 30 photos per venue",
  "Full Google Maps import (every photo & full hours)",
  "Claim listings and edit every detail",
  "Featured placement in search",
  "Listing performance analytics",
]

export function normalizePlan(value: unknown): AccountPlan {
  return value === "pro" ? "pro" : "free"
}

export function getPlanLimits(plan: AccountPlan): PlanLimits {
  return PLAN_LIMITS[plan]
}

export function isPro(plan: AccountPlan): boolean {
  return plan === "pro"
}
