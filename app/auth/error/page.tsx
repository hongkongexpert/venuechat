import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f9f9] px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-[#fdecea] flex items-center justify-center mb-4">
          <AlertCircle className="text-[#9e0000]" size={24} />
        </div>
        <h1 className="text-xl font-bold text-[#1a1c1c]">Authentication error</h1>
        <p className="text-sm text-[#5f5e5e] mt-2 leading-relaxed">
          Something went wrong confirming your account. The link may have expired.
          Please try signing in again.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center rounded-full bg-[#9e0000] px-5 py-2.5 text-sm font-semibold text-white mt-6 hover:opacity-90 transition-opacity"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
