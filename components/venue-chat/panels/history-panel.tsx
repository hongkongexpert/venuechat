"use client"

import { useEffect, useState } from "react"
import { Spinner } from "@/components/ui/spinner"
import { MessageSquare, Trash2 } from "lucide-react"
import { useApp } from "../app-context"
import { AuthGate, EmptyState } from "../panel-shared"
import { getChatSessions, deleteChatSession } from "@/app/actions/venue-actions"
import type { ChatMessage } from "../chat-thread"

interface SessionRow {
  id: string
  title: string
  messages: ChatMessage[]
  updated_at: string
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function HistoryPanel({
  onRestore,
}: {
  onRestore: (messages: ChatMessage[]) => void
}) {
  const { user, loadingUser, dataVersion, bumpData } = useApp()
  const [rows, setRows] = useState<SessionRow[] | null>(null)

  useEffect(() => {
    if (!user) {
      setRows([])
      return
    }
    setRows(null)
    getChatSessions().then((data) => setRows(data as SessionRow[]))
  }, [user, dataVersion])

  if (loadingUser) return <PanelSpinner />
  if (!user)
    return (
      <AuthGate message="Sign in to keep a history of your searches and reopen them anytime." />
    )
  if (rows === null) return <PanelSpinner />
  if (rows.length === 0)
    return (
      <EmptyState message="No past searches yet. Your conversations will be saved here automatically." />
    )

  const handleRemove = async (id: string) => {
    setRows((prev) => prev?.filter((r) => r.id !== id) ?? null)
    await deleteChatSession(id)
    bumpData()
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex items-center gap-2 rounded-xl border border-[#e8bdb6] bg-white p-3"
        >
          <button
            onClick={() => onRestore(row.messages)}
            className="flex flex-1 items-start gap-3 text-left min-w-0"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fdecea] text-[#9e0000]">
              <MessageSquare size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#1a1c1c]">
                {row.title}
              </p>
              <p className="text-xs text-[#5f5e5e]">{timeAgo(row.updated_at)}</p>
            </div>
          </button>
          <button
            aria-label="Delete conversation"
            onClick={() => handleRemove(row.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#5e3f3a] hover:bg-[#fdecea] hover:text-[#9e0000] transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </div>
  )
}

function PanelSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner className="size-5" />
    </div>
  )
}
