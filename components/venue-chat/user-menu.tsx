"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Settings,
  LayoutDashboard,
  Sparkles,
  HelpCircle,
  LogOut,
  LogIn,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "./app-context"
import { signOut } from "@/app/actions/venue-actions"

interface UserMenuProps {
  /** Horizontal anchor of the popover relative to the trigger. */
  align?: "left" | "right"
  /** Vertical placement: "top" opens above the trigger, "bottom" below. */
  placement?: "top" | "bottom"
  /** Render the trigger. Receives onClick + open state. */
  children: (props: { onClick: () => void; open: boolean }) => React.ReactNode
}

export function UserMenu({ align = "left", placement = "top", children }: UserMenuProps) {
  const { user, openSettings, openListMode } = useApp()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  // Logged out → trigger goes straight to login, no menu.
  if (!user) {
    return (
      <div ref={ref} className="relative">
        {children({ onClick: () => router.push("/auth/login"), open: false })}
      </div>
    )
  }

  const initial = user.email ? user.email[0].toUpperCase() : "?"
  const name = (user.user_metadata?.display_name as string) || "Your account"

  const items = [
    {
      icon: Settings,
      label: "Settings",
      onClick: () => {
        setOpen(false)
        openSettings("account")
      },
    },
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      onClick: () => {
        setOpen(false)
        router.push("/dashboard")
      },
    },
    {
      icon: Sparkles,
      label: "List your venue",
      onClick: () => {
        setOpen(false)
        openListMode()
      },
    },
    {
      icon: Sparkles,
      label: "Upgrade plan",
      onClick: () => {
        setOpen(false)
        router.push("/pricing")
      },
    },
    {
      icon: HelpCircle,
      label: "Help",
      onClick: () => {
        setOpen(false)
        window.open("https://sher.hk", "_blank", "noopener,noreferrer")
      },
    },
  ]

  return (
    <div ref={ref} className="relative">
      {children({ onClick: () => setOpen((o) => !o), open })}

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-[75] w-64 overflow-hidden rounded-2xl border border-[#e8bdb6] bg-white py-1.5 shadow-xl",
            placement === "top" ? "bottom-full mb-2" : "top-full mt-2",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map(({ icon: Icon, label, onClick }) => (
            <button
              key={label}
              role="menuitem"
              onClick={onClick}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-[#1a1c1c] transition-colors hover:bg-[#f7efee]"
            >
              <Icon size={17} className="text-[#5e3f3a]" />
              {label}
            </button>
          ))}

          <div className="my-1 border-t border-[#eceae9]" />

          <button
            role="menuitem"
            onClick={async () => {
              setOpen(false)
              await signOut()
              window.location.href = "/"
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-[#9e0000] transition-colors hover:bg-[#fdecea]"
          >
            <LogOut size={17} />
            Sign out
          </button>

          <div className="mt-1 flex items-center gap-3 border-t border-[#eceae9] px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9e0000] text-sm font-bold text-white">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#1a1c1c]">
                {name}
              </p>
              <p className="truncate text-xs text-[#8a7a77]">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Small inline icon for the logged-out sign-in affordance. */
export { LogIn }
