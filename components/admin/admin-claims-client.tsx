"use client"

import { useState, useTransition } from "react"
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
  Globe,
  Loader2,
} from "lucide-react"
import { reviewClaim, type AdminClaimRow } from "@/app/actions/claim-actions"

type Filter = "pending" | "approved" | "rejected"

function methodLabel(m: AdminClaimRow["verification_method"]) {
  return m === "email_domain" ? "Email domain match" : "Manual"
}

export function AdminClaimsClient({
  initialClaims,
  initialFilter,
}: {
  initialClaims: AdminClaimRow[]
  initialFilter: Filter
}) {
  const [filter, setFilter] = useState<Filter>(initialFilter)
  const [claims, setClaims] = useState(initialClaims)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})

  const switchFilter = (f: Filter) => {
    setFilter(f)
    const url = new URL(window.location.href)
    url.searchParams.set("status", f)
    window.history.replaceState(null, "", url.toString())
    startTransition(async () => {
      const res = await fetch(`/admin/claims/data?status=${f}`)
      if (res.ok) {
        const data = await res.json()
        setClaims(data.claims ?? [])
      }
    })
  }

  const decide = (
    id: string,
    decision: "approve" | "reject",
  ) => {
    setBusyId(id)
    setError(null)
    startTransition(async () => {
      const res = await reviewClaim(id, decision, reviewNotes[id]?.trim())
      if (!res.ok) {
        setError(res.error || "Could not update the claim.")
      } else {
        // Remove from current list (it no longer matches the pending filter).
        setClaims((prev) => prev.filter((c) => c.id !== id))
      }
      setBusyId(null)
    })
  }

  const counts = { filter }

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-6 py-8 flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-[#9e0000]">
          <ShieldCheck size={20} />
          <h1 className="text-xl font-bold text-[#1a1c1c]">Venue claims</h1>
        </div>
        <p className="text-sm text-[#5f5e5e] mt-1">
          Review and verify ownership claims. Approving creates a draft listing
          owned by the claimant.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-[#f0eeed] p-1 w-fit">
        {(["pending", "approved", "rejected"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => switchFilter(f)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
              filter === f
                ? "bg-white text-[#1a1c1c] shadow-sm"
                : "text-[#8a7a77] hover:text-[#1a1c1c]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-[#9e0000] bg-[#fdecea] rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {pending && claims.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-[#8a7a77]">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : claims.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e0dcdb] bg-white p-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f0eeed] text-[#8a7a77]">
            <Clock size={22} />
          </span>
          <p className="mt-3 text-sm font-semibold text-[#1a1c1c]">
            No {counts.filter} claims
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {claims.map((c) => {
            const draft =
              (c.listing_data?.draft as Record<string, unknown>) ?? {}
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-[#eceae9] bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1a1c1c]">
                      {c.business_name}
                    </p>
                    <p className="text-xs text-[#8a7a77] mt-0.5">
                      {[draft.venue_type, draft.district]
                        .filter(Boolean)
                        .join(" · ") || "No category"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#f0eeed] px-2.5 py-1 text-[11px] font-semibold text-[#5e3f3a]">
                    {methodLabel(c.verification_method)}
                  </span>
                </div>

                {/* Claimant details */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#5e3f3a]">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail size={13} className="text-[#b8aeac]" />
                    {c.claimant_email}
                  </span>
                  {c.claimant_phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone size={13} className="text-[#b8aeac]" />
                      {c.claimant_phone}
                    </span>
                  )}
                  {c.website_domain && (
                    <span className="inline-flex items-center gap-1.5">
                      <Globe size={13} className="text-[#b8aeac]" />
                      {c.website_domain}
                    </span>
                  )}
                  {c.claimant_role && (
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-[#b8aeac]" />
                      {c.claimant_role}
                    </span>
                  )}
                </div>

                {c.notes && (
                  <p className="mt-3 rounded-lg bg-[#f9f7f6] px-3 py-2 text-xs text-[#5e3f3a]">
                    {c.notes}
                  </p>
                )}

                {c.status === "pending" ? (
                  <div className="mt-4 flex flex-col gap-2">
                    <input
                      value={reviewNotes[c.id] ?? ""}
                      onChange={(e) =>
                        setReviewNotes((p) => ({
                          ...p,
                          [c.id]: e.target.value,
                        }))
                      }
                      placeholder="Review note (shown to claimant if rejected)"
                      className="w-full rounded-lg border border-[#e0dcdb] bg-white px-3 py-2 text-sm text-[#1a1c1c] outline-none focus:border-[#9e0000]"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decide(c.id, "approve")}
                        disabled={busyId === c.id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#3f8f4f] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#357a43] transition-colors disabled:opacity-50"
                      >
                        {busyId === c.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => decide(c.id, "reject")}
                        disabled={busyId === c.id}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#e0dcdb] px-3.5 py-2 text-sm font-semibold text-[#9e0000] hover:bg-[#fdecea] transition-colors disabled:opacity-50"
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-[#8a7a77]">
                    {c.status === "approved" ? "Approved" : "Rejected"}
                    {c.review_notes ? ` — ${c.review_notes}` : ""}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
