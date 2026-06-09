"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { stripe } from "@/lib/stripe"
import { persistSubscription } from "@/app/actions/subscription-sync"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

interface CheckoutResult {
  ok: boolean
  url?: string
  error?: string
}

interface ActionResult {
  ok: boolean
  error?: string
}

/**
 * Get (or lazily create) the Stripe Customer for a user, persisting the id on
 * their profile so future checkouts and billing operations reuse it.
 */
async function getOrCreateStripeCustomer(userId: string, email: string | undefined): Promise<string> {
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, full_name, display_name")
    .eq("id", userId)
    .maybeSingle()

  if (profile?.stripe_customer_id && !profile.stripe_customer_id.startsWith("free_")) {
    return profile.stripe_customer_id
  }

  const customer = await stripe.customers.create({
    email,
    name: profile?.display_name || profile?.full_name || undefined,
    metadata: { user_id: userId },
  })

  await admin
    .from("profiles")
    .update({ stripe_customer_id: customer.id, updated_at: new Date().toISOString() })
    .eq("id", userId)

  return customer.id
}

/**
 * Create a Stripe Checkout Session (subscription mode) for a venue + tier.
 * Free tiers are applied directly without payment — and if the venue currently
 * has a paid Stripe subscription, it is cancelled so billing stops.
 */
export async function createSubscriptionCheckout(
  venueId: string,
  tierId: string,
  interval: "month" | "year" = "month",
): Promise<CheckoutResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Please sign in to subscribe." }

  // Verify the venue belongs to this user
  const { data: venue } = await supabase
    .from("venues")
    .select("id, name, owner_id")
    .eq("id", venueId)
    .eq("owner_id", user.id)
    .maybeSingle()
  if (!venue) return { ok: false, error: "Venue not found." }

  // Load the tier (price is the source of truth on the server)
  const { data: tier } = await supabase
    .from("subscription_tiers")
    .select("id, name, slug, price_monthly, price_yearly")
    .eq("id", tierId)
    .maybeSingle()
  if (!tier) return { ok: false, error: "Plan not found." }

  const unitAmount =
    interval === "year" ? tier.price_yearly ?? 0 : tier.price_monthly ?? 0

  const origin = (await headers()).get("origin") ?? ""

  // Free plan: activate immediately, no Stripe checkout needed.
  if (!unitAmount || unitAmount <= 0) {
    try {
      // If the venue is currently on a paid Stripe subscription, cancel it so
      // the customer stops being billed.
      const admin = createAdminClient()
      const { data: existingSub } = await admin
        .from("venue_subscriptions")
        .select("stripe_subscription_id, status")
        .eq("venue_id", venueId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      const existingStripeId = existingSub?.stripe_subscription_id
      if (
        existingStripeId &&
        !existingStripeId.startsWith("free_") &&
        (existingSub?.status === "active" || existingSub?.status === "trialing")
      ) {
        try {
          await stripe.subscriptions.cancel(existingStripeId)
        } catch {
          // Subscription may already be cancelled in Stripe — safe to continue.
        }
      }

      const result = await persistSubscription({
        venueId,
        tierId,
        stripeSubId: `free_${venueId}`,
        status: "active",
        periodStart: new Date().toISOString(),
        periodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
      })
      if (!result.ok) return { ok: false, error: result.error ?? "Could not activate the free plan." }
      return { ok: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not activate the free plan."
      return { ok: false, error: message }
    }
  }

  try {
    const customerId = await getOrCreateStripeCustomer(user.id, user.email ?? undefined)

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "hkd",
            unit_amount: unitAmount,
            recurring: { interval },
            product_data: {
              name: `${tier.name} plan — ${venue.name}`,
              description: `VenueChat ${tier.name} listing subscription (${
                interval === "year" ? "yearly" : "monthly"
              })`,
            },
          },
        },
      ],
      customer: customerId,
      client_reference_id: venueId,
      metadata: {
        venue_id: venueId,
        tier_id: tierId,
        user_id: user.id,
        interval,
      },
      subscription_data: {
        metadata: {
          venue_id: venueId,
          tier_id: tierId,
          user_id: user.id,
        },
      },
      success_url: `${origin}/owner/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/owner/venues/${venueId}?checkout=cancelled`,
    })

    if (!session.url) return { ok: false, error: "Could not start checkout." }
    return { ok: true, url: session.url }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed."
    return { ok: false, error: message }
  }
}

/**
 * Load the current subscription row for a venue after verifying ownership.
 */
async function getOwnedVenueSubscription(venueId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Please sign in." as const }

  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("id", venueId)
    .eq("owner_id", user.id)
    .maybeSingle()
  if (!venue) return { error: "Venue not found." as const }

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from("venue_subscriptions")
    .select("id, tier_id, stripe_subscription_id, status")
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return { sub }
}

/**
 * Cancel a paid subscription at the end of the current billing period.
 * The plan stays active until then.
 */
export async function cancelVenueSubscription(venueId: string): Promise<ActionResult> {
  const res = await getOwnedVenueSubscription(venueId)
  if ("error" in res) return { ok: false, error: res.error }
  const sub = res.sub

  if (!sub?.stripe_subscription_id || sub.stripe_subscription_id.startsWith("free_")) {
    return { ok: false, error: "No paid subscription to cancel." }
  }

  try {
    const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    const item = updated.items?.data?.[0]
    await persistSubscription({
      venueId,
      tierId: sub.tier_id,
      stripeSubId: updated.id,
      status: updated.status,
      periodStart: item?.current_period_start
        ? new Date(item.current_period_start * 1000).toISOString()
        : null,
      periodEnd: item?.current_period_end
        ? new Date(item.current_period_end * 1000).toISOString()
        : null,
      cancelAtPeriodEnd: true,
    })

    revalidatePath(`/owner/venues/${venueId}`)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not cancel the subscription."
    return { ok: false, error: message }
  }
}

/**
 * Resume a subscription that was set to cancel at period end.
 */
export async function resumeVenueSubscription(venueId: string): Promise<ActionResult> {
  const res = await getOwnedVenueSubscription(venueId)
  if ("error" in res) return { ok: false, error: res.error }
  const sub = res.sub

  if (!sub?.stripe_subscription_id || sub.stripe_subscription_id.startsWith("free_")) {
    return { ok: false, error: "No paid subscription to resume." }
  }

  try {
    const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: false,
    })

    const item = updated.items?.data?.[0]
    await persistSubscription({
      venueId,
      tierId: sub.tier_id,
      stripeSubId: updated.id,
      status: updated.status,
      periodStart: item?.current_period_start
        ? new Date(item.current_period_start * 1000).toISOString()
        : null,
      periodEnd: item?.current_period_end
        ? new Date(item.current_period_end * 1000).toISOString()
        : null,
      cancelAtPeriodEnd: false,
    })

    revalidatePath(`/owner/venues/${venueId}`)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not resume the subscription."
    return { ok: false, error: message }
  }
}
