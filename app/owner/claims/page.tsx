import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyVenues } from "@/app/actions/venue-actions"
import { getMyClaims } from "@/app/actions/claim-actions"
import { OwnerShell } from "@/components/owner/owner-shell"
import { ClaimsClient } from "@/components/owner/claims-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Claim a Venue | VenueChat",
  description: "Claim and verify a venue you own or manage.",
}

export default async function ClaimsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/owner/claims")

  const [venues, claims, profileRes] = await Promise.all([
    getMyVenues(),
    getMyClaims(),
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
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
      <ClaimsClient initialClaims={claims} />
    </OwnerShell>
  )
}
