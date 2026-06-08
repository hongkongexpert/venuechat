"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Spinner } from "@/components/ui/spinner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const redirectBase =
      process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
      `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectBase}?next=/auth/update-password`,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f9f9] px-4">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="block text-center text-[#9e0000] font-black text-2xl tracking-tight mb-1"
        >
          VenueChat
        </Link>
        <p className="text-center text-sm text-[#5f5e5e] mb-6">
          Reset your password
        </p>

        {sent ? (
          <div className="bg-white border border-[#e8bdb6] rounded-2xl p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-[#1a1c1c] mb-2">Check your email</h1>
            <p className="text-sm text-[#5f5e5e] leading-relaxed">
              We sent a password reset link to{" "}
              <span className="font-medium text-[#1a1c1c]">{email}</span>. Open it to choose a
              new password.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleReset}
            className="bg-white border border-[#e8bdb6] rounded-2xl p-6 flex flex-col gap-4 shadow-sm"
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-[#1a1c1c]">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#e2dfde] bg-white px-3 py-2.5 text-base outline-none focus:border-[#9e0000] transition-colors"
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <p className="text-sm text-[#9e0000] bg-[#fdecea] rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9e0000] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading && <Spinner className="size-4" />}
              Send reset link
            </button>
          </form>
        )}

        <p className="text-center text-sm text-[#5f5e5e] mt-5">
          Remembered it?{" "}
          <Link href="/auth/login" className="font-semibold text-[#9e0000] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
