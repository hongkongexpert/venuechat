"use client"

import { Plus, Settings, LogIn } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "./app-context"
import { NAV_ITEMS } from "./nav-items"
import { UserMenu } from "./user-menu"

interface NavigationSidebarProps {
  onNewChat?: () => void
}

export function NavigationSidebar({ onNewChat }: NavigationSidebarProps) {
  const { activePanel, openPanel, openSettings, user, compare } = useApp()

  return (
    <nav
      aria-label="Main navigation"
      className="hidden md:flex flex-col items-center py-4 gap-2 bg-[#f9f9f9] border-r border-[#e8bdb6] w-16 h-full z-50 shrink-0"
    >
      {/* New Chat */}
      <button
        aria-label="New chat"
        title="New chat"
        onClick={() => onNewChat?.()}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-[#9e0000] text-white shadow-sm hover:opacity-90 transition-opacity"
      >
        <Plus size={20} />
      </button>

      {/* Nav Items */}
      <div className="flex flex-col gap-1 w-full px-2 mt-2">
        {NAV_ITEMS.map(({ icon: Icon, label, id }) => {
          const isActive = activePanel === id
          const showBadge = id === "compare" && compare.length > 0
          return (
            <button
              key={id}
              aria-label={label}
              title={label}
              onClick={() => openPanel(id)}
              className={cn(
                "relative w-12 h-12 flex items-center justify-center rounded-lg transition-all mx-auto",
                isActive
                  ? "bg-[#e2dfde] text-[#1a1c1c]"
                  : "text-[#5e3f3a] hover:bg-[#e8e8e8]",
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              {showBadge && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-[#9e0000] text-white text-[10px] font-bold">
                  {compare.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings (quick access) */}
      <button
        aria-label="Settings"
        title="Settings"
        onClick={() => openSettings("account")}
        className="w-10 h-10 flex items-center justify-center rounded-full text-[#5e3f3a] hover:bg-[#e8e8e8] transition-colors"
      >
        <Settings size={18} />
      </button>

      {/* User avatar → account menu (or sign in) */}
      <UserMenu align="left">
        {({ onClick }) => (
          <button
            aria-label={user ? "Account menu" : "Sign in"}
            title={user ? "Account menu" : "Sign in"}
            onClick={onClick}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer shadow-sm select-none transition-colors",
              user
                ? "bg-[#9e0000] text-white hover:opacity-90"
                : "bg-[#f3f3f3] border border-[#e8bdb6]/70 text-[#5e3f3a] hover:bg-[#e8e8e8]",
            )}
          >
            {user?.email ? user.email[0].toUpperCase() : <LogIn size={15} />}
          </button>
        )}
      </UserMenu>
    </nav>
  )
}
