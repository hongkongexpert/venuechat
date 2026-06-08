"use client"

import { useRef, useState } from "react"
import { Camera } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { updateAvatar } from "@/app/actions/venue-actions"
import { Spinner } from "@/components/ui/spinner"

interface AvatarUploaderProps {
  userId: string
  initialUrl: string | null
  fallback: string
}

export function AvatarUploader({ userId, initialUrl, fallback }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.")
      return
    }

    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const path = `${userId}/avatar-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path)
    const publicUrl = data.publicUrl

    const res = await updateAvatar(publicUrl)
    setUploading(false)
    if (!res.ok) {
      setError(res.error || "Could not save avatar.")
      return
    }
    setUrl(publicUrl)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-[#9e0000] flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-md">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url || "/placeholder.svg"} alt="Profile photo" className="w-full h-full object-cover" />
          ) : (
            <span>{fallback}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label="Change profile photo"
          className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-white border border-[#e2dfde] shadow-sm flex items-center justify-center text-[#5e3f3a] hover:bg-[#f5f5f5] transition-colors disabled:opacity-60"
        >
          {uploading ? <Spinner className="size-4" /> : <Camera size={16} />}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleFile}
          className="hidden"
        />
      </div>
      <p className="text-xs text-[#9a9999]">JPG, PNG or WebP. Max 5MB.</p>
      {error && <p className="text-xs text-[#9e0000] text-center">{error}</p>}
    </div>
  )
}
