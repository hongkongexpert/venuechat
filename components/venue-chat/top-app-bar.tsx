"use client"

import { Menu, LogIn } from "lucide-react"
import Link from "next/link"
import { useApp } from "./app-context"
import { UserMenu } from "./user-menu"

interface TopAppBarProps {
  onMenuClick?: () => void
}

export function TopAppBar({ onMenuClick }: TopAppBarProps) {
  const { user } = useApp()
  return (
    <header className="pointer-events-none absolute top-0 left-0 z-40 w-full">
      <div className="relative flex items-center justify-between px-4 h-14 max-w-[800px] mx-auto w-full">
        {/* Left: Hamburger (mobile only) */}
        <button
          aria-label="Open menu"
          onClick={onMenuClick}
          className="pointer-events-auto md:hidden w-9 h-9 flex items-center justify-center rounded-full bg-[#f9f9f9]/80 backdrop-blur-md text-[#5e3f3a] hover:bg-[#e8e8e8] transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Right: Avatar → account menu (mobile only) */}
        <div className="pointer-events-auto md:hidden">
          <UserMenu align="right" placement="bottom">
            {({ onClick }) => (
              <button
                aria-label={user ? "Account menu" : "Sign in"}
                onClick={onClick}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#f3f3f3]/90 backdrop-blur-md border border-[#e8bdb6]/60 text-[#5e3f3a] hover:bg-[#e8e8e8] transition-colors"
              >
                {user?.email ? (
                  <span className="text-sm font-bold text-[#9e0000]">
                    {user.email[0].toUpperCase()}
                  </span>
                ) : (
                  <LogIn size={15} />
                )}
              </button>
            )}
          </UserMenu>
        </div>

        {/* Right: Desktop sign-in pill (logged out only) */}
        {!user && (
          <Link
            href="/auth/login"
            className="pointer-events-auto ml-auto hidden md:inline-flex items-center gap-1.5 rounded-full bg-[#9e0000] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            <LogIn size={15} />
            Sign in
          </Link>
        )}
      </div>
    </header>
  )
}
