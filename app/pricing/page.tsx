import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { PricingCards, type Tier } from "@/components/pricing/pricing-cards"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Pricing | VenueChat",
  description:
    "List your venue on VenueChat. Simple monthly plans to reach thousands of event planners in Hong Kong.",
}

export default async function PricingPage() {
  const supabase = await createClient()

  const [{ data: tiers }, { data: userData }] = await Promise.all([
    supabase
      .from("subscription_tiers")
      .select("id, name, slug, price_monthly, price_yearly, features, is_featured, badge_type")
      .order("sort_order", { ascending: true }),
    supabase.auth.getUser(),
  ])

  const isLoggedIn = Boolean(userData?.user)

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-[#eceae9]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#5e3f3a] hover:text-[#1a1c1c] transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <Link href="/" className="text-[#9e0000] font-black text-lg tracking-tight">
            VenueChat
          </Link>
          <Link
            href={isLoggedIn ? "/dashboard" : "/auth/login"}
            className="text-sm font-medium text-[#5e3f3a] hover:text-[#1a1c1c] transition-colors"
          >
            {isLoggedIn ? "Dashboard" : "Sign in"}
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-14">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block rounded-full bg-[#fdecea] text-[#9e0000] text-xs font-semibold px-3 py-1 mb-4">
            For venue owners
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1a1c1c] text-balance">
            List your venue, get more bookings
          </h1>
          <p className="text-base text-[#5f5e5e] mt-3 text-pretty leading-relaxed">
            Reach thousands of event planners searching for the perfect space in Hong Kong.
            Choose a plan that fits your venue.
          </p>
        </div>

        {tiers && tiers.length > 0 ? (
          <PricingCards tiers={tiers as Tier[]} isLoggedIn={isLoggedIn} />
        ) : (
          <p className="text-center text-[#9a9999]">Plans are loading…</p>
        )}

        <div className="text-center mt-14">
          <p className="text-sm text-[#5f5e5e]">
            Looking to plan an event instead?{" "}
            <Link href="/" className="font-semibold text-[#9e0000] hover:underline">
              Start searching venues
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
