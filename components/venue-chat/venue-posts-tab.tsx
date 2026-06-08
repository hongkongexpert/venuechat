"use client"

import useSWR from "swr"
import { ExternalLink, Calendar } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import type { SerpPost } from "@/lib/serpapi"

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to load posts")
    return r.json()
  })

export function VenuePostsTab({ dataId }: { dataId: string }) {
  const { data, error, isLoading } = useSWR<{ posts: SerpPost[] }>(
    `/api/venues/posts?data_id=${encodeURIComponent(dataId)}`,
    fetcher,
  )

  const posts = data?.posts ?? []

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-widest">
        Updates from the venue
      </span>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-10 text-[#5f5e5e]">
          <Spinner className="size-4" />
          <span className="text-sm">Loading updates…</span>
        </div>
      )}

      {error && (
        <p className="text-sm text-[#9e0000] py-4">
          Couldn&apos;t load updates for this venue.
        </p>
      )}

      {!isLoading && !error && posts.length === 0 && (
        <p className="text-sm text-[#5f5e5e] py-4">
          This venue hasn&apos;t posted any updates.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {posts.map((post, i) => (
          <article
            key={post.position ?? i}
            className="flex gap-3 rounded-xl border border-[#f0eae9] p-3 hover:border-[#e8bdb6] transition-colors"
          >
            {post.thumbnails && post.thumbnails[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.thumbnails[0] || "/placeholder.svg"}
                alt={post.title ?? "Venue update"}
                className="w-20 h-20 rounded-lg object-cover bg-[#e8e8e8] shrink-0"
                loading="lazy"
              />
            )}
            <div className="flex-1 min-w-0">
              {post.title && (
                <h5 className="text-sm font-semibold text-[#1a1c1c] leading-snug">
                  {post.title}
                </h5>
              )}
              {post.description && (
                <p className="text-xs text-[#5f5e5e] mt-1 leading-relaxed line-clamp-3">
                  {post.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {post.postedAtText && (
                  <span className="flex items-center gap-1 text-[11px] text-[#a89490]">
                    <Calendar size={11} />
                    {post.postedAtText}
                  </span>
                )}
                {post.onlineLink && (
                  <a
                    href={post.onlineLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-[#9e0000] hover:underline"
                  >
                    {post.onlineLinkText ?? "Learn more"}
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
