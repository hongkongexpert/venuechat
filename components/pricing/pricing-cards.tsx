"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, BadgeCheck, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [yearly, setYearly] = useState(false)

  return (
    <div>
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span
          className={cn(
            "text-sm font-medium transition-colors",
            !yearly ? "text-[#1a1c1c]" : "text-[#9a9999]",
          )}
        >
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={yearly}
          aria-label="Toggle yearly billing"
          onClick={() => setYearly((y) => !y)}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            yearly ? "bg-[#9e0000]" : "bg-[#d8d4d3]",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
              yearly && "translate-x-5",
            )}
          />
        </button>
        <span
          className={cn(
            "text-sm font-medium transition-colors",
            yearly ? "text-[#1a1c1c]" : "text-[#9a9999]",
          )}
        >
          Yearly
          <span className="ml-1.5 text-xs font-semibold text-[#1a7f37]">Save ~17%</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
        {tiers.map((tier) => {
          const price = yearly ? tier.price_yearly : tier.price_monthly
          const isFree = tier.price_monthly === 0
          const featured = tier.is_featured
          const href = isLoggedIn ? "/dashboard" : `/auth/sign-up?plan=${tier.slug}`

          return (
            <div
              key={tier.id}
              className={cn(
                "relative rounded-2xl border p-6 flex flex-col bg-white",
                featured
                  ? "border-[#9e0000] shadow-lg md:-mt-3 md:mb-3"
                  : "border-[#eceae9]",
              )}
            >
              {featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#9e0000] px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}

              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#1a1c1c]">{tier.name}</h3>
                {tier.badge_type === "verified" && (
                  <BadgeCheck size={18} className="text-[#9e0000]" />
                )}
                {tier.badge_type === "premium" && (
                  <Crown size={18} className="text-[#c79100]" />
                )}
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#1a1c1c]">
                  {formatHkd(price)}
                </span>
                {!isFree && (
                  <span className="text-sm text-[#9a9999]">/{yearly ? "year" : "month"}</span>
                )}
              </div>

              <Link
                href={href}
                className={cn(
                  "mt-5 inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                  featured
                    ? "bg-[#9e0000] text-white hover:opacity-90"
                    : "border border-[#e2dfde] text-[#1a1c1c] hover:bg-[#f5f5f5]",
                )}
              >
                {isFree ? "Get started" : "Choose " + tier.name}
              </Link>

              <ul className="mt-6 flex flex-col gap-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-[#3d3b3b]">
                    <Check size={16} className="text-[#1a7f37] mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
