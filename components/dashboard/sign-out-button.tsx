"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { signOut } from "@/app/actions/venue-actions"
import { Spinner } from "@/components/ui/spinner"

export function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    await signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-full border border-[#e2dfde] bg-white px-4 py-2 text-sm font-medium text-[#5e3f3a] transition-colors hover:bg-[#f5f5f5] disabled:opacity-60"
    >
      {loading ? <Spinner className="size-4" /> : <LogOut size={15} />}
      Sign out
    </button>
  )
}
