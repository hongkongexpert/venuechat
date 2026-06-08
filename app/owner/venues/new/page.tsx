import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getMyVenues } from "@/app/actions/venue-actions"
import { OwnerShell } from "@/components/owner/owner-shell"
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

  const [venues, profileRes] = await Promise.all([
    getMyVenues(),
    supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle(),
  ])

  const profile = profileRes.data
  const userName = profile?.display_name || user.email?.split("@")[0] || "Owner"

  return (
    <OwnerShell
      venues={venues}
      view="venue"
      userName={userName}
      userEmail={user.email ?? ""}
      avatarUrl={profile?.avatar_url}
    >
      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <Link
            href="/owner"
            className="inline-flex items-center gap-1.5 text-sm text-[#8a7a77] hover:text-[#9e0000] transition-colors"
          >
            <ArrowLeft size={15} />
            Back to AI Creator
          </Link>
        </div>

        <div>
          <h1 className="text-xl font-bold text-[#1a1c1c]">Add a venue manually</h1>
          <p className="text-sm text-[#5f5e5e] mt-1">
            Prefer filling in a form? Fill in the details below. You can also{" "}
            <Link href="/owner" className="text-[#9e0000] font-medium hover:underline">
              use AI instead
            </Link>{" "}
            to write the listing for you.
          </p>
        </div>

        <div className="rounded-2xl border border-[#eceae9] bg-white p-6">
          <VenueForm userId={user.id} />
        </div>
      </div>
    </OwnerShell>
  )
}
