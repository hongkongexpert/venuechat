"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cancelVenueSubscription, resumeVenueSubscription } from "@/app/actions/stripe-actions"
import { Spinner } from "@/components/ui/spinner"

interface ManagePlanButtonsProps {
  venueId: string
  cancelAtPeriodEnd: boolean
}

export function ManagePlanButtons({ venueId, cancelAtPeriodEnd }: ManagePlanButtonsProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (action: "cancel" | "resume") => {
    setError(null)
    setBusy(true)
    const res =
      action === "cancel"
        ? await cancelVenueSubscription(venueId)
        : await resumeVenueSubscription(venueId)
    setBusy(false)
    setConfirming(false)
    if (!res.ok) {
      setError(res.error || "Something went wrong.")
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-1.5">
      {cancelAtPeriodEnd ? (
        <button
          onClick={() => run("resume")}
          disabled={busy}
          className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#3f8f4f] px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {busy && <Spinner className="size-3" />}
          Resume plan
        </button>
      ) : !confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="self-start text-xs font-semibold text-[#9e0000] underline-offset-2 hover:underline"
        >
          Cancel plan
        </button>
      ) : (
        <span className="inline-flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#5e3f3a]">Cancel at the end of the billing period?</span>
          <button
            onClick={() => run("cancel")}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#9e0000] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {busy && <Spinner className="size-3" />}
            Yes, cancel
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="rounded-full border border-[#e2dfde] px-3 py-1.5 text-xs font-semibold text-[#5e3f3a] hover:bg-[#f5f5f5] transition-colors"
          >
            Keep plan
          </button>
        </span>
      )}
      {error && <p className="text-xs text-[#9e0000]">{error}</p>}
    </div>
  )
}
