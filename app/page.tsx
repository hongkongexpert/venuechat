"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { NavigationSidebar } from "@/components/venue-chat/navigation-sidebar"
import { TopAppBar } from "@/components/venue-chat/top-app-bar"
import { WelcomeScreen } from "@/components/venue-chat/welcome-screen"
import { ChatInput } from "@/components/venue-chat/chat-input"
import { ChatThread, type ChatMessage } from "@/components/venue-chat/chat-thread"
import { VenueDetailDialog } from "@/components/venue-chat/venue-detail-dialog"
import { AppProvider, useApp } from "@/components/venue-chat/app-context"
import { FeaturePanels } from "@/components/venue-chat/feature-panels"
import { MobileNav } from "@/components/venue-chat/mobile-nav"
import { saveChatSession } from "@/app/actions/venue-actions"
import type { SerpVenue } from "@/lib/serpapi"

export default function VenueChatPage() {
  return (
    <AppProvider>
      <VenueChatWorkspace />
    </AppProvider>
  )
}

function VenueChatWorkspace() {
  const { user, closePanel, bumpData } = useApp()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState<SerpVenue | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const savedSessionRef = useRef<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const hasConversation = messages.length > 0

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
              }. Tap any card for photos, reviews and directions.`
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
    <div className="flex h-screen w-full bg-[#f9f9f9] overflow-hidden text-[#1a1c1c]">
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
    </div>
  )
}
