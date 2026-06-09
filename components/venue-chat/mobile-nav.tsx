"use client"

import { X, Plus, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "./app-context"
import { NAV_ITEMS } from "./nav-items"

interface MobileNavProps {
  open: boolean
  onClose: () => void
  onNewChat: () => void
}

export function MobileNav({ open, onClose, onNewChat }: MobileNavProps) {
  const { openPanel, openSettings, user } = useApp()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <nav
        className="absolute left-0 top-0 bottom-0 w-64 bg-[#f9f9f9] border-r border-[#e8bdb6] flex flex-col py-4 px-4 gap-1 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-[#9e0000] font-black text-lg tracking-tight">
            VenueChat
          </span>
          <button
            aria-label="Close menu"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#e8e8e8] text-[#5e3f3a] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <button
          onClick={() => {
            onNewChat()
            onClose()
          }}
          className="flex items-center gap-2.5 text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#5e3f3a] hover:bg-[#e8e8e8] transition-colors"
        >
          <Plus size={18} />
          New Chat
        </button>

        {NAV_ITEMS.map(({ icon: Icon, label, id }) => (
          <button
            key={id}
            onClick={() => {
              openPanel(id)
              onClose()
            }}
            className="flex items-center gap-2.5 text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#5e3f3a] hover:bg-[#e8e8e8] transition-colors"
          >
            <Icon size={18} />
            {label}
          </button>
        ))}

        <button
          onClick={() => {
            openSettings("account")
            onClose()
          }}
          className="flex items-center gap-2.5 text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#5e3f3a] hover:bg-[#e8e8e8] transition-colors mt-auto"
        >
          <Settings size={18} />
          {user ? "Settings" : "Sign in"}
        </button>
      </nav>
    </div>
  )
}
