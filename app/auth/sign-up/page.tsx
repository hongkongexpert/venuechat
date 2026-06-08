"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Check, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Spinner } from "@/components/ui/spinner"
import { GoogleButton } from "@/components/auth/google-button"

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/"
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
        data: { display_name: displayName },
      },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    router.push("/auth/sign-up-success")
  }

  return (
    <div className="min-h-screen flex bg-[#f5f3f2]">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-96 shrink-0 bg-[#9e0000] p-10 text-white">
        <Link href="/" className="font-black text-2xl tracking-tight">
          VenueChat
        </Link>
        <div>
          <h2 className="text-2xl font-bold leading-snug text-balance">
            Start finding and listing venues today
          </h2>
          <p className="mt-3 text-sm text-white/75 leading-relaxed">
            Free to join. Search thousands of Hong Kong venues or list yours in minutes with AI.
          </p>
          <ul className="mt-5 flex flex-col gap-2 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <Check size={14} className="shrink-0" />
              Save your favourite venues
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} className="shrink-0" />
              Send and track enquiries
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} className="shrink-0" />
              List your venue with AI — no forms
            </li>
          </ul>
        </div>
        <p className="text-xs text-white/40">
          &copy; {new Date().getFullYear()} VenueChat · Hong Kong
        </p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <Link href="/" className="lg:hidden block text-center text-[#9e0000] font-black text-2xl tracking-tight">
            VenueChat
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-[#1a1c1c]">Create your account</h1>
            <p className="text-sm text-[#5f5e5e] mt-1">Free to join — takes under a minute.</p>
          </div>

          <div className="bg-white border border-[#eceae9] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <GoogleButton label="Continue with Google" />

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-[#e2dfde]" />
              <span className="text-xs text-[#9a9999]">or use email</span>
              <span className="h-px flex-1 bg-[#e2dfde]" />
            </div>

            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-sm font-medium text-[#1a1c1c]">
                  Your name
                </label>
                <input
                  id="name"
                  type="text"
                  autoFocus
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-[#e2dfde] bg-white px-3 py-2.5 text-base outline-none focus:border-[#9e0000] transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-[#1a1c1c]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#e2dfde] bg-white px-3 py-2.5 text-base outline-none focus:border-[#9e0000] transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-[#1a1c1c]">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#e2dfde] bg-white px-3 py-2.5 pr-11 text-base outline-none focus:border-[#9e0000] transition-colors"
                    placeholder="At least 6 characters"
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
                <p
                  className={`flex items-center gap-1 text-xs transition-colors ${
                    password.length >= 6 ? "text-[#3f8f4f]" : "text-[#9a9999]"
                  }`}
                >
                  <Check size={12} className={password.length >= 6 ? "opacity-100" : "opacity-40"} />
                  At least 6 characters
                </p>
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
                {loading ? "Creating account…" : "Create free account"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-[#5f5e5e]">
            Already have an account?{" "}
            <Link
              href={`/auth/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="font-semibold text-[#9e0000] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  )
}
