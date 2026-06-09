import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAllClaims, isAdmin } from "@/app/actions/claim-actions"
import { AdminClaimsClient } from "@/components/admin/admin-claims-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Venue Claims | Admin",
}

type Filter = "pending" | "approved" | "rejected"

export default async function AdminClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/admin/claims")

  if (!(await isAdmin())) redirect("/")

  const { status } = await searchParams
  const filter: Filter =
    status === "approved" || status === "rejected" ? status : "pending"

  const claims = await getAllClaims(filter)

  return (
    <main className="min-h-screen bg-[#f5f3f2]">
      <header className="sticky top-0 z-10 bg-white border-b border-[#eceae9]">
        <div className="max-w-3xl mx-auto px-4 lg:px-6 h-14 flex items-center justify-between">
          <a
            href="/"
            className="text-[#9e0000] font-black text-lg tracking-tight"
          >
            VenueChat
          </a>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#b8aeac]">
            Admin
          </span>
        </div>
      </header>
      <AdminClaimsClient initialClaims={claims} initialFilter={filter} />
    </main>
  )
}
