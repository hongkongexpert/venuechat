"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, Crown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { startCheckoutFromPricing } from "@/app/actions/stripe-actions"

export interface Tier {
  id: string
  name: string
  slug: string
  price_monthly: number
  price_yearly: number
  features: string[]
  is_featured: boolean
  badge_type: string | null
}

function formatHkd(cents: number) {
  if (cents === 0) return "Free"
  return `HK$${Math.round(cents / 100).toLocaleString()}`
}

export function PricingCards({ tiers, isLoggedIn }: { tiers: Tier[]; isLoggedIn: boolean }) {
  const router = useRouter()
  const [yearly, setYearly] = useState(false)
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const free = tiers.find((t) => t.price_monthly === 0)
  const pro = tiers.find((t) => t.price_monthly > 0 && t.is_featured) ?? tiers.find((t) => t.price_monthly > 0)

  const handleUpgrade = async (tierId: string) => {
    setError(null)
    setLoadingTier(tierId)
    try {
      const res = await startCheckoutFromPricing(tierId, yearly ? "year" : "month")
      if (!res.ok) {
        setError(res.error || "Could not start checkout. Please try again.")
        setLoadingTier(null)
        return
      }
      if (res.url) {
        window.location.href = res.url
        return
      }
      if (res.redirect) {
        router.push(res.redirect)
        return
      }
      setLoadingTier(null)
    } catch {
      setError("Could not start checkout. Please try again.")
      setLoadingTier(null)
    }
  }

  return (
    <div className="w-full">
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <span className={cn("text-sm font-medium transition-colors", !yearly ? "text-[#1a1c1c]" : "text-[#9a9999]")}>
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={yearly}
          aria-label="Toggle yearly billing"
          onClick={() => setYearly((y) => !y)}
          className={cn(
            "relative h-7 w-12 rounded-full transition-colors shadow-inner",
            yearly ? "bg-[#1a0a0a]" : "bg-[#d8d4d3]",
          )}
        >
          <span
            className={cn(
              "absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
              yearly && "translate-x-5",
            )}
          />
        </button>
        <span className={cn("text-sm font-medium transition-colors", yearly ? "text-[#1a1c1c]" : "text-[#9a9999]")}>
          Yearly
          <span className="ml-1.5 text-xs font-bold text-[#1a7f37]">Save 17%</span>
        </span>
      </div>

      {error && (
        <p className="max-w-4xl mx-auto mb-6 rounded-xl bg-[#fdecea] px-4 py-3 text-sm font-medium text-[#9e0000]">
          {error}
        </p>
      )}

      {/* Side-by-side cards — unified border, seamless join */}
      <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto rounded-3xl overflow-hidden border border-[#1a0a0a]/15 shadow-xl">

        {/* FREE — warm cream */}
        {free && (
          <div className="flex flex-col bg-[#faf7f4] p-8 md:p-10 border-b md:border-b-0 md:border-r border-[#e8e2dd]">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a8a80] mb-5">
              Get started
            </p>
            <h3 className="text-3xl font-black text-[#1a1c1c] tracking-tight">{free.name}</h3>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-5xl font-black text-[#1a1c1c] leading-none">Free</span>
              <span className="mb-1 text-sm text-[#9a9999]">forever</span>
            </div>
            <p className="mt-4 text-sm text-[#7a6a60] leading-relaxed">
              Perfect for venues just getting started on VenueChat.
            </p>

            <ul className="mt-8 flex flex-1 flex-col gap-3.5 border-t border-[#e8e2dd] pt-7">
              {free.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-[#5e3f3a]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5e3f3a]/10">
                    <Check size={11} className="text-[#5e3f3a]" />
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => handleUpgrade(free.id)}
                disabled={loadingTier !== null}
                className="mt-10 inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-[#c4b8b5] bg-white px-6 py-3.5 text-sm font-bold text-[#1a1c1c] transition-colors hover:bg-[#f0ece9] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loadingTier === free.id && <Loader2 size={15} className="animate-spin" />}
                Get started free
              </button>
            ) : (
              <Link
                href={`/auth/sign-up?plan=${free.slug}`}
                className="mt-10 inline-flex items-center justify-center rounded-2xl border-2 border-[#c4b8b5] bg-white px-6 py-3.5 text-sm font-bold text-[#1a1c1c] transition-colors hover:bg-[#f0ece9]"
              >
                Get started free
              </Link>
            )}
          </div>
        )}

        {/* PRO — deep black / gold */}
        {pro && (() => {
          const price = yearly ? pro.price_yearly : pro.price_monthly
          return (
            <div className="relative flex flex-col bg-[#1a0a0a] p-8 md:p-10">
              {/* Most popular badge */}
              <span className="absolute top-6 right-6 rounded-full border border-[#c79100]/40 bg-[#c79100]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#c79100]">
                Most popular
              </span>

              {/* Crown label */}
              <div className="flex items-center gap-2 mb-5">
                <Crown size={14} className="text-[#c79100]" />
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c79100]">
                  Pro
                </p>
              </div>

              <h3 className="text-3xl font-black text-white tracking-tight">{pro.name}</h3>

              <div className="mt-3 flex items-end gap-2">
                <span className="text-5xl font-black text-white leading-none">
                  {formatHkd(price)}
                </span>
                <span className="mb-1 text-sm text-[#6b5a50]">/{yearly ? "year" : "month"}</span>
              </div>

              {yearly && (
                <p className="mt-2 text-xs font-semibold text-[#c79100]">
                  Billed annually — 2 months free
                </p>
              )}

              <p className="mt-4 text-sm text-[#9a8878] leading-relaxed">
                Full control over your listings with maximum visibility.
              </p>

              <ul className="mt-8 flex flex-1 flex-col gap-3.5 border-t border-white/10 pt-7">
                {pro.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-[#c8b8a8]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c79100]/15">
                      <Check size={11} className="text-[#c79100]" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => handleUpgrade(pro.id)}
                  disabled={loadingTier !== null}
                  className="mt-10 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#c79100] px-6 py-3.5 text-sm font-bold text-[#1a0a0a] transition-all hover:brightness-110 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loadingTier === pro.id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Crown size={15} />
                  )}
                  {loadingTier === pro.id ? "Starting checkout…" : "Get Pro"}
                </button>
              ) : (
                <Link
                  href={`/auth/sign-up?plan=${pro.slug}`}
                  className="mt-10 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#c79100] px-6 py-3.5 text-sm font-bold text-[#1a0a0a] transition-all hover:brightness-110 shadow-lg"
                >
                  <Crown size={15} />
                  Get Pro
                </Link>
              )}

              <p className="mt-3 text-center text-xs text-[#4a3830]">
                Cancel anytime. No hidden fees.
              </p>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
