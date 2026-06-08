"use client"

import { useState } from "react"
import useSWR from "swr"
import { Star, ThumbsUp } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SerpReviewsResult } from "@/lib/serpapi"

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to load reviews")
    return r.json()
  })

const SORT_OPTIONS = [
  { value: "newestFirst", label: "Most recent" },
  { value: "qualityScore", label: "Most relevant" },
  { value: "ratingHigh", label: "Highest rated" },
  { value: "ratingLow", label: "Lowest rated" },
]

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          className={
            n <= Math.round(rating)
              ? "fill-[#e8a33d] text-[#e8a33d]"
              : "text-[#d8d2d1]"
          }
        />
      ))}
    </div>
  )
}

export function VenueReviewsTab({ dataId }: { dataId: string }) {
  const [sortBy, setSortBy] = useState("newestFirst")
  const { data, error, isLoading } = useSWR<SerpReviewsResult>(
    `/api/venues/reviews?data_id=${encodeURIComponent(dataId)}&sort_by=${sortBy}`,
    fetcher,
  )

  const reviews = data?.reviews ?? []
  const topics = data?.topics ?? []

  return (
    <div className="flex flex-col gap-4">
      {/* Topic chips */}
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topics.slice(0, 8).map((t) => (
            <span
              key={t.id}
              className="text-xs px-2.5 py-1 rounded-full bg-[#f4eceb] text-[#5e3f3a] border border-[#ecdedc]"
            >
              {t.keyword} <span className="text-[#a89490]">{t.mentions}</span>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-widest">
          Reviews
        </span>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-8 w-[150px] text-sm border-[#e8bdb6]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-10 text-[#5f5e5e]">
          <Spinner className="size-4" />
          <span className="text-sm">Loading reviews…</span>
        </div>
      )}

      {error && (
        <p className="text-sm text-[#9e0000] py-4">
          Couldn&apos;t load reviews for this venue.
        </p>
      )}

      {!isLoading && !error && reviews.length === 0 && (
        <p className="text-sm text-[#5f5e5e] py-4">No reviews available yet.</p>
      )}

      <div className="flex flex-col divide-y divide-[#f0eae9]">
        {reviews.map((review, i) => (
          <article key={review.reviewId ?? i} className="py-4 first:pt-0">
            <div className="flex items-start gap-3">
              {review.user.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={review.user.thumbnail || "/placeholder.svg"}
                  alt={review.user.name}
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#e8e8e8] flex items-center justify-center text-sm font-semibold text-[#5e3f3a] shrink-0">
                  {review.user.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#1a1c1c]">
                    {review.user.name}
                  </span>
                  {review.user.localGuide && (
                    <span className="text-[10px] uppercase tracking-wide text-[#5f5e5e] bg-[#f0eae9] px-1.5 py-0.5 rounded">
                      Local Guide
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {review.rating != null && <Stars rating={review.rating} />}
                  <span className="text-xs text-[#a89490]">{review.date}</span>
                </div>
                {review.snippet && (
                  <p className="text-sm text-[#3a3a3a] mt-2 leading-relaxed whitespace-pre-line">
                    {review.snippet}
                  </p>
                )}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {review.images.slice(0, 4).map((img, idx) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={idx}
                        src={img || "/placeholder.svg"}
                        alt={`Review photo ${idx + 1}`}
                        className="w-14 h-14 rounded-md object-cover bg-[#e8e8e8]"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
                {review.likes != null && review.likes > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-[#a89490]">
                    <ThumbsUp size={12} />
                    {review.likes}
                  </div>
                )}
                {review.response?.snippet && (
                  <div className="mt-2.5 ml-1 pl-3 border-l-2 border-[#e8bdb6] bg-[#faf6f5] rounded-r-md py-2 pr-2">
                    <span className="text-xs font-semibold text-[#5e3f3a]">
                      Response from the owner
                    </span>
                    <p className="text-xs text-[#5f5e5e] mt-1 leading-relaxed">
                      {review.response.snippet}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
