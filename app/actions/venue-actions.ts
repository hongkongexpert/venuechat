"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { SerpVenue } from "@/lib/serpapi"

export interface ActionResult {
  ok: boolean
  error?: string
}

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

/* ----------------------------- Saved venues ----------------------------- */

export async function toggleSavedVenue(
  venue: SerpVenue,
): Promise<ActionResult & { saved?: boolean }> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: "auth" }

  const venueKey = venue.id || venue.name

  // Check if already saved
  const { data: existing } = await supabase
    .from("saved_venues")
    .select("id")
    .eq("user_id", user.id)
    .eq("venue_key", venueKey)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from("saved_venues")
      .delete()
      .eq("id", existing.id)
    if (error) return { ok: false, error: error.message }
    revalidatePath("/")
    return { ok: true, saved: false }
  }

  const { error } = await supabase.from("saved_venues").insert({
    user_id: user.id,
    venue_key: venueKey,
    venue,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath("/")
  return { ok: true, saved: true }
}

export async function getSavedVenues() {
  const { supabase, user } = await requireUser()
  if (!user) return []
  const { data } = await supabase
    .from("saved_venues")
    .select("id, venue, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  return data ?? []
}

export async function getSavedVenueKeys(): Promise<string[]> {
  const { supabase, user } = await requireUser()
  if (!user) return []
  const { data } = await supabase
    .from("saved_venues")
    .select("venue_key")
    .eq("user_id", user.id)
  return (data ?? []).map((r) => r.venue_key as string)
}

export async function removeSavedVenue(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: "auth" }
  const { error } = await supabase
    .from("saved_venues")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/* ------------------------------- Enquiries ------------------------------- */

export async function createEnquiry(
  venue: SerpVenue,
  details: { notes?: string; event_date?: string; guest_count?: number },
): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: "auth" }
  const { error } = await supabase.from("enquiries").insert({
    user_id: user.id,
    venue_key: venue.id || venue.name,
    venue,
    notes: details.notes || null,
    event_date: details.event_date || null,
    guest_count: details.guest_count ?? null,
    status: "contacted",
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function getEnquiries() {
  const { supabase, user } = await requireUser()
  if (!user) return []
  const { data } = await supabase
    .from("enquiries")
    .select("id, venue, status, notes, event_date, guest_count, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  return data ?? []
}

export async function updateEnquiryStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: "auth" }
  const { error } = await supabase
    .from("enquiries")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function deleteEnquiry(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: "auth" }
  const { error } = await supabase
    .from("enquiries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/* ----------------------------- Chat history ----------------------------- */

export async function saveChatSession(
  title: string,
  messages: unknown[],
): Promise<ActionResult & { id?: string }> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: "auth" }
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ user_id: user.id, title, messages })
    .select("id")
    .single()
  if (error) return { ok: false, error: error.message }
  return { ok: true, id: data.id }
}

export async function getChatSessions() {
  const { supabase, user } = await requireUser()
  if (!user) return []
  const { data } = await supabase
    .from("chat_sessions")
    .select("id, title, messages, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
  return data ?? []
}

export async function deleteChatSession(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: "auth" }
  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/* ------------------------------- Profile -------------------------------- */

export interface ProfileData {
  display_name?: string | null
  avatar_url?: string | null
  default_guest_count?: number | null
  default_budget?: string | null
  default_event_type?: string | null
  default_district?: string | null
}

export async function getProfile() {
  const { supabase, user } = await requireUser()
  if (!user) return null
  const { data } = await supabase
    .from("profiles")
    .select(
      "display_name, avatar_url, default_guest_count, default_budget, default_event_type, default_district",
    )
    .eq("id", user.id)
    .maybeSingle()
  return data
}

/* ------------------------------- Dashboard ------------------------------ */

export async function getDashboardData() {
  const { supabase, user } = await requireUser()
  if (!user) return null

  const [profileRes, savedRes, enquiriesRes, chatsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "display_name, avatar_url, default_guest_count, default_budget, default_event_type, default_district",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("saved_venues")
      .select("id, venue, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("enquiries")
      .select("id, venue, status, event_date, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("chat_sessions")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(4),
  ])

  const [savedCount, enquiryCount, chatCount] = await Promise.all([
    supabase
      .from("saved_venues")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("chat_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ])

  return {
    email: user.email ?? "",
    createdAt: user.created_at,
    profile: profileRes.data,
    recentSaved: savedRes.data ?? [],
    recentEnquiries: enquiriesRes.data ?? [],
    recentChats: chatsRes.data ?? [],
    counts: {
      saved: savedCount.count ?? 0,
      enquiries: enquiryCount.count ?? 0,
      chats: chatCount.count ?? 0,
    },
  }
}

export async function updateAvatar(avatarUrl: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: "auth" }
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function updateProfile(profile: ProfileData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: "auth" }
  const { error } = await supabase
    .from("profiles")
    .update({ ...profile, updated_at: new Date().toISOString() })
    .eq("id", user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/")
  return { ok: true }
}

export async function signOut(): Promise<ActionResult> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/")
  return { ok: true }
}

/* --------------------------- Venue listings ----------------------------- */

export interface VenueListing {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  address: string | null
  district: string | null
  area: string | null
  venue_type: string | null
  capacity_min: number | null
  capacity_max: number | null
  price_min: number | null
  price_max: number | null
  contact_email: string | null
  contact_phone: string | null
  website_url: string | null
  cover_image: string | null
  status: string | null
  is_featured: boolean | null
  listing_type: string | null
  badge_type: string | null
  view_count: number | null
  inquiry_count: number | null
  created_at: string
  updated_at: string
}

export interface VenueInput {
  name: string
  description?: string | null
  short_description?: string | null
  address?: string | null
  district?: string | null
  area?: string | null
  venue_type?: string | null
  capacity_min?: number | null
  capacity_max?: number | null
  price_min?: number | null
  price_max?: number | null
  contact_email?: string | null
  contact_phone?: string | null
  website_url?: string | null
  cover_image?: string | null
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

export async function getMyVenues(): Promise<VenueListing[]> {
  const { supabase, user } = await requireUser()
  if (!user) return []
  const { data } = await supabase
    .from("venues")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
  return (data as VenueListing[]) ?? []
}

export async function getMyVenue(id: string): Promise<VenueListing | null> {
  const { supabase, user } = await requireUser()
  if (!user) return null
  const { data } = await supabase
    .from("venues")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle()
  return (data as VenueListing) ?? null
}

export interface ListingDraftInput extends VenueInput {
  amenities?: string[] | null
  photos?: string[] | null
}

export async function createVenueFromDraft(
  draft: ListingDraftInput,
): Promise<ActionResult & { id?: string }> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: "auth" }
  if (!draft.name?.trim()) return { ok: false, error: "The listing needs a name first." }

  const slug = `${slugify(draft.name)}-${Math.random().toString(36).slice(2, 7)}`

  const { data, error } = await supabase
    .from("venues")
    .insert({
      owner_id: user.id,
      name: draft.name.trim(),
      slug,
      description: draft.description || null,
      short_description: draft.short_description || null,
      address: draft.address || null,
      district: draft.district || null,
      area: draft.area || null,
      venue_type: draft.venue_type || null,
      capacity_min: draft.capacity_min ?? null,
      capacity_max: draft.capacity_max ?? null,
      price_min: draft.price_min ?? null,
      price_max: draft.price_max ?? null,
      contact_email: draft.contact_email || null,
      contact_phone: draft.contact_phone || null,
      website_url: draft.website_url || null,
      cover_image: draft.photos?.[0] || draft.cover_image || null,
      amenities: draft.amenities && draft.amenities.length ? draft.amenities : null,
      status: "draft",
      listing_type: "free",
    })
    .select("id")
    .single()

  if (error) return { ok: false, error: error.message }

  // Save additional photos to venue_photos
  const extraPhotos = (draft.photos ?? []).slice(1)
  if (extraPhotos.length) {
    await supabase.from("venue_photos").insert(
      extraPhotos.map((url, i) => ({
        venue_id: data.id,
        image_url: url,
        sort_order: i + 1,
      })),
    )
  }

  revalidatePath("/owner")
  return { ok: true, id: data.id }
}

export async function createVenue(
  input: VenueInput,
): Promise<ActionResult & { id?: string }> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: "auth" }
  if (!input.name?.trim()) return { ok: false, error: "Name is required" }

  const slug = `${slugify(input.name)}-${Math.random().toString(36).slice(2, 7)}`

  const { data, error } = await supabase
    .from("venues")
    .insert({
      owner_id: user.id,
      name: input.name.trim(),
      slug,
      description: input.description || null,
      short_description: input.short_description || null,
      address: input.address || null,
      district: input.district || null,
      area: input.area || null,
      venue_type: input.venue_type || null,
      capacity_min: input.capacity_min ?? null,
      capacity_max: input.capacity_max ?? null,
      price_min: input.price_min ?? null,
      price_max: input.price_max ?? null,
      contact_email: input.contact_email || null,
      contact_phone: input.contact_phone || null,
      website_url: input.website_url || null,
      cover_image: input.cover_image || null,
      status: "draft",
      listing_type: "free",
    })
    .select("id")
    .single()

  if (error) return { ok: false, error: error.message }
  revalidatePath("/owner")
  return { ok: true, id: data.id }
}

export async function updateVenue(
  id: string,
  input: VenueInput,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: "auth" }
  if (!input.name?.trim()) return { ok: false, error: "Name is required" }

  const { error } = await supabase
    .from("venues")
    .update({
      name: input.name.trim(),
      description: input.description || null,
      short_description: input.short_description || null,
      address: input.address || null,
      district: input.district || null,
      area: input.area || null,
      venue_type: input.venue_type || null,
      capacity_min: input.capacity_min ?? null,
      capacity_max: input.capacity_max ?? null,
      price_min: input.price_min ?? null,
      price_max: input.price_max ?? null,
      contact_email: input.contact_email || null,
      contact_phone: input.contact_phone || null,
      website_url: input.website_url || null,
      cover_image: input.cover_image || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("owner_id", user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath("/owner")
  revalidatePath(`/owner/venues/${id}`)
  return { ok: true }
}

export async function setVenueStatus(
  id: string,
  status: "draft" | "published",
): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: "auth" }

  // Publishing requires an active subscription
  if (status === "published") {
    const { data: venue } = await supabase
      .from("venues")
      .select("id")
      .eq("id", id)
      .eq("owner_id", user.id)
      .maybeSingle()
    if (!venue) return { ok: false, error: "Venue not found" }

    const { data: sub } = await supabase
      .from("venue_subscriptions")
      .select("status")
      .eq("venue_id", id)
      .in("status", ["active", "trialing"])
      .maybeSingle()
    if (!sub) {
      return {
        ok: false,
        error: "An active subscription is required to publish this listing.",
      }
    }
  }

  const { error } = await supabase
    .from("venues")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/owner")
  revalidatePath(`/owner/venues/${id}`)
  return { ok: true }
}

export async function deleteVenue(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: "auth" }
  const { error } = await supabase
    .from("venues")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/owner")
  return { ok: true }
}

export interface VenueSubInfo {
  status: string | null
  tier_name: string | null
  tier_slug: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean | null
}

export async function getVenueSubscription(
  venueId: string,
): Promise<VenueSubInfo | null> {
  const { supabase, user } = await requireUser()
  if (!user) return null
  const { data } = await supabase
    .from("venue_subscriptions")
    .select(
      "status, current_period_end, cancel_at_period_end, subscription_tiers(name, slug)",
    )
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  const tier = (data as { subscription_tiers?: { name?: string; slug?: string } })
    .subscription_tiers
  return {
    status: data.status,
    tier_name: tier?.name ?? null,
    tier_slug: tier?.slug ?? null,
    current_period_end: data.current_period_end,
    cancel_at_period_end: data.cancel_at_period_end,
  }
}
