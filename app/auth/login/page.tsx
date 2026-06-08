"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Spinner } from "@/components/ui/spinner"
import { GoogleButton } from "@/components/auth/google-button"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    router.push("/")
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
        <p className="text-center text-sm text-[#5f5e5e] mb-6">
          Sign in to save venues and track enquiries
        </p>

        <div className="bg-white border border-[#e8bdb6] rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
          <GoogleButton label="Sign in with Google" />

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-[#e2dfde]" />
            <span className="text-xs text-[#9a9999]">or</span>
            <span className="h-px flex-1 bg-[#e2dfde]" />
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-[#1a1c1c]">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs font-medium text-[#9e0000] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#e2dfde] bg-white px-3 py-2.5 text-base outline-none focus:border-[#9e0000] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-[#9e0000] bg-[#fdecea] rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9e0000] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading && <Spinner className="size-4" />}
            Sign in
          </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#5f5e5e] mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/auth/sign-up" className="font-semibold text-[#9e0000] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
