"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { stripe } from "@/lib/stripe"
import { revalidatePath } from "next/cache"

interface SyncResult {
  ok: boolean
  venueId?: string
  planName?: string
  error?: string
}

/**
 * Records (or updates) a venue subscription from a completed Checkout Session.
 * Uses the service-role client because venue_subscriptions is written on behalf
 * of the system, not directly by the owner. Idempotent on stripe_subscription_id.
 */
export async function recordSubscriptionFromSession(
  sessionId: string,
): Promise<SyncResult> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  })

  const venueId = session.metadata?.venue_id
  const tierId = session.metadata?.tier_id
  if (!venueId || !tierId) return { ok: false, error: "Missing metadata" }

  const subscription =
    typeof session.subscription === "string"
      ? await stripe.subscriptions.retrieve(session.subscription)
      : session.subscription

  const stripeSubId =
    typeof session.subscription === "string"
      ? session.subscription
      : subscription?.id ?? null

  const status = subscription?.status ?? "active"
  const item = subscription?.items?.data?.[0]
  const periodStart = item?.current_period_start
    ? new Date(item.current_period_start * 1000).toISOString()
    : null
  const periodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000).toISOString()
    : null
  const cancelAtPeriodEnd = subscription?.cancel_at_period_end ?? false

  return persistSubscription({
    venueId,
    tierId,
    stripeSubId,
    status,
    periodStart,
    periodEnd,
    cancelAtPeriodEnd,
  })
}

export async function persistSubscription(args: {
  venueId: string
  tierId: string
  stripeSubId: string | null
  status: string
  periodStart: string | null
  periodEnd: string | null
  cancelAtPeriodEnd: boolean
}): Promise<SyncResult> {
  const admin = createAdminClient()
  const {
    venueId,
    tierId,
    stripeSubId,
    status,
    periodStart,
    periodEnd,
    cancelAtPeriodEnd,
  } = args

  // Look up the tier for display + listing_type / badge
  const { data: tier } = await admin
    .from("subscription_tiers")
    .select("name, slug, badge_type")
    .eq("id", tierId)
    .maybeSingle()

  // Upsert subscription row (one current sub per venue)
  const { data: existing } = await admin
    .from("venue_subscriptions")
    .select("id, stripe_subscription_id")
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // Stale-event guard: if a non-active status arrives for a subscription that
  // has already been replaced (e.g. a cancellation webhook for an old paid sub
  // after the venue switched to a different plan), ignore it so the newer plan
  // isn't overwritten.
  const incomingIsActive = status === "active" || status === "trialing"
  if (
    !incomingIsActive &&
    existing?.stripe_subscription_id &&
    stripeSubId &&
    existing.stripe_subscription_id !== stripeSubId
  ) {
    return { ok: true, venueId, planName: tier?.name ?? "your plan" }
  }

  const row = {
    venue_id: venueId,
    tier_id: tierId,
    stripe_subscription_id: stripeSubId,
    status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    cancel_at_period_end: cancelAtPeriodEnd,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    const { error } = await admin
      .from("venue_subscriptions")
      .update(row)
      .eq("id", existing.id)
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await admin.from("venue_subscriptions").insert(row)
    if (error) return { ok: false, error: error.message }
  }

  // Unlock listing features on the venue when active
  const isActive = status === "active" || status === "trialing"
  if (isActive) {
    await admin
      .from("venues")
      .update({
        badge_type: tier?.badge_type ?? null,
        is_featured: tier?.slug === "pro",
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", venueId)
  } else {
    await admin
      .from("venues")
      .update({
        badge_type: null,
        status: "draft",
        is_featured: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", venueId)
  }

  // Keep the owner's per-user account plan in sync. A user is "pro" while they
  // hold any active/trialing subscription on the paid "pro" tier across their
  // venues; otherwise they fall back to "free".
  const { data: venueRow } = await admin
    .from("venues")
    .select("owner_id")
    .eq("id", venueId)
    .maybeSingle()
  const ownerId = venueRow?.owner_id as string | undefined
  if (ownerId) {
    const { data: ownerVenues } = await admin
      .from("venues")
      .select("id")
      .eq("owner_id", ownerId)
    const ids = (ownerVenues ?? []).map((v) => v.id)
    let isPro = false
    if (ids.length) {
      const { data: paidSubs } = await admin
        .from("venue_subscriptions")
        .select("status, subscription_tiers!inner(slug)")
        .in("venue_id", ids)
        .in("status", ["active", "trialing"])
        .eq("subscription_tiers.slug", "pro")
        .limit(1)
      isPro = Boolean(paidSubs && paidSubs.length)
    }
    await admin
      .from("profiles")
      .update({
        account_plan: isPro ? "pro" : "free",
        updated_at: new Date().toISOString(),
      })
      .eq("id", ownerId)
  }

  revalidatePath("/owner")
  revalidatePath(`/owner/venues/${venueId}`)
  return { ok: true, venueId, planName: tier?.name ?? "your plan" }
}
