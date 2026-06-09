"use client"

import { useApp } from "./app-context"
import { FeaturePanel } from "./feature-panel"
import { SavedPanel } from "./panels/saved-panel"
import { HistoryPanel } from "./panels/history-panel"
import { ComparePanel } from "./panels/compare-panel"
import { EnquiriesPanel } from "./panels/enquiries-panel"
import { ExplorePanel } from "./panels/explore-panel"
import type { ChatMessage } from "./chat-thread"
import type { SerpVenue } from "@/lib/serpapi"

const META: Record<string, { title: string; description?: string }> = {
  saved: { title: "Saved venues", description: "Your bookmarked shortlist" },
  history: { title: "Search history", description: "Reopen a past conversation" },
  compare: { title: "Compare venues", description: "Up to 3 side by side" },
  enquiries: { title: "Enquiries", description: "Venues you're in touch with" },
  explore: { title: "Explore Hong Kong", description: "Browse by area or event type" },
}

interface FeaturePanelsProps {
  onSelectVenue: (v: SerpVenue) => void
  onRestoreChat: (messages: ChatMessage[]) => void
  onExploreSearch: (query: string) => void
}

export function FeaturePanels({
  onSelectVenue,
  onRestoreChat,
  onExploreSearch,
}: FeaturePanelsProps) {
  const { activePanel, closePanel } = useApp()
  const meta = activePanel ? META[activePanel] : null

  return (
    <FeaturePanel
      open={activePanel !== null}
      title={meta?.title ?? ""}
      description={meta?.description}
      onClose={closePanel}
    >
      {activePanel === "saved" && <SavedPanel onSelectVenue={onSelectVenue} />}
      {activePanel === "history" && <HistoryPanel onRestore={onRestoreChat} />}
      {activePanel === "compare" && <ComparePanel onSelectVenue={onSelectVenue} />}
      {activePanel === "enquiries" && (
        <EnquiriesPanel onSelectVenue={onSelectVenue} />
      )}
      {activePanel === "explore" && <ExplorePanel onSearch={onExploreSearch} />}
    </FeaturePanel>
  )
}
