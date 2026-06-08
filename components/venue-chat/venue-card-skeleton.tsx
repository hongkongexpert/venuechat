import { LoadingMessage } from "./loading-message"

export function VenueCardSkeleton() {
  return (
    <div className="bg-[#ffffff] border border-[#e8bdb6]/40 rounded-xl overflow-hidden shadow-sm flex flex-col">
      <div className="h-28 sm:h-36 w-full vc-shimmer" />
      <div className="p-3.5 flex flex-col gap-2.5 flex-1">
        <div className="h-4 w-3/4 rounded vc-shimmer" />
        <div className="flex items-center gap-2">
          <div className="h-3 w-12 rounded vc-shimmer" />
          <div className="h-3 w-20 rounded vc-shimmer" />
        </div>
        <div className="h-3 w-full rounded vc-shimmer mt-0.5" />
        <div className="h-3 w-2/3 rounded vc-shimmer" />
      </div>
    </div>
  )
}

export function VenueResultsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <LoadingMessage kind="searching" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <VenueCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
