import { type NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { persistSubscription } from "@/app/actions/subscription-sync"

// Stripe needs the raw body to verify signatures
export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } else {
      // No webhook secret configured (e.g. test mode without CLI) — parse directly.
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid payload"
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string,
          )
          await syncFromSubscription(sub, session.metadata ?? undefined)
        }
        break
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription
        await syncFromSubscription(sub)
        break
      }
      default:
        break
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Handler error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function syncFromSubscription(
  sub: Stripe.Subscription,
  fallbackMeta?: Record<string, string>,
) {
  const meta = { ...(fallbackMeta ?? {}), ...(sub.metadata ?? {}) }
  const venueId = meta.venue_id
  const tierId = meta.tier_id
  if (!venueId || !tierId) return

  // current_period_* may live on the subscription or its first item depending on API version
  const item = sub.items?.data?.[0] as unknown as {
    current_period_start?: number
    current_period_end?: number
  }
  const periodStartUnix =
    (sub as unknown as { current_period_start?: number }).current_period_start ??
    item?.current_period_start
  const periodEndUnix =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    item?.current_period_end

  await persistSubscription({
    venueId,
    tierId,
    stripeSubId: sub.id,
    status: sub.status,
    periodStart: periodStartUnix
      ? new Date(periodStartUnix * 1000).toISOString()
      : null,
    periodEnd: periodEndUnix
      ? new Date(periodEndUnix * 1000).toISOString()
      : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
  })
}
