"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Sparkles,
  ChevronRight,
  ImageIcon,
  LogOut,
  User,
  Plus,
  Home,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react"
import { signOut } from "@/app/actions/venue-actions"
import type { VenueListing } from "@/app/actions/venue-actions"

interface OwnerShellProps {
  children: React.ReactNode
  venues: VenueListing[]
  activeVenueId?: string
  view: "ai" | "venue" | "dashboard"
  userName: string
  userEmail: string
  avatarUrl?: string | null
}

function StatusDot({ status }: { status: string | null }) {
  const active = status === "active"
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${active ? "bg-[#3f8f4f]" : "bg-[#c4b8b5]"}`}
      title={active ? "Published" : "Draft"}
    />
  )
}

export function OwnerShell({
  children,
  venues,
  activeVenueId,
  view,
  userName,
  userEmail,
  avatarUrl,
}: OwnerShellProps) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const initials = (userName?.[0] || userEmail?.[0] || "U").toUpperCase()

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    router.push("/")
    router.refresh()
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0eeed]">
        <Link href="/" className="text-[#9e0000] font-black text-lg tracking-tight">
          VenueChat
        </Link>
        <button
          className="lg:hidden p-1 rounded-md text-[#8a7a77] hover:text-[#1a1c1c]"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            view === "dashboard"
              ? "bg-[#fdecea] text-[#9e0000]"
              : "text-[#5e3f3a] hover:bg-[#f6f4f3]"
          }`}
          onClick={() => setMobileOpen(false)}
        >
          <Home size={16} className="shrink-0" />
          Dashboard
        </Link>

        {/* Create with AI — primary action */}
        <Link
          href="/owner"
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            view === "ai" && !activeVenueId
              ? "bg-[#9e0000] text-white"
              : "bg-[#fdecea] text-[#9e0000] hover:bg-[#f7d7d5]"
          }`}
          onClick={() => setMobileOpen(false)}
        >
          <Sparkles size={16} className="shrink-0" />
          Create with AI
          {view !== "ai" && (
            <span className="ml-auto text-[10px] font-bold bg-[#9e0000] text-white rounded-full px-2 py-0.5">
              NEW
            </span>
          )}
        </Link>

        {/* Claim a venue */}
        <Link
          href="/owner/claims"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-[#5e3f3a] hover:bg-[#f6f4f3] transition-colors"
          onClick={() => setMobileOpen(false)}
        >
          <ShieldCheck size={16} className="shrink-0" />
          Claim a venue
        </Link>

        {/* Divider */}
        {venues.length > 0 && (
          <div className="mt-3 mb-1 px-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#b8aeac]">
              Your Listings
            </p>
          </div>
        )}

        {/* Venue list */}
        {venues.map((v) => (
          <Link
            key={v.id}
            href={`/owner/venues/${v.id}`}
            onClick={() => setMobileOpen(false)}
            className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              activeVenueId === v.id
                ? "bg-[#fdecea] text-[#9e0000]"
                : "text-[#5e3f3a] hover:bg-[#f6f4f3]"
            }`}
          >
            <span className="relative h-8 w-8 shrink-0 rounded-lg overflow-hidden bg-[#f0eeed] flex items-center justify-center">
              {v.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.cover_image} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon size={13} className="text-[#b8aeac]" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate leading-tight">{v.name}</span>
              <span className="flex items-center gap-1 mt-0.5">
                <StatusDot status={v.status} />
                <span className="text-[11px] text-[#8a7a77]">
                  {v.status === "active" ? "Published" : "Draft"}
                  {v.view_count ? ` · ${v.view_count} views` : ""}
                </span>
              </span>
            </span>
            <ChevronRight
              size={14}
              className={`shrink-0 transition-opacity ${
                activeVenueId === v.id ? "opacity-60" : "opacity-0 group-hover:opacity-40"
              }`}
            />
          </Link>
        ))}

        {/* Add new listing link */}
        <Link
          href="/owner/venues/new"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5 rounded-xl border border-dashed border-[#e0dcdb] px-3 py-2.5 text-sm font-medium text-[#8a7a77] hover:border-[#9e0000] hover:text-[#9e0000] transition-colors mt-1"
        >
          <Plus size={15} className="shrink-0" />
          Add manually
        </Link>
      </nav>

      {/* User account footer */}
      <div className="border-t border-[#f0eeed] p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={userName}
              className="h-8 w-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <span className="h-8 w-8 rounded-full bg-[#9e0000] text-white flex items-center justify-center text-sm font-bold shrink-0">
              {initials}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#1a1c1c] truncate">{userName}</p>
            <p className="text-[11px] text-[#8a7a77] truncate">{userEmail}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href="/dashboard"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-[#8a7a77] hover:bg-[#f6f4f3] hover:text-[#1a1c1c] transition-colors"
              title="Profile"
            >
              <User size={15} />
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-[#8a7a77] hover:bg-[#f6f4f3] hover:text-[#9e0000] transition-colors disabled:opacity-40"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f5f3f2] flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-[#eceae9] flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:flex ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-10 bg-white border-b border-[#eceae9] flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-[#5e3f3a] hover:bg-[#f6f4f3]"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <Link href="/" className="text-[#9e0000] font-black text-lg tracking-tight">
            VenueChat
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
