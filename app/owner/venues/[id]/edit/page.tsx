import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyVenue } from "@/app/actions/venue-actions"
import { OwnerHeader } from "@/components/owner/owner-header"
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

  const venue = await getMyVenue(id)
  if (!venue) notFound()

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <OwnerHeader />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[#1a1c1c] mb-6">Edit {venue.name}</h1>
        <div className="rounded-2xl border border-[#eceae9] bg-white p-6">
          <VenueForm userId={user.id} venue={venue} />
        </div>
      </main>
    </div>
  )
}
