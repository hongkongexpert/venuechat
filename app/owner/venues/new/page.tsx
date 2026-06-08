import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OwnerHeader } from "@/components/owner/owner-header"
import { VenueForm } from "@/components/owner/venue-form"

export const metadata = {
  title: "Add Venue | VenueChat",
}

export default async function NewVenuePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/owner/venues/new")

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <OwnerHeader />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[#1a1c1c]">Add a venue</h1>
        <p className="text-sm text-[#5f5e5e] mt-1 mb-6">
          Fill in the details below. You can save as a draft and publish later once
          you&apos;ve chosen a plan.
        </p>
        <div className="rounded-2xl border border-[#eceae9] bg-white p-6">
          <VenueForm userId={user.id} />
        </div>
      </main>
    </div>
  )
}
