import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getMyVenues, getMyVenue } from "@/app/actions/venue-actions"
import { OwnerShell } from "@/components/owner/owner-shell"
import { VenueForm } from "@/components/owner/venue-form"

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Edit Venue | VenueChat",
}

export default async function EditVenuePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/owner/venues/${id}/edit`)

  const [venue, venues, profileRes] = await Promise.all([
    getMyVenue(id),
    getMyVenues(),
    supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle(),
  ])

  if (!venue) notFound()

  const profile = profileRes.data
  const userName = profile?.display_name || user.email?.split("@")[0] || "Owner"

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
        <div className="flex items-center gap-3">
          <Link
            href={`/owner/venues/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-[#8a7a77] hover:text-[#9e0000] transition-colors"
          >
            <ArrowLeft size={15} />
            Back to listing
          </Link>
        </div>

        <h1 className="text-xl font-bold text-[#1a1c1c]">Edit — {venue.name}</h1>

        <div className="rounded-2xl border border-[#eceae9] bg-white p-6">
          <VenueForm userId={user.id} venue={venue} />
        </div>
      </div>
    </OwnerShell>
  )
}
