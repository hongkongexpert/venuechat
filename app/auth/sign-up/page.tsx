"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Spinner } from "@/components/ui/spinner"
import { GoogleButton } from "@/components/auth/google-button"

export default function SignUpPage() {
  const router = useRouter()
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
    <div className="min-h-screen flex items-center justify-center bg-[#f9f9f9] px-4">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="block text-center text-[#9e0000] font-black text-2xl tracking-tight mb-1"
        >
          VenueChat
        </Link>
        <p className="text-center text-sm text-[#5f5e5e] mb-6">
          Create an account to plan your event
        </p>

        <div className="bg-white border border-[#e8bdb6] rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
          <GoogleButton label="Sign up with Google" />

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-[#e2dfde]" />
            <span className="text-xs text-[#9a9999]">or</span>
            <span className="h-px flex-1 bg-[#e2dfde]" />
          </div>

          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-[#1a1c1c]">
              Name
            </label>
            <input
              id="name"
              type="text"
              autoFocus
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-[#e2dfde] bg-white px-3 py-2.5 text-base outline-none focus:border-[#9e0000] transition-colors"
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
              className="w-full rounded-lg border border-[#e2dfde] bg-white px-3 py-2.5 text-base outline-none focus:border-[#9e0000] transition-colors"
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
                className="w-full rounded-lg border border-[#e2dfde] bg-white px-3 py-2.5 pr-11 text-base outline-none focus:border-[#9e0000] transition-colors"
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
            Create account
          </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#5f5e5e] mt-5">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-[#9e0000] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
