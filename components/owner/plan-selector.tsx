"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Crown, Loader2 } from "lucide-react"
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
    if (!res.ok || (!res.url && res.ok)) {
      setPendingTier(null)
      if (!res.ok) {
        setError(res.error || "Could not start checkout.")
        return
      }
      startTransition(() => router.refresh())
      return
    }
    window.location.href = res.url!
  }

  const free = tiers.find((t) => t.price_monthly === 0)
  const pro = tiers.find((t) => t.price_monthly > 0)

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h2 className="text-lg font-bold text-[#1a1c1c] tracking-tight">Choose a plan</h2>
        <div className="inline-flex rounded-full border border-[#e2dfde] bg-white p-1 text-sm">
          <button
            onClick={() => setInterval("month")}
            className={`rounded-full px-4 py-1.5 font-semibold text-xs transition-colors ${
              interval === "month" ? "bg-[#1a0a0a] text-white" : "text-[#5e3f3a]"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("year")}
            className={`rounded-full px-4 py-1.5 font-semibold text-xs transition-colors ${
              interval === "year" ? "bg-[#1a0a0a] text-white" : "text-[#5e3f3a]"
            }`}
          >
            Yearly
            <span className="ml-1 text-[10px] font-bold text-[#1a7f37]">–17%</span>
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-[#9e0000] bg-[#fdecea] rounded-xl px-3 py-2">{error}</p>}

      {/* Two-column side-by-side cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-[#1a0a0a]/10 shadow-md">

        {/* FREE column — light */}
        {free && (() => {
          const isActive = activeTierSlug === free.slug
          const loading = pendingTier === free.id
          return (
            <div className="flex flex-col bg-[#faf8f6] p-7 border-b md:border-b-0 md:border-r border-[#e8e4e0]">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9a8a80] mb-4">
                Starter
              </p>
              <h3 className="text-2xl font-black text-[#1a1c1c] tracking-tight">{free.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-black text-[#1a1c1c]">Free</span>
                <span className="text-sm text-[#9a9999]">forever</span>
              </div>
              <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-[#e8e4e0] pt-5">
                {free.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#5e3f3a]">
                    <Check size={14} className="mt-0.5 shrink-0 text-[#5e3f3a]" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSelect(free.id)}
                disabled={isActive || loading}
                className={`mt-7 inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isActive
                    ? "border-[#e2dfde] bg-[#f3f0ef] text-[#9a9999]"
                    : "border-[#c4b8b5] bg-white text-[#1a1c1c] hover:bg-[#f0ece9]"
                }`}
              >
                {loading && <Spinner className="size-4" />}
                {isActive ? "Current plan" : "Use Free plan"}
              </button>
            </div>
          )
        })()}

        {/* PRO column — dark */}
        {pro && (() => {
          const price = interval === "year" ? pro.price_yearly : pro.price_monthly
          const isActive = activeTierSlug === pro.slug
          const loading = pendingTier === pro.id
          return (
            <div className="relative flex flex-col bg-[#1a0a0a] p-7">
              {/* Popular badge */}
              <span className="absolute top-4 right-4 rounded-full border border-[#c79100]/40 bg-[#c79100]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#c79100]">
                Most popular
              </span>
              <div className="flex items-center gap-2 mb-4">
                <Crown size={14} className="text-[#c79100]" />
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#c79100]">
                  Pro
                </p>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">{pro.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">{formatPrice(price)}</span>
                <span className="text-sm text-[#6b5a50]">/{interval === "year" ? "yr" : "mo"}</span>
              </div>
              {interval === "year" && (
                <p className="mt-1 text-xs text-[#c79100] font-medium">
                  Billed annually — save 17%
                </p>
              )}
              <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-white/10 pt-5">
                {pro.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#c8b8a8]">
                    <Check size={14} className="mt-0.5 shrink-0 text-[#c79100]" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSelect(pro.id)}
                disabled={isActive || loading}
                className={`mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isActive
                    ? "bg-white/10 text-white/50"
                    : "bg-[#c79100] text-[#1a0a0a] hover:brightness-110 shadow-md"
                }`}
              >
                {loading ? <Spinner className="size-4" /> : <Crown size={14} />}
                {isActive ? "Current plan" : `Upgrade to ${pro.name}`}
              </button>
            </div>
          )
        })()}
      </div>

      <p className="mt-3 text-xs text-[#9a9999]">
        Test mode — use card 4242 4242 4242 4242, any future expiry, any CVC.
      </p>
    </div>
  )
}
