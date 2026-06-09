import "server-only"

import Stripe from "stripe"

// Lazy singleton — constructed on first use so the build phase never
// instantiates Stripe without a key (STRIPE_SECRET_KEY is only available
// at runtime, not during `next build` page-data collection).
let _stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
    _stripe = new Stripe(key)
  }
  return _stripe
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
