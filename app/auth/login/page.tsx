"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Spinner } from "@/components/ui/spinner"
import { GoogleButton } from "@/components/auth/google-button"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
      setError(
        error.message.toLowerCase().includes("invalid")
          ? "That email or password doesn't look right. Please try again."
          : error.message,
      )
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
              autoFocus
              autoComplete="email"
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
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#e2dfde] bg-white px-3 py-2.5 pr-11 text-base outline-none focus:border-[#9e0000] transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-[#9a9999] hover:text-[#5e3f3a] transition-colors"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
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
