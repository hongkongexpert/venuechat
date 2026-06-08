import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export function OwnerHeader() {
  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-[#eceae9]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#5e3f3a] hover:text-[#1a1c1c] transition-colors"
        >
          <ArrowLeft size={16} />
          Dashboard
        </Link>
        <Link href="/" className="text-[#9e0000] font-black text-lg tracking-tight">
          VenueChat
        </Link>
        <Link
          href="/pricing"
          className="text-sm font-medium text-[#9e0000] hover:underline"
        >
          Plans
        </Link>
      </div>
    </header>
  )
}
