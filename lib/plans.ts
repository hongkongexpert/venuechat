/**
 * Per-user account plans.
 *
 * Stored on `profiles.account_plan` (default `free`). This is separate from the
 * per-venue Stripe subscription — the account plan governs what the owner can do
 * while *creating/managing* listings (limits + premium tooling), while a venue
 * subscription governs whether an individual listing can be published live.
 */

export type AccountPlan = "free" | "premium"

export interface PlanLimits {
  /** Display name. */
  label: string
  /** Max number of venues the user can own (draft or live). */
  maxVenues: number
  /** Max photos per listing. */
  maxPhotosPerVenue: number
  /** Can import full Google Maps data (reviews, all photos, hours). */
  fullGoogleImport: boolean
  /** Number of Google photos auto-imported on a Maps import. */
  maxImportedPhotos: number
  /** Featured/priority placement badge. */
  featuredPlacement: boolean
  /** Access to listing performance analytics. */
  analytics: boolean
}

export const PLANS: Record<AccountPlan, PlanLimits> = {
  free: {
    label: "Free",
    maxVenues: 1,
    maxPhotosPerVenue: 5,
    fullGoogleImport: false,
    maxImportedPhotos: 3,
    featuredPlacement: false,
    analytics: false,
  },
  premium: {
    label: "Premium",
    maxVenues: 25,
    maxPhotosPerVenue: 30,
    fullGoogleImport: true,
    maxImportedPhotos: 15,
    featuredPlacement: true,
    analytics: true,
  },
}

export function normalizePlan(value: string | null | undefined): AccountPlan {
  return value === "premium" ? "premium" : "free"
}

export function getPlanLimits(value: string | null | undefined): PlanLimits {
  return PLANS[normalizePlan(value)]
}

export function isPremium(value: string | null | undefined): boolean {
  return normalizePlan(value) === "premium"
}
