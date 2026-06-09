"use client"

export const dynamic = "force-dynamic"

import { useState, useRef, useEffect, useCallback } from "react"
import { NavigationSidebar } from "@/components/venue-chat/navigation-sidebar"
import { TopAppBar } from "@/components/venue-chat/top-app-bar"
import { WelcomeScreen } from "@/components/venue-chat/welcome-screen"
import { ChatInput } from "@/components/venue-chat/chat-input"
import { ChatThread, type ChatMessage } from "@/components/venue-chat/chat-thread"
import { VenueDetailDialog } from "@/components/venue-chat/venue-detail-dialog"
import { AppProvider, useApp, type PanelId } from "@/components/venue-chat/app-context"
import { FeaturePanels } from "@/components/venue-chat/feature-panels"
import { SettingsDialog } from "@/components/venue-chat/settings-dialog"
import { MobileNav } from "@/components/venue-chat/mobile-nav"
import { AiVenueCreator } from "@/components/owner/ai-venue-creator"
import { saveChatSession } from "@/app/actions/venue-actions"
import type { SerpVenue } from "@/lib/serpapi"
import type { User } from "@supabase/supabase-js"
import { ArrowLeft, LogIn } from "lucide-react"
import Link from "next/link"

export default function VenueChatPage() {
  return (
    <AppProvider>
      <VenueChatWorkspace />
    </AppProvider>
  )
}

function VenueChatWorkspace() {
  const { user, openPanel, openSettings, closePanel, bumpData, listMode, openListMode, closeListMode } =
    useApp()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState<SerpVenue | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const savedSessionRef = useRef<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const hasConversation = messages.length > 0

  // Open a panel/settings when arriving via /?panel=... or /?settings=...
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const panel = params.get("panel")
    const settings = params.get("settings")
    const list = params.get("list")
    const validPanels = ["saved", "history", "compare", "enquiries", "explore"]
    const validTabs = ["account", "preferences", "data"]
    if (panel && validPanels.includes(panel)) {
      openPanel(panel as Exclude<PanelId, null>)
    }
    if (settings !== null) {
      openSettings(
        (validTabs.includes(settings) ? settings : "account") as
          | "account"
          | "preferences"
          | "data",
      )
    }
    if (list !== null) {
      openListMode()
    }
    if (panel || settings !== null || list !== null) {
      const url = new URL(window.location.href)
      url.searchParams.delete("panel")
      url.searchParams.delete("settings")
      url.searchParams.delete("list")
      window.history.replaceState({}, "", url.pathname + url.search)
    }
  }, [openPanel, openSettings, openListMode])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages])

  const getUserCoords = () =>
    new Promise<{ lat: number; lng: number } | null>((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        resolve(null)
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 8000, maximumAge: 60000 },
      )
    })

  const handleSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim()
      if (!trimmed) return

      const userId = `user-${Date.now()}`
      const assistantId = `assistant-${Date.now()}`

      // Snapshot history before adding the new turn (for AI context)
      const history = messages
        .filter((m) => m.text)
        .map((m) => ({ role: m.role, text: m.text }))

      setMessages((prev) => [
        ...prev,
        { id: userId, role: "user", text: trimmed },
        { id: assistantId, role: "assistant", loading: true, loadingKind: "thinking" },
      ])
      setIsSearching(true)

      try {
        // 1) Understand intent + optimize the query with the AI
        const understandRes = await fetch("/api/venues/understand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history }),
        })
        const intent = await understandRes.json()

        // 2) Non-search intents → just reply conversationally, no venue lookup
        if (intent.intent && intent.intent !== "search") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    loading: false,
                    text:
                      intent.reply ||
                      "How can I help you find the perfect space in Hong Kong?",
                  }
                : m,
            ),
          )
          return
        }

        // 3) Search intent → switch to shimmer skeleton and fetch venues
        const searchQuery: string =
          (intent.searchQuery && intent.searchQuery.trim()) || trimmed

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, loadingKind: "searching" } : m,
          ),
        )

        // Resolve coordinates only when the user asked for "near me"
        let coordsParam = ""
        if (intent.wantsNearMe) {
          const coords = await getUserCoords()
          if (coords) coordsParam = `&lat=${coords.lat}&lng=${coords.lng}`
        }

        const res = await fetch(
          `/api/venues/search?q=${encodeURIComponent(searchQuery)}${coordsParam}`,
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Search failed")

        const venues: SerpVenue[] = data.venues ?? []
        const intro: string = intent.introText?.trim()
        const summary =
          venues.length > 0
            ? intro ||
              `Here are ${venues.length} great ${
                venues.length === 1 ? "option" : "options"
              } in Hong Kong${
                intent.wantsNearMe && coordsParam ? " near you" : ""
              }. Tap any card for photos, updates and directions.`
            : `I couldn't find venues matching that just yet. Try a different neighbourhood, event type, or keyword.`

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, loading: false, text: summary, venues }
              : m,
          ),
        )
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Something went wrong"
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  loading: false,
                  error: `Sorry, something went wrong: ${message}`,
                }
              : m,
          ),
        )
      } finally {
        setIsSearching(false)
      }
    },
    [messages],
  )

  // Persist the conversation once an assistant reply has resolved.
  useEffect(() => {
    if (!user) return
    if (messages.length < 2) return
    const last = messages[messages.length - 1]
    if (last.role !== "assistant" || last.loading) return

    const firstUser = messages.find((m) => m.role === "user")
    const title = firstUser?.text?.slice(0, 80) || "Venue search"

    const timeout = setTimeout(async () => {
      const res = await saveChatSession(title, messages)
      if (res.ok && res.id) {
        savedSessionRef.current = res.id
        bumpData()
      }
    }, 800)
    return () => clearTimeout(timeout)
    // Only react to message count / last loading state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, messages[messages.length - 1]?.loading, user])

  const handleNewChat = useCallback(() => {
    setMessages([])
    savedSessionRef.current = null
    closePanel()
  }, [closePanel])

  const handleRestoreChat = useCallback(
    (restored: ChatMessage[]) => {
      setMessages(restored)
      savedSessionRef.current = null
      closePanel()
    },
    [closePanel],
  )

  const handleExploreSearch = useCallback(
    (query: string) => {
      closePanel()
      handleSearch(query)
    },
    [closePanel, handleSearch],
  )

  const handleSelectVenue = (venue: SerpVenue) => {
    setSelectedVenue(venue)
    setDetailOpen(true)
  }

  return (
    <div className="flex h-[100dvh] w-full bg-[#f9f9f9] overflow-hidden text-[#1a1c1c]">
      {/* Desktop sidebar */}
      <NavigationSidebar onNewChat={handleNewChat} />

      {/* Mobile nav drawer */}
      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onNewChat={handleNewChat}
      />

      {/* Main workspace */}
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden">
        <TopAppBar onMenuClick={() => setMobileNavOpen(true)} />

        {listMode ? (
          /* Inline "List your venue" — chat left, live preview right */
          <ListVenueWorkspace user={user} onExit={closeListMode} />
        ) : (
          <>
            {/* Scrollable canvas */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto vc-scroll w-full">
              <div className="max-w-[800px] mx-auto w-full px-6 md:px-0">
                {hasConversation ? (
                  <div className="pt-16 md:pt-6">
                    <ChatThread messages={messages} onSelectVenue={handleSelectVenue} />
                  </div>
                ) : (
                  <WelcomeScreen onSearch={handleSearch} />
                )}
              </div>
            </div>

            {/* Input dock — fixed to bottom of the flex column */}
            <div className="w-full px-4 md:px-8 py-4 pb-8 flex flex-col items-center gap-1 bg-gradient-to-t from-[#f9f9f9] via-[#f9f9f9]/95 to-transparent">
              <div className="max-w-[760px] w-full">
                <ChatInput onSubmit={handleSearch} disabled={isSearching} />
              </div>
              <p className="text-xs text-[#926e69] text-center pt-1">
                Designed with{" "}
                <span aria-label="love" className="text-[#9e0000]">
                  &hearts;
                </span>{" "}
                by{" "}
                <a
                  href="https://sher.hk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#9e0000] hover:underline"
                >
                  Sheryar Shah
                </a>
              </p>
            </div>
          </>
        )}
      </main>

      {/* Venue detail + photos */}
      <VenueDetailDialog
        venue={selectedVenue}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Feature slide-over panels */}
      <FeaturePanels
        onSelectVenue={handleSelectVenue}
        onRestoreChat={handleRestoreChat}
        onExploreSearch={handleExploreSearch}
      />

      {/* Grok-style centered settings modal */}
      <SettingsDialog />
    </div>
  )
}

/* ---------- Inline "List your venue" workspace (stays on the homepage) ---------- */

function ListVenueWorkspace({
  user,
  onExit,
}: {
  user: User | null
  onExit: () => void
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0 w-full">
      {/* Slim header bar */}
      <div className="flex items-center gap-3 px-4 md:px-6 pt-16 md:pt-4 pb-3 shrink-0">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#e8bdb6] bg-white px-3 py-1.5 text-sm font-semibold text-[#5e3f3a] transition-colors hover:border-[#9e0000] hover:text-[#9e0000]"
        >
          <ArrowLeft size={15} />
          Back to search
        </button>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-[#1a1c1c] leading-tight">List your venue</h1>
          <p className="text-xs text-[#8a7a77] truncate">
            Describe your space — watch the listing build live on the right
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 px-4 md:px-6 pb-4">
        {user ? (
          <AiVenueCreator userId={user.id} onExit={onExit} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="max-w-sm w-full text-center rounded-2xl border border-[#eceae9] bg-white p-8">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#9e0000]/10 text-[#9e0000] mb-4">
                <LogIn size={22} />
              </span>
              <h2 className="text-base font-bold text-[#1a1c1c]">Sign in to list your venue</h2>
              <p className="text-sm text-[#8a7a77] mt-1.5 leading-relaxed">
                You&apos;ll need an account so we can save your listing and connect you with
                event planners.
              </p>
              <Link
                href="/auth/login"
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#9e0000] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7e0000]"
              >
                Sign in to continue
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
