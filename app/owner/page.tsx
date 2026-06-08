import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyVenues } from "@/app/actions/venue-actions"
import { OwnerShell } from "@/components/owner/owner-shell"
import { AiVenueCreator } from "@/components/owner/ai-venue-creator"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Create Listing | VenueChat",
  description: "Create and manage your venue listings with AI.",
}

export default async function OwnerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/owner")

  const [venues, profileRes] = await Promise.all([
    getMyVenues(),
    supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle(),
  ])

  const profile = profileRes.data
  const userName = profile?.display_name || user.email?.split("@")[0] || "Owner"

  return (
    <OwnerShell
      venues={venues}
      view="ai"
      userName={userName}
      userEmail={user.email ?? ""}
      avatarUrl={profile?.avatar_url}
    >
      {/* AI Creator — full height, homepage-style chat + live preview */}
      <div className="flex flex-col h-full p-4 lg:p-6">
        <div className="flex-1 min-h-0">
          <AiVenueCreator userId={user.id} />
        </div>
      </div>
    </OwnerShell>
  )
}
