import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus, MapPin, Eye, ImageIcon, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getMyVenues } from "@/app/actions/venue-actions"
import { OwnerHeader } from "@/components/owner/owner-header"

export const metadata = {
  title: "My Venues | VenueChat",
  description: "Manage your venue listings.",
}

function StatusBadge({ status }: { status: string | null }) {
  const published = status === "published"
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        published ? "bg-[#eaf6ec] text-[#3f8f4f]" : "bg-[#f3f0ef] text-[#8a8686]"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  )
}

export default async function OwnerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/owner")

  const venues = await getMyVenues()

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <OwnerHeader />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1c1c]">My venues</h1>
            <p className="text-sm text-[#5f5e5e] mt-1">
              Create and manage your venue listings.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/owner/venues/new"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e0dcdb] px-4 py-2.5 text-sm font-semibold text-[#5e3f3a] hover:border-[#9e0000] transition-colors"
            >
              <Plus size={16} />
              Manual
            </Link>
            <Link
              href="/owner/venues/ai"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#9e0000] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              <Sparkles size={16} />
              Create with AI
            </Link>
          </div>
        </div>

        {venues.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#e8bdb6] bg-white p-10 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fdecea] text-[#9e0000]">
              <MapPin size={26} />
            </span>
            <h2 className="text-lg font-semibold text-[#1a1c1c]">No venues yet</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-[#5f5e5e]">
              List your venue to reach event planners searching on VenueChat. Just
              describe it in a quick chat — our AI writes the listing for you.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <Link
                href="/owner/venues/ai"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#9e0000] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                <Sparkles size={16} />
                Create with AI
              </Link>
              <Link
                href="/owner/venues/new"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e0dcdb] px-5 py-2.5 text-sm font-semibold text-[#5e3f3a] hover:border-[#9e0000] transition-colors"
              >
                Fill a form instead
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {venues.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/owner/venues/${v.id}`}
                  className="group block overflow-hidden rounded-2xl border border-[#eceae9] bg-white hover:border-[#e8bdb6] transition-colors"
                >
                  <div className="relative aspect-[16/9] bg-[#f3f3f3]">
                    {v.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.cover_image || "/placeholder.svg"}
                        alt={v.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#c9c5c4]">
                        <ImageIcon size={28} />
                      </div>
                    )}
                    <span className="absolute top-3 left-3">
                      <StatusBadge status={v.status} />
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[#1a1c1c] truncate">{v.name}</h3>
                    <p className="mt-0.5 text-sm text-[#9a9999] truncate">
                      {[v.venue_type, v.district].filter(Boolean).join(" · ") || "—"}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-[#9a9999]">
                      <span className="inline-flex items-center gap-1">
                        <Eye size={13} />
                        {v.view_count ?? 0} views
                      </span>
                      {v.listing_type && v.listing_type !== "free" && (
                        <span className="inline-flex items-center rounded-full bg-[#fdecea] px-2 py-0.5 font-semibold text-[#9e0000] capitalize">
                          {v.listing_type}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
