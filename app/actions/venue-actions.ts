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
