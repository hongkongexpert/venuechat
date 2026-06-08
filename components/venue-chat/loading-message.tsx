"use client"

import { useEffect, useState } from "react"
import { Sparkles, Search, Wand2, Compass, PartyPopper, MapPin } from "lucide-react"

const THINKING_PHRASES = [
  "Thinking…",
  "Putting on my party hat…",
  "Consulting the venue gods…",
  "Crunching the vibes…",
  "Reading between the lines…",
  "Cooking up something good…",
]

const SEARCHING_PHRASES = [
  "Finding the best venues for you…",
  "Scouting hidden gems…",
  "Peeking behind velvet ropes…",
  "Rounding up the hot spots…",
  "Checking the guest lists…",
  "Hunting for the perfect spot…",
]

const ICONS = [Sparkles, Search, Wand2, Compass, PartyPopper, MapPin]

export function LoadingMessage({
  kind = "thinking",
}: {
  kind?: "thinking" | "searching"
}) {
  const phrases = kind === "searching" ? SEARCHING_PHRASES : THINKING_PHRASES
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length)
    }, 2200)
    return () => clearInterval(id)
  }, [phrases.length])

  const Icon = ICONS[index % ICONS.length]

  return (
    <div className="flex items-center gap-2 text-[#5e3f3a] text-[15px]">
      <Icon className="size-4 text-[#9e0000] animate-pulse shrink-0" />
      <span key={index} className="vc-fade-in">
        {phrases[index]}
      </span>
    </div>
  )
}
