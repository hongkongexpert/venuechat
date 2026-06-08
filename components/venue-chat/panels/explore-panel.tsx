"use client"

import { MapPin, Sparkles } from "lucide-react"

const DISTRICTS = [
  "Central",
  "Tsim Sha Tsui",
  "Causeway Bay",
  "Wan Chai",
  "Sheung Wan",
  "Mong Kok",
  "Lan Kwai Fong",
  "Soho",
  "Kennedy Town",
  "Sai Ying Pun",
  "Quarry Bay",
  "Kowloon Tong",
]

const EVENT_TYPES = [
  "Rooftop bars",
  "Private dining rooms",
  "Wedding venues",
  "Corporate event spaces",
  "Birthday party venues",
  "Cocktail lounges",
  "Karaoke & KTV",
  "Art galleries for hire",
]

export function ExplorePanel({
  onSearch,
}: {
  onSearch: (query: string) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#926e69]">
          <MapPin size={13} className="text-[#9e0000]" />
          Browse by district
        </h3>
        <div className="flex flex-wrap gap-2">
          {DISTRICTS.map((d) => (
            <button
              key={d}
              onClick={() => onSearch(`Best event venues in ${d}, Hong Kong`)}
              className="rounded-full border border-[#e8bdb6] bg-white px-3 py-1.5 text-sm font-medium text-[#5e3f3a] transition-colors hover:bg-[#fdecea] hover:text-[#9e0000]"
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#926e69]">
          <Sparkles size={13} className="text-[#9e0000]" />
          Popular event types
        </h3>
        <div className="flex flex-col gap-2">
          {EVENT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => onSearch(`${t} in Hong Kong`)}
              className="rounded-xl border border-[#e8bdb6] bg-white px-4 py-3 text-left text-sm font-semibold text-[#1a1c1c] transition-colors hover:bg-[#fdecea]"
            >
              {t}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
