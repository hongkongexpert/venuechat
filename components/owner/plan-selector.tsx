"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { createSubscriptionCheckout } from "@/app/actions/stripe-actions"
import { Spinner } from "@/components/ui/spinner"

interface Tier {
  id: string
  name: string
  slug: string
  price_monthly: number
  price_yearly: number
  features: string[]
  badge_type: string | null
}

interface PlanSelectorProps {
  venueId: string
  tiers: Tier[]
  activeTierSlug: string | null
}

function formatPrice(cents: number) {
  return `HK$${(cents / 100).toLocaleString("en-HK")}`
}

export function PlanSelector({ venueId, tiers, activeTierSlug }: PlanSelectorProps) {
  const router = useRouter()
  const [interval, setInterval] = useState<"month" | "year">("month")
  const [pendingTier, setPendingTier] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const handleSelect = async (tierId: string) => {
    setError(null)
    setPendingTier(tierId)
    const res = await createSubscriptionCheckout(venueId, tierId, interval)
    if (!res.ok || !res.url) {
      setError(res.error || "Could not start checkout.")
      setPendingTier(null)
      return
    }
    // Free plan returns an internal URL; paid returns Stripe Checkout
    if (res.url.startsWith("http") && res.url.includes("checkout.stripe.com")) {
      window.location.href = res.url
    } else {
      startTransition(() => {
        router.push(res.url!)
        router.refresh()
      })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold text-[#1a1c1c]">Choose a plan</h2>
        <div className="inline-flex rounded-full border border-[#e2dfde] bg-white p-1 text-sm">
          <button
            onClick={() => setInterval("month")}
            className={`rounded-full px-3 py-1 font-medium transition-colors ${
              interval === "month" ? "bg-[#9e0000] text-white" : "text-[#5e3f3a]"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("year")}
            className={`rounded-full px-3 py-1 font-medium transition-colors ${
              interval === "year" ? "bg-[#9e0000] text-white" : "text-[#5e3f3a]"
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-[#9e0000]">{error}</p>}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const price = interval === "year" ? tier.price_yearly : tier.price_monthly
          const isActive = activeTierSlug === tier.slug
          const isFree = price === 0
          const loading = pendingTier === tier.id
          return (
            <div
              key={tier.id}
              className={`flex flex-col rounded-2xl border p-5 ${
                tier.slug === "premium"
                  ? "border-[#9e0000] bg-[#fffafa]"
                  : "border-[#eceae9] bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#1a1c1c]">{tier.name}</h3>
                {isActive && (
                  <span className="rounded-full bg-[#eaf6ec] px-2 py-0.5 text-xs font-semibold text-[#3f8f4f]">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-2">
                <span className="text-2xl font-bold text-[#1a1c1c]">
                  {isFree ? "Free" : formatPrice(price)}
                </span>
                {!isFree && (
                  <span className="text-sm text-[#9a9999]">
                    /{interval === "year" ? "yr" : "mo"}
                  </span>
                )}
              </p>
              <ul className="mt-4 flex flex-1 flex-col gap-2">
                {tier.features.slice(0, 5).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#5e3f3a]">
                    <Check size={15} className="mt-0.5 shrink-0 text-[#9e0000]" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSelect(tier.id)}
                disabled={isActive || loading}
                className={`mt-5 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                  isActive
                    ? "bg-[#f3f0ef] text-[#9a9999]"
                    : "bg-[#9e0000] text-white hover:opacity-90"
                }`}
              >
                {loading && <Spinner className="size-4" />}
                {isActive ? "Current plan" : isFree ? "Use Free plan" : `Choose ${tier.name}`}
              </button>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-[#9a9999]">
        Test mode — use card 4242 4242 4242 4242, any future expiry, any CVC.
      </p>
    </div>
  )
}
