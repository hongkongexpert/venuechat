import Link from "next/link"
import { redirect } from "next/navigation"
import { CheckCircle2, XCircle } from "lucide-react"
import { stripe } from "@/lib/stripe"
import { recordSubscriptionFromSession } from "@/app/actions/subscription-sync"

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams
  if (!session_id) redirect("/owner")

  let ok = false
  let venueId: string | null = null
  let planName = "your plan"

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["subscription"],
    })
    if (session.payment_status === "paid" || session.status === "complete") {
      const result = await recordSubscriptionFromSession(session_id)
      ok = result.ok
      venueId = result.venueId ?? null
      planName = result.planName ?? planName
    }
  } catch {
    ok = false
  }

  return (
    <main className="min-h-dvh bg-[#fbf7f6] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-[#e8bdb6] bg-white p-8 text-center shadow-sm">
        {ok ? (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf6ec]">
              <CheckCircle2 className="text-[#3f8f4f]" size={30} />
            </div>
            <h1 className="text-xl font-semibold text-[#1a1c1c]">
              You&apos;re subscribed!
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#5e3f3a]">
              Your {planName} subscription is now active. Your listing features are
              unlocked and you can publish your venue.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={venueId ? `/owner/venues/${venueId}` : "/owner"}
                className="inline-flex items-center justify-center rounded-full bg-[#9e0000] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Go to my listing
              </Link>
              <Link
                href="/owner"
                className="inline-flex items-center justify-center rounded-full border border-[#e8bdb6] bg-white px-5 py-2.5 text-sm font-semibold text-[#9e0000] hover:bg-[#fdecea] transition-colors"
              >
                Back to dashboard
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fdecea]">
              <XCircle className="text-[#9e0000]" size={30} />
            </div>
            <h1 className="text-xl font-semibold text-[#1a1c1c]">
              We couldn&apos;t confirm your payment
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#5e3f3a]">
              If you completed checkout, your subscription may take a moment to
              activate. Please refresh, or try again from your dashboard.
            </p>
            <Link
              href="/owner"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#9e0000] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Back to dashboard
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
