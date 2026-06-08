"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeaturePanelProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: React.ReactNode
}

export function FeaturePanel({
  open,
  title,
  description,
  onClose,
  children,
}: FeaturePanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over */}
      <aside
        role="dialog"
        aria-label={title}
        className={cn(
          "fixed right-0 top-0 bottom-0 z-[70] flex w-full max-w-md flex-col bg-[#f9f9f9] shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-[#e8bdb6] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#1a1c1c]">{title}</h2>
            {description && (
              <p className="mt-0.5 text-sm text-[#5f5e5e]">{description}</p>
            )}
          </div>
          <button
            aria-label="Close panel"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#5e3f3a] transition-colors hover:bg-[#e8e8e8]"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto vc-scroll px-5 py-4">
          {children}
        </div>
      </aside>
    </>
  )
}
