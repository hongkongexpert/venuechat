"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { SerpVenue } from "@/lib/serpapi"
import { serpVenueToDraft } from "@/lib/listing-template"
import { normalizePlan, getPlanLimits } from "@/lib/account-plan"

export interface ClaimResult {
  ok: boolean
  error?: string
  status?: "approved" | "pending"
  venueId?: string
}

/* ------------------------------- Helpers -------------------------------- */

/** Registrable-ish domain from a website URL, lowercased, no www. */
function domainFromUrl(url?: string | null): string | null {
  if (!url) return null
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, "").toLowerCase() || null
  } catch {
    return null
  }
}

/** Domain part of an email address, lowercased. */
function domainFromEmail(email?: string | null): string | null {
  if (!email || !email.includes("@")) return null
  return email.split("@")[1]?.replace(/^www\./, "").toLowerCase() || null
}

/**
 * True when the claimant's email domain proves control of the listing's
 * website domain. Matches apex + subdomain in either direction
 * (e.g. mail.grandhotel.hk ↔ grandhotel.hk).
 */
function emailMatchesWebsite(
  emailDomain: string | null,
  websiteDomain: string | null,
): boolean {
  if (!emailDomain || !websiteDomain) return false
  // Generic mailbox providers can never prove ownership of a business site.
  const generic = new Set([
    "gmail.com",
    "yahoo.com",
    "yahoo.com.hk",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "qq.com",
    "163.com",
    "protonmail.com",
    "live.com",
    "live.hk",
  ])
  if (generic.has(emailDomain)) return false
  if (emailDomain === websiteDomain) return true
  return (
    websiteDomain.endsWith(`.${emailDomain}`) ||
    emailDomain.endsWith(`.${websiteDomain}`)
  )
}

/**
 * Persist external photo URLs into our venue-images bucket so they never
 * expire. Already-hosted photos are kept as-is. Uses the admin client so it
 * works on the manual-approval path too.
 */
async function persistPhotos(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  urls: string[],
): Promise<string[]> {
  const ownPrefix = "/storage/v1/object/public/venue-images/"
  const out: string[] = []
  for (const url of urls) {
    if (!url) continue
    if (url.includes(ownPrefix)) {
      out.push(url)
      continue
    }
    try {
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) continue
      const contentType = res.headers.get("content-type") || "image/jpeg"
      if (!contentType.startsWith("image/")) continue
      const buf = new Uint8Array(await res.arrayBuffer())
      if (buf.byteLength > 8 * 1024 * 1024) continue
      const ext = contentType.split("/")[1]?.split("+")[0] || "jpg"
      const path = `${userId}/claim-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`
      const { error } = await admin.storage
        .from("venue-images")
        .upload(path, buf, { contentType, upsert: true, cacheControl: "3600" })
      if (error) continue
      const { data } = admin.storage.from("venue-images").getPublicUrl(path)
      out.push(data.publicUrl)
    } catch {
      continue
    }
  }
  return out
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
}

/**
 * Create a verified, owner-controlled venue from a claim's stored listing
 * data. Runs with the admin client and respects the owner's plan limits.
 * Returns the new venue id or an error.
 */
async function createVenueFromClaim(
  admin: ReturnType<typeof createAdminClient>,
  ownerId: string,
  listingData: Record<string, unknown>,
): Promise<{ id?: string; error?: string }> {
  const planRes = await admin
    .from("profiles")
    .select("account_plan")
    .eq("id", ownerId)
    .maybeSingle()
  const plan = normalizePlan(planRes.data?.account_plan)
  const limits = getPlanLimits(plan)

  const { count } = await admin
    .from("venues")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
  if ((count ?? 0) >= limits.maxListings) {
    return {
      error:
        plan === "free"
          ? "This account already has its 1 free listing. Upgrade to Pro to claim more venues."
          : `This account has reached its plan limit of ${limits.maxListings} listings.`,
    }
  }

  const draft = (listingData.draft ?? {}) as Record<string, unknown>
  const name = String(draft.name ?? listingData.business_name ?? "").trim()
  if (!name) return { error: "The claim is missing a venue name." }

  const requestedPhotos = Array.isArray(listingData.photos)
    ? (listingData.photos as string[]).slice(0, limits.maxPhotosPerListing)
    : []
  const photos = await persistPhotos(admin, ownerId, requestedPhotos)

  const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`

  const { data, error } = await admin
    .from("venues")
    .insert({
      owner_id: ownerId,
      name,
      slug,
      description: (draft.description as string) || null,
      short_description: (draft.short_description as string) || null,
      address: (draft.address as string) || null,
      district: (draft.district as string) || null,
      area: (draft.area as string) || null,
      venue_type: (draft.venue_type as string) || null,
      contact_email: (draft.contact_email as string) || null,
      contact_phone: (draft.contact_phone as string) || null,
      website_url: (draft.website_url as string) || null,
      cover_image: photos[0] || null,
      status: "draft",
      listing_type: "claimed",
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  if (photos.length) {
    await admin.from("venue_photos").insert(
      photos.map((url, i) => ({
        venue_id: data.id,
        url,
        is_cover: i === 0,
        sort_order: i,
      })),
    )
  }
  return { id: data.id }
}

/* ------------------------------- Claimant ------------------------------- */

export async function submitClaim(input: {
  venue: SerpVenue
  photos?: string[]
  claimantPhone?: string
  claimantRole?: string
  notes?: string
}): Promise<ClaimResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "auth" }

  const { venue } = input
  if (!venue?.name?.trim()) {
    return { ok: false, error: "Pick a venue to claim first." }
  }

  // Block duplicate pending/approved claims for the same place.
  const venueKey = venue.id || venue.name
  const { data: existing } = await supabase
    .from("venue_claims")
    .select("id, status")
    .eq("user_id", user.id)
    .contains("listing_data", { venue_key: venueKey })
    .in("status", ["pending", "approved"])
    .maybeSingle()
  if (existing) {
    return {
      ok: false,
      error:
        existing.status === "approved"
          ? "You've already claimed this venue."
          : "You already have a pending claim for this venue.",
    }
  }

  const websiteDomain = domainFromUrl(venue.website)
  const emailDomain = domainFromEmail(user.email)
  const autoApprove = emailMatchesWebsite(emailDomain, websiteDomain)

  const draft = serpVenueToDraft(venue)
  const listingData = {
    venue_key: venueKey,
    draft,
    photos: input.photos ?? (venue.thumbnail ? [venue.thumbnail] : []),
    thumbnail: venue.thumbnail ?? null,
    source: "google_maps",
  }

  const admin = createAdminClient()

  // Auto-approve when the email domain matches the listed website.
  if (autoApprove) {
    const created = await createVenueFromClaim(admin, user.id, listingData)
    if (created.error) return { ok: false, error: created.error }

    const { error } = await admin.from("venue_claims").insert({
      user_id: user.id,
      venue_id: created.id ?? null,
      business_name: venue.name.trim(),
      listing_data: listingData,
      website_domain: websiteDomain,
      claimant_email: user.email ?? "",
      claimant_phone: input.claimantPhone || null,
      claimant_role: input.claimantRole || null,
      notes: input.notes || null,
      verification_method: "email_domain",
      status: "approved",
      reviewed_at: new Date().toISOString(),
    })
    if (error) return { ok: false, error: error.message }

    revalidatePath("/owner")
    revalidatePath("/owner/claims")
    return { ok: true, status: "approved", venueId: created.id }
  }

  // Otherwise queue for manual admin review.
  const { error } = await admin.from("venue_claims").insert({
    user_id: user.id,
    business_name: venue.name.trim(),
    listing_data: listingData,
    website_domain: websiteDomain,
    claimant_email: user.email ?? "",
    claimant_phone: input.claimantPhone || null,
    claimant_role: input.claimantRole || null,
    notes: input.notes || null,
    verification_method: "manual",
    status: "pending",
  })
  if (error) return { ok: false, error: error.message }

  revalidatePath("/owner/claims")
  return { ok: true, status: "pending" }
}

export interface ClaimRow {
  id: string
  business_name: string
  status: "pending" | "approved" | "rejected"
  verification_method: "email_domain" | "manual"
  venue_id: string | null
  website_domain: string | null
  claimant_email: string
  claimant_phone: string | null
  claimant_role: string | null
  notes: string | null
  review_notes: string | null
  created_at: string
  listing_data: Record<string, unknown>
}

export async function getMyClaims(): Promise<ClaimRow[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from("venue_claims")
    .select(
      "id, business_name, status, verification_method, venue_id, website_domain, claimant_email, claimant_phone, claimant_role, notes, review_notes, created_at, listing_data",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  return (data as ClaimRow[]) ?? []
}

/* -------------------------------- Admin --------------------------------- */

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { user: null, isAdmin: false, supabase }
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()
  return { user, isAdmin: data?.role === "admin", supabase }
}

export async function isAdmin(): Promise<boolean> {
  const { isAdmin } = await requireAdmin()
  return isAdmin
}

export interface AdminClaimRow extends ClaimRow {
  user_id: string
}

export async function getAllClaims(
  status?: "pending" | "approved" | "rejected",
): Promise<AdminClaimRow[]> {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return []
  const admin = createAdminClient()
  let query = admin
    .from("venue_claims")
    .select(
      "id, user_id, business_name, status, verification_method, venue_id, website_domain, claimant_email, claimant_phone, claimant_role, notes, review_notes, created_at, listing_data",
    )
    .order("created_at", { ascending: false })
  if (status) query = query.eq("status", status)
  const { data } = await query
  return (data as AdminClaimRow[]) ?? []
}

export async function reviewClaim(
  claimId: string,
  decision: "approve" | "reject",
  reviewNotes?: string,
): Promise<ClaimResult> {
  const { user, isAdmin } = await requireAdmin()
  if (!isAdmin || !user) return { ok: false, error: "Not authorized." }

  const admin = createAdminClient()
  const { data: claim } = await admin
    .from("venue_claims")
    .select("id, user_id, status, listing_data, business_name")
    .eq("id", claimId)
    .maybeSingle()
  if (!claim) return { ok: false, error: "Claim not found." }
  if (claim.status !== "pending") {
    return { ok: false, error: "This claim has already been reviewed." }
  }

  if (decision === "reject") {
    const { error } = await admin
      .from("venue_claims")
      .update({
        status: "rejected",
        review_notes: reviewNotes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", claimId)
    if (error) return { ok: false, error: error.message }
    revalidatePath("/admin/claims")
    return { ok: true, status: "pending" }
  }

  // Approve: create the venue for the claimant, then mark approved.
  const created = await createVenueFromClaim(
    admin,
    claim.user_id,
    claim.listing_data as Record<string, unknown>,
  )
  if (created.error) return { ok: false, error: created.error }

  const { error } = await admin
    .from("venue_claims")
    .update({
      status: "approved",
      venue_id: created.id ?? null,
      review_notes: reviewNotes || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", claimId)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/claims")
  return { ok: true, status: "approved", venueId: created.id }
}
