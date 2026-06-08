"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { SearchResultCard } from "./search-result-card"
import { VenueResultsSkeleton } from "./venue-card-skeleton"
import { LoadingMessage } from "./loading-message"
import type { SerpVenue } from "@/lib/serpapi"

const PAGE_SIZE = 6

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  text?: string
  venues?: SerpVenue[]
  loading?: boolean
  /** "thinking" = short conversational typing dots, "searching" = venue shimmer */
  loadingKind?: "thinking" | "searching"
  error?: string
}

interface ChatThreadProps {
  messages: ChatMessage[]
  onSelectVenue: (venue: SerpVenue) => void
}

function VenueResults({
  venues,
  onSelectVenue,
}: {
  venues: SerpVenue[]
  onSelectVenue: (venue: SerpVenue) => void
}) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  const shown = venues.slice(0, visible)
  const remaining = venues.length - visible

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {shown.map((venue) => (
          <SearchResultCard
            key={venue.id}
            venue={venue}
            onClick={onSelectVenue}
          />
        ))}
      </div>
      {remaining > 0 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e8bdb6] bg-[#ffffff] px-4 py-2 text-sm font-semibold text-[#9e0000] shadow-sm transition-colors hover:bg-[#fdecea]"
          >
            View {Math.min(remaining, PAGE_SIZE)} more
            <ChevronDown size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

export function ChatThread({ messages, onSelectVenue }: ChatThreadProps) {
  return (
    <div className="flex flex-col gap-6 pt-8 pb-4 w-full">
      {messages.map((message) =>
        message.role === "user" ? (
          <div key={message.id} className="flex justify-end">
            <div className="max-w-[80%] bg-[#9e0000] text-white rounded-2xl rounded-br-md px-4 py-2.5 text-[15px] leading-6 shadow-sm">
              {message.text}
            </div>
          </div>
        ) : (
          <div key={message.id} className="flex flex-col gap-3 w-full">
            {message.loading ? (
              message.loadingKind === "searching" ? (
                <VenueResultsSkeleton />
                  ) : (
                    <LoadingMessage kind="thinking" />
                  )
            ) : message.error ? (
              <div className="bg-[#fdecea] border border-[#e8bdb6] text-[#9e0000] rounded-xl px-4 py-3 text-sm">
                {message.error}
              </div>
            ) : (
              <>
                {message.text && (
                  <p className="text-[15px] leading-7 text-[#1a1c1c]">
                    {message.text}
                  </p>
                )}
                {message.venues && message.venues.length > 0 && (
                  <VenueResults
                    venues={message.venues}
                    onSelectVenue={onSelectVenue}
                  />
                )}
              </>
            )}
          </div>
        ),
      )}
    </div>
  )
}
