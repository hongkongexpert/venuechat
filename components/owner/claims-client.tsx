"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShieldCheck,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react"
import { ClaimDialog } from "@/components/owner/claim-dialog"
import type { ClaimRow } from "@/app/actions/claim-actions"

function StatusBadge({ status }: { status: ClaimRow["status"] }) {
  const map = {
    approved: {
      label: "Verified",
      cls: "bg-[#eaf6ec] text-[#3f8f4f]",
      Icon: CheckCircle2,
    },
    pending: {
      label: "Under review",
      cls: "bg-[#fdf8ec] text-[#b8860b]",
      Icon: Clock,
    },
    rejected: {
      label: "Not approved",
      cls: "bg-[#fdecea] text-[#9e0000]",
      Icon: XCircle,
    },
  }[status]
  const { label, cls, Icon } = map
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}
    >
      <Icon size={12} />
      {label}
    </span>
  )
}

export function ClaimsClient({ initialClaims }: { initialClaims: ClaimRow[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [claims] = useState(initialClaims)

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1a1c1c]">Claim a venue</h1>
          <p className="text-sm text-[#5f5e5e] mt-1 max-w-md">
            Already run a venue that&apos;s on Google Maps? Claim it to get a
            verified, editable listing on VenueChat.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#9e0000] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#7e0000] transition-colors"
        >
          <Plus size={15} />
          New claim
        </button>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-[#eceae9] bg-white p-5">
        <div className="flex items-center gap-2 text-[#9e0000]">
          <ShieldCheck size={16} />
          <h2 className="text-sm font-bold">How verification works</h2>
        </div>
        <ul className="mt-3 flex flex-col gap-2.5 text-sm text-[#5e3f3a]">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={15} className="text-[#3f8f4f] mt-0.5 shrink-0" />
            <span>
              <span className="font-semibold">Instant</span> if your account
              email matches the venue&apos;s website domain.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Clock size={15} className="text-[#b8860b] mt-0.5 shrink-0" />
            <span>
              <span className="font-semibold">Manual review</span> otherwise —
              our team checks your details and approves within a couple of days.
            </span>
          </li>
        </ul>
      </div>

      {/* Claims list */}
      {claims.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e0dcdb] bg-white p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fdecea] text-[#9e0000]">
            <ShieldCheck size={22} />
          </span>
          <p className="mt-3 text-sm font-semibold text-[#1a1c1c]">
            No claims yet
          </p>
          <p className="mt-1 text-sm text-[#8a7a77]">
            Claim your first venue to manage its listing.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#9e0000] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7e0000] transition-colors"
          >
            <Plus size={15} />
            Claim a venue
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {claims.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-2xl border border-[#eceae9] bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-[#1a1c1c] truncate">
                    {c.business_name}
                  </p>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs text-[#8a7a77] mt-1">
                  {c.verification_method === "email_domain"
                    ? "Verified by email domain"
                    : "Submitted for manual review"}
                  {" · "}
                  {new Date(c.created_at).toLocaleDateString()}
                </p>
                {c.status === "rejected" && c.review_notes && (
                  <p className="text-xs text-[#9e0000] mt-1.5">
                    {c.review_notes}
                  </p>
                )}
              </div>
              {c.status === "approved" && c.venue_id && (
                <Link
                  href={`/owner/venues/${c.venue_id}`}
                  className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-[#9e0000] hover:underline"
                >
                  Edit listing
                  <ExternalLink size={12} />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Manual route hint */}
      <p className="text-center text-xs text-[#8a7a77]">
        Not on Google Maps?{" "}
        <Link
          href="/owner"
          className="text-[#9e0000] font-medium hover:underline inline-flex items-center gap-1"
        >
          <Sparkles size={12} /> Create a listing with AI
        </Link>
      </p>

      <ClaimDialog
        open={open}
        onClose={() => {
          setOpen(false)
          router.refresh()
        }}
        onApproved={() => router.refresh()}
        onPending={() => router.refresh()}
      />
    </div>
  )
}
