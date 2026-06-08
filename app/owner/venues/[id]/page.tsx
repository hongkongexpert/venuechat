import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Pencil, MapPin, Users, Banknote, Eye, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getMyVenue, getVenueSubscription } from "@/app/actions/venue-actions"
import { OwnerHeader } from "@/components/owner/owner-header"
import { PlanSelector } from "@/components/owner/plan-selector"
import { VenueActionsBar } from "@/components/owner/venue-actions-bar"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VenueDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/owner/venues/${id}`)

  const venue = await getMyVenue(id)
  if (!venue) notFound()

  const sub = await getVenueSubscription(id)
  const hasActiveSub = sub?.status === "active" || sub?.status === "trialing"

  const { data: tiers } = await supabase
    .from("subscription_tiers")
    .select("id, name, slug, price_monthly, price_yearly, features, badge_type")
    .order("sort_order", { ascending: true })

  const priceRange =
    venue.price_min || venue.price_max
      ? `HK$${(venue.price_min ?? 0).toLocaleString()}${
          venue.price_max ? ` – ${venue.price_max.toLocaleString()}` : "+"
        }`
      : null
  const capacityRange =
    venue.capacity_min || venue.capacity_max
      ? `${venue.capacity_min ?? 0}${venue.capacity_max ? ` – ${venue.capacity_max}` : "+"} guests`
      : null

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <OwnerHeader />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Cover + title */}
        <div className="overflow-hidden rounded-2xl border border-[#eceae9] bg-white">
          <div className="relative aspect-[16/9] bg-[#f3f3f3]">
            {venue.cover_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={venue.cover_image || "/placeholder.svg"} alt={venue.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-[#9a9999]">
                No cover photo
              </div>
            )}
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-[#1a1c1c] truncate">{venue.name}</h1>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      venue.status === "published"
                        ? "bg-[#eaf6ec] text-[#3f8f4f]"
                        : "bg-[#f3f0ef] text-[#8a8686]"
                    }`}
                  >
                    {venue.status === "published" ? "Published" : "Draft"}
                  </span>
                </div>
                {venue.short_description && (
                  <p className="mt-1 text-sm text-[#5e3f3a]">{venue.short_description}</p>
                )}
              </div>
              <Link
                href={`/owner/venues/${venue.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e2dfde] bg-white px-4 py-2 text-sm font-semibold text-[#5e3f3a] hover:bg-[#f5f5f5] transition-colors shrink-0"
              >
                <Pencil size={14} />
                Edit
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#5e3f3a]">
              {(venue.district || venue.address) && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={15} className="text-[#9e0000]" />
                  {[venue.district, venue.area].filter(Boolean).join(", ") || venue.address}
                </span>
              )}
              {capacityRange && (
                <span className="inline-flex items-center gap-1.5">
                  <Users size={15} className="text-[#9e0000]" />
                  {capacityRange}
                </span>
              )}
              {priceRange && (
                <span className="inline-flex items-center gap-1.5">
                  <Banknote size={15} className="text-[#9e0000]" />
                  {priceRange}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Eye size={15} className="text-[#9e0000]" />
                {venue.view_count ?? 0} views
              </span>
            </div>
          </div>
        </div>

        {/* Subscription status */}
        {hasActiveSub && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#cfe9d4] bg-[#f4fbf5] p-4">
            <CheckCircle2 className="text-[#3f8f4f] shrink-0" size={20} />
            <div className="text-sm">
              <p className="font-semibold text-[#1a1c1c]">
                {sub?.tier_name} plan active
              </p>
              <p className="text-[#5e3f3a]">
                {sub?.cancel_at_period_end
                  ? "Cancels at the end of the current period."
                  : "Renews automatically."}
                {sub?.current_period_end &&
                  ` Next renewal ${new Date(sub.current_period_end).toLocaleDateString("en-HK", { day: "numeric", month: "short", year: "numeric" })}.`}
              </p>
            </div>
          </div>
        )}

        {/* Publish / delete */}
        <div className="mt-4 rounded-2xl border border-[#eceae9] bg-white p-6">
          <VenueActionsBar venueId={venue.id} status={venue.status} hasActiveSub={hasActiveSub} />
        </div>

        {/* Plans */}
        <div className="mt-6 rounded-2xl border border-[#eceae9] bg-white p-6">
          <PlanSelector
            venueId={venue.id}
            tiers={tiers ?? []}
            activeTierSlug={hasActiveSub ? sub?.tier_slug ?? null : null}
          />
        </div>
      </main>
    </div>
  )
}
