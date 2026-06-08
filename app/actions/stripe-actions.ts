"use server"

import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"
import { headers } from "next/headers"

interface CheckoutResult {
  ok: boolean
  url?: string
  error?: string
}

/**
 * Create a Stripe Checkout Session (subscription mode) for a venue + tier.
 * Free tiers are applied directly without payment.
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

  // Free plan: activate immediately, no Stripe needed
  if (!unitAmount || unitAmount <= 0) {
    // Upsert a free subscription record directly
    await supabase.from("venue_subscriptions").upsert(
      {
        venue_id: venueId,
        tier_id: tierId,
        status: "active",
        stripe_subscription_id: `free_${venueId}`,
        stripe_customer_id: `free_${user.id}`,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
      },
      { onConflict: "stripe_subscription_id" },
    )
    return { ok: true }
  }

  try {
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
      customer_email: user.email ?? undefined,
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
