"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Spinner } from "@/components/ui/spinner"
import { GoogleButton } from "@/components/auth/google-button"

// Inner component reads searchParams — must be wrapped in Suspense
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/"
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
    router.push(next)
    router.refresh()
  }

  const isOwnerFlow = next.startsWith("/owner")

  return (
    <div className="min-h-screen flex bg-[#f5f3f2]">
      {/* Left panel — brand / context */}
      <div className="hidden lg:flex flex-col justify-between w-96 shrink-0 bg-[#9e0000] p-10 text-white">
        <Link href="/" className="font-black text-2xl tracking-tight">
          VenueChat
        </Link>
        <div>
          {isOwnerFlow ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 mb-5">
                <Sparkles size={22} />
              </div>
              <h2 className="text-2xl font-bold leading-snug text-balance">
                List your venue with AI
              </h2>
              <p className="mt-3 text-sm text-white/75 leading-relaxed">
                Sign in to create a listing. Just describe your venue in chat — our AI writes the
                full listing and you review before publishing.
              </p>
              <ul className="mt-5 flex flex-col gap-2 text-sm text-white/80">
                <li className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                  Describe your venue
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                  AI writes the listing
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                  Review, upload photos &amp; publish
                </li>
              </ul>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold leading-snug text-balance">
                Find your perfect event venue
              </h2>
              <p className="mt-3 text-sm text-white/75 leading-relaxed">
                Sign in to save venues, track enquiries, and pick up your searches where you left
                off.
              </p>
            </>
          )}
        </div>
        <p className="text-xs text-white/40">
          &copy; {new Date().getFullYear()} VenueChat · Hong Kong
        </p>
      </div>

      {/* Right panel — the form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm flex flex-col gap-6">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden block text-center text-[#9e0000] font-black text-2xl tracking-tight">
            VenueChat
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-[#1a1c1c]">
              {isOwnerFlow ? "Sign in to manage listings" : "Welcome back"}
            </h1>
            <p className="text-sm text-[#5f5e5e] mt-1">
              {isOwnerFlow
                ? "Sign in or create an account to continue."
                : "Sign in to your account to continue."}
            </p>
          </div>

          <div className="bg-white border border-[#eceae9] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <GoogleButton label="Continue with Google" />

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-[#e2dfde]" />
              <span className="text-xs text-[#9a9999]">or use email</span>
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
                  className="w-full rounded-xl border border-[#e2dfde] bg-white px-3 py-2.5 text-base outline-none focus:border-[#9e0000] transition-colors"
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
                    className="w-full rounded-xl border border-[#e2dfde] bg-white px-3 py-2.5 pr-11 text-base outline-none focus:border-[#9e0000] transition-colors"
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
                <p className="text-sm text-[#9e0000] bg-[#fdecea] rounded-xl px-3 py-2.5">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9e0000] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {loading ? <Spinner className="size-4" /> : <ArrowRight size={16} />}
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-[#5f5e5e]">
            Don&apos;t have an account?{" "}
            <Link
              href={`/auth/sign-up${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="font-semibold text-[#9e0000] hover:underline"
            >
              Create one free
            </Link>
          </p>

          {!isOwnerFlow && (
            <div className="border-t border-[#eceae9] pt-4 text-center">
              <p className="text-xs text-[#8a7a77] mb-2">Own a venue?</p>
              <Link
                href="/auth/login?next=/owner"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e0dcdb] px-4 py-2 text-sm font-semibold text-[#5e3f3a] hover:border-[#9e0000] hover:text-[#9e0000] transition-colors"
              >
                <Sparkles size={14} />
                List your venue with AI
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
