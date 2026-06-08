"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Spinner } from "@/components/ui/spinner"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    router.push("/dashboard")
    router.refresh()
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
        <p className="text-center text-sm text-[#5f5e5e] mb-6">Choose a new password</p>

        <form
          onSubmit={handleUpdate}
          className="bg-white border border-[#e8bdb6] rounded-2xl p-6 flex flex-col gap-4 shadow-sm"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-[#1a1c1c]">
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#e2dfde] bg-white px-3 py-2.5 text-base outline-none focus:border-[#9e0000] transition-colors"
              placeholder="At least 6 characters"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm" className="text-sm font-medium text-[#1a1c1c]">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-[#e2dfde] bg-white px-3 py-2.5 text-base outline-none focus:border-[#9e0000] transition-colors"
              placeholder="Re-enter your password"
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
            Update password
          </button>
        </form>
      </div>
    </div>
  )
}
