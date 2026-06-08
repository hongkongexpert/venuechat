import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OwnerHeader } from "@/components/owner/owner-header"
import { AiVenueCreator } from "@/components/owner/ai-venue-creator"

export const metadata = {
  title: "Create a listing with AI | VenueChat",
}

export default async function NewAiVenuePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/owner/venues/ai")

  return (
    <div className="min-h-screen bg-[#fbf9f8]">
      <OwnerHeader />
      <main className="px-4 py-6">
        <AiVenueCreator userId={user.id} />
      </main>
    </div>
  )
}
