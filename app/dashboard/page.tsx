import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Heart, MessageSquare, Send, Sparkles, MapPin } from "lucide-react"
import { getDashboardData } from "@/app/actions/venue-actions"
import { AvatarUploader } from "@/components/dashboard/avatar-uploader"
import { AccountForm } from "@/components/dashboard/account-form"
import { SignOutButton } from "@/components/dashboard/sign-out-button"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Dashboard | VenueChat",
  description: "Manage your account, saved venues, and enquiries.",
}

interface VenueJson {
  name?: string
  address?: string
  thumbnail?: string
}

function formatDate(value?: string | null) {
  if (!value) return ""
  return new Date(value).toLocaleDateString("en-HK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const data = await getDashboardData()
  if (!data) redirect("/auth/login")

  const name = data.profile?.display_name || data.email.split("@")[0]
  const fallback = (name?.[0] || "U").toUpperCase()

  const stats = [
    { label: "Saved venues", value: data.counts.saved, icon: Heart, href: "/?panel=saved" },
    { label: "Enquiries", value: data.counts.enquiries, icon: Send, href: "/?panel=enquiries" },
    { label: "Chat sessions", value: data.counts.chats, icon: MessageSquare, href: "/?panel=history" },
  ]

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-[#eceae9]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#5e3f3a] hover:text-[#1a1c1c] transition-colors"
          >
            <ArrowLeft size={16} />
            Back to chat
          </Link>
          <Link href="/" className="text-[#9e0000] font-black text-lg tracking-tight">
            VenueChat
          </Link>
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[#1a1c1c] text-balance">
          Welcome back, {name}
        </h1>
        <p className="text-sm text-[#5f5e5e] mt-1">
          Manage your profile, preferences, and saved venues.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {stats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="bg-white border border-[#eceae9] rounded-2xl p-5 flex items-center gap-4 hover:border-[#e8bdb6] transition-colors"
            >
              <span className="w-11 h-11 rounded-full bg-[#fdecea] text-[#9e0000] flex items-center justify-center">
                <s.icon size={20} />
              </span>
              <span>
                <span className="block text-2xl font-bold text-[#1a1c1c] leading-none">
                  {s.value}
                </span>
                <span className="block text-sm text-[#5f5e5e] mt-1">{s.label}</span>
              </span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left column: profile + account */}
          <section className="lg:col-span-2 bg-white border border-[#eceae9] rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <AvatarUploader
                userId={user.id}
                initialUrl={data.profile?.avatar_url ?? null}
                fallback={fallback}
              />
              <div className="flex-1 min-w-0">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-[#1a1c1c]">Account</h2>
                  <p className="text-sm text-[#5f5e5e] break-all">{data.email}</p>
                  <p className="text-xs text-[#9a9999] mt-0.5">
                    Member since {formatDate(data.createdAt)}
                  </p>
                </div>
                <AccountForm
                  initial={{
                    display_name: data.profile?.display_name ?? null,
                    default_guest_count: data.profile?.default_guest_count ?? null,
                    default_budget: data.profile?.default_budget ?? null,
                    default_event_type: data.profile?.default_event_type ?? null,
                    default_district: data.profile?.default_district ?? null,
                  }}
                />
              </div>
            </div>
          </section>

          {/* Right column: plan + recent activity */}
          <div className="flex flex-col gap-6">
            {/* Plans CTA */}
            <section className="bg-[#9e0000] text-white rounded-2xl p-6">
              <Sparkles size={22} className="mb-3" />
              <h2 className="text-lg font-semibold">List your venue</h2>
              <p className="text-sm text-white/80 mt-1 leading-relaxed">
                Own a venue? Reach thousands of event planners searching on VenueChat.
              </p>
              <Link
                href="/owner"
                className="inline-flex items-center justify-center rounded-full bg-white text-[#9e0000] px-4 py-2 text-sm font-semibold mt-4 hover:bg-white/90 transition-colors"
              >
                Manage listings
              </Link>
            </section>

            {/* Recent saved */}
            <section className="bg-white border border-[#eceae9] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#1a1c1c]">Recently saved</h2>
                <Link href="/?panel=saved" className="text-xs font-medium text-[#9e0000] hover:underline">
                  View all
                </Link>
              </div>
              {data.recentSaved.length === 0 ? (
                <p className="text-sm text-[#9a9999]">No saved venues yet.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {data.recentSaved.map((row) => {
                    const v = (row.venue ?? {}) as VenueJson
                    return (
                      <li key={row.id} className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-lg bg-[#f3f3f3] text-[#9e0000] flex items-center justify-center shrink-0">
                          <MapPin size={15} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-[#1a1c1c] truncate">
                            {v.name || "Venue"}
                          </span>
                          {v.address && (
                            <span className="block text-xs text-[#9a9999] truncate">
                              {v.address}
                            </span>
                          )}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
