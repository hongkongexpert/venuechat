import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import {
  Pencil,
  MapPin,
  Users,
  Banknote,
  Eye,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getMyVenues, getMyVenue, getVenueSubscription } from "@/app/actions/venue-actions"
import { OwnerShell } from "@/components/owner/owner-shell"
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

  const [venue, venues, sub, tiersRes, profileRes] = await Promise.all([
    getMyVenue(id),
    getMyVenues(),
    getVenueSubscription(id),
    supabase
      .from("subscription_tiers")
      .select("id, name, slug, price_monthly, price_yearly, features, badge_type")
      .order("sort_order", { ascending: true }),
    supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle(),
  ])

  if (!venue) notFound()

  const profile = profileRes.data
  const userName = profile?.display_name || user.email?.split("@")[0] || "Owner"
  const hasActiveSub = sub?.status === "active" || sub?.status === "trialing"

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
    <OwnerShell
      venues={venues}
      activeVenueId={id}
      view="venue"
      userName={userName}
      userEmail={user.email ?? ""}
      avatarUrl={profile?.avatar_url}
    >
      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6 flex flex-col gap-5">
        {/* Back + title */}
        <div className="flex items-center gap-3">
          <Link
            href="/owner"
            className="inline-flex items-center gap-1.5 text-sm text-[#8a7a77] hover:text-[#9e0000] transition-colors"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Back to AI Creator</span>
          </Link>
        </div>

        {/* Cover + hero */}
        <div className="overflow-hidden rounded-2xl border border-[#eceae9] bg-white">
          <div className="relative aspect-[16/9] bg-[#f3f3f3]">
            {venue.cover_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={venue.cover_image}
                alt={venue.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-[#9a9999]">
                No cover photo — edit to add one
              </div>
            )}
            <span
              className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
                venue.status === "active"
                  ? "bg-[#eaf6ec] text-[#3f8f4f]"
                  : "bg-white/90 text-[#8a8686]"
              }`}
            >
              {venue.status === "active" ? "Published" : "Draft"}
            </span>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold text-[#1a1c1c] leading-tight">{venue.name}</h1>
              <Link
                href={`/owner/venues/${venue.id}/edit`}
                className="inline-flex items-center gap-1.5 shrink-0 rounded-full border border-[#e2dfde] px-4 py-2 text-sm font-semibold text-[#5e3f3a] hover:bg-[#f5f5f5] transition-colors"
              >
                <Pencil size={14} />
                Edit
              </Link>
            </div>
            {venue.short_description && (
              <p className="mt-1 text-sm text-[#5e3f3a]">{venue.short_description}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#5e3f3a]">
              {(venue.district || venue.address) && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#9e0000]" />
                  {[venue.district, venue.area].filter(Boolean).join(", ") || venue.address}
                </span>
              )}
              {capacityRange && (
                <span className="inline-flex items-center gap-1.5">
                  <Users size={14} className="text-[#9e0000]" />
                  {capacityRange}
                </span>
              )}
              {priceRange && (
                <span className="inline-flex items-center gap-1.5">
                  <Banknote size={14} className="text-[#9e0000]" />
                  {priceRange}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Eye size={14} className="text-[#9e0000]" />
                {venue.view_count ?? 0} views
              </span>
            </div>
          </div>
        </div>

        {/* Active subscription banner */}
        {hasActiveSub && (
          <div className="flex items-center gap-3 rounded-2xl border border-[#cfe9d4] bg-[#f4fbf5] p-4">
            <CheckCircle2 className="text-[#3f8f4f] shrink-0" size={20} />
            <div className="text-sm">
              <p className="font-semibold text-[#1a1c1c]">{sub?.tier_name} plan active</p>
              <p className="text-[#5e3f3a]">
                {sub?.cancel_at_period_end
                  ? "Cancels at the end of the current period."
                  : "Renews automatically."}
                {sub?.current_period_end &&
                  ` Next: ${new Date(sub.current_period_end).toLocaleDateString("en-HK", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}.`}
              </p>
            </div>
          </div>
        )}

        {/* Publish / visibility controls */}
        <section className="rounded-2xl border border-[#eceae9] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#1a1c1c] mb-1">Listing visibility</h2>
          <p className="text-sm text-[#8a7a77] mb-4">
            {hasActiveSub
              ? "You have an active plan — you can publish this listing now."
              : "Choose a plan below to unlock publishing and reach event planners."}
          </p>
          <VenueActionsBar venueId={venue.id} status={venue.status} hasActiveSub={hasActiveSub} />
        </section>

        {/* Plan selector */}
        <section className="rounded-2xl border border-[#eceae9] bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-[#9e0000]" />
            <h2 className="text-sm font-semibold text-[#1a1c1c]">Subscription plan</h2>
          </div>
          <PlanSelector
            venueId={venue.id}
            tiers={tiersRes.data ?? []}
            activeTierSlug={hasActiveSub ? sub?.tier_slug ?? null : null}
          />
        </section>
      </div>
    </OwnerShell>
  )
}
