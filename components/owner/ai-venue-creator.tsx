"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Send, Sparkles, Upload, X, Save, Loader2, Wand2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { createVenueFromDraft } from "@/app/actions/venue-actions"
import { EMPTY_DRAFT, listingCompletion, type ListingDraft } from "@/lib/listing-template"
import { ListingPreview } from "@/components/owner/listing-preview"

function getText(parts: { type: string; text?: string }[] | undefined) {
  if (!parts) return ""
  return parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { text: string }).text)
    .join("")
}

const STARTERS = [
  "I run a rooftop bar in Central",
  "Help me list my restaurant for private events",
  "I have a garden space in the New Territories",
]

export function AiVenueCreator({ userId }: { userId: string }) {
  const router = useRouter()
  const [input, setInput] = useState("")
  const [draft, setDraft] = useState<ListingDraft>(EMPTY_DRAFT)
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/venue-ai" }),
    onData: () => {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
      })
    },
    onToolCall: ({ toolCall }) => {
      if (toolCall.dynamic) return
      if (toolCall.toolName === "updateListing") {
        const patch = toolCall.input as Partial<ListingDraft>
        setDraft((prev) => {
          const next: ListingDraft = { ...prev }
          for (const [k, v] of Object.entries(patch)) {
            if (v === undefined) continue
            // @ts-expect-error dynamic key assignment
            next[k] = v
          }
          return next
        })
      }
    },
  })

  const busy = status === "streaming" || status === "submitted"
  const completion = useMemo(() => listingCompletion(draft), [draft])

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || busy) return
      const note =
        photos.length > 0
          ? `${trimmed}\n\n(The owner has uploaded ${photos.length} photo${photos.length > 1 ? "s" : ""} of the venue.)`
          : trimmed
      sendMessage({ text: note })
      setInput("")
    },
    [busy, photos.length, sendMessage],
  )

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => f.type.startsWith("image/"))
      if (!arr.length) return
      setUploading(true)
      setSaveError(null)
      const supabase = createClient()
      const urls: string[] = []
      for (const file of arr) {
        if (file.size > 5 * 1024 * 1024) continue
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
        const path = `${userId}/ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
        const { error } = await supabase.storage
          .from("venue-images")
          .upload(path, file, { upsert: true, cacheControl: "3600" })
        if (!error) {
          const { data } = supabase.storage.from("venue-images").getPublicUrl(path)
          urls.push(data.publicUrl)
        }
      }
      setPhotos((prev) => [...prev, ...urls])
      setUploading(false)
    },
    [userId],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files)
    },
    [uploadFiles],
  )

  const removePhoto = (i: number) => setPhotos((prev) => prev.filter((_, idx) => idx !== i))

  const save = async () => {
    setSaving(true)
    setSaveError(null)
    const res = await createVenueFromDraft({
      name: draft.name ?? "",
      short_description: draft.short_description,
      description: draft.description,
      venue_type: draft.venue_type,
      district: draft.district,
      area: draft.area,
      address: draft.address,
      capacity_min: draft.capacity_min,
      capacity_max: draft.capacity_max,
      price_min: draft.price_min,
      price_max: draft.price_max,
      contact_email: draft.contact_email,
      contact_phone: draft.contact_phone,
      website_url: draft.website_url,
      photos,
    })
    if (res.ok && res.id) {
      router.push(`/owner/venues/${res.id}`)
    } else {
      setSaveError(res.error || "Could not save the listing.")
      setSaving(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4 lg:gap-6 max-w-6xl mx-auto w-full">
      {/* LEFT: Chat */}
      <section className="flex flex-col rounded-2xl border border-[#eceae9] bg-white overflow-hidden h-[calc(100vh-8rem)]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f0eeed] bg-[#fbf9f8]">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9e0000] text-white">
            <Sparkles size={15} />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-[#1a1c1c]">Listing Assistant</p>
            <p className="text-[11px] text-[#8a7a77]">AI builds your listing as you chat</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="m-auto text-center max-w-sm">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#9e0000]/10 text-[#9e0000] mb-3">
                <Wand2 size={22} />
              </span>
              <h3 className="font-bold text-[#1a1c1c]">Let&apos;s build your listing</h3>
              <p className="text-sm text-[#5e3f3a] mt-1 leading-relaxed">
                Just tell me about your venue in plain words. No forms — I&apos;ll write a polished
                listing and you&apos;ll see it appear on the right.
              </p>
              <div className="flex flex-col gap-2 mt-4">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-sm rounded-xl border border-[#eceae9] px-3 py-2 hover:border-[#9e0000] hover:bg-[#fbf9f8] transition-colors text-[#3a3a3a]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => {
            const text = getText(m.parts as { type: string; text?: string }[])
            const isUser = m.role === "user"
            // Hide the internal photo note from the displayed bubble
            const display = isUser ? text.split("\n\n(The owner has uploaded")[0] : text
            if (!display) return null
            return (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  isUser
                    ? "self-end bg-[#9e0000] text-white rounded-br-sm"
                    : "self-start bg-[#f6f4f3] text-[#1a1c1c] rounded-bl-sm"
                }`}
              >
                {display}
              </div>
            )
          })}

          {busy && (
            <div className="self-start bg-[#f6f4f3] rounded-2xl rounded-bl-sm px-3.5 py-3">
              <span className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-[#c4b8b5] animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 rounded-full bg-[#c4b8b5] animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 rounded-full bg-[#c4b8b5] animate-bounce" />
              </span>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="border-t border-[#f0eeed] p-3 flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
            rows={1}
            placeholder="Describe your venue..."
            className="flex-1 resize-none rounded-xl border border-[#eceae9] px-3 py-2.5 text-sm focus:outline-none focus:border-[#9e0000] max-h-32"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#9e0000] text-white disabled:opacity-40 hover:bg-[#7e0000] transition-colors"
            aria-label="Send message"
          >
            <Send size={17} />
          </button>
        </form>
      </section>

      {/* RIGHT: Live preview + photos + save */}
      <section className="flex flex-col gap-4">
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`rounded-2xl border-2 border-dashed p-4 text-center transition-colors ${
            dragOver ? "border-[#9e0000] bg-[#9e0000]/5" : "border-[#e0dcdb] bg-white"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
          {photos.length === 0 ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center gap-1.5 py-3 text-[#5e3f3a]"
            >
              {uploading ? (
                <Loader2 size={22} className="animate-spin text-[#9e0000]" />
              ) : (
                <Upload size={22} className="text-[#9e0000]" />
              )}
              <span className="text-sm font-semibold">Drop photos here or click to upload</span>
              <span className="text-xs text-[#8a7a77]">The first photo becomes your cover</span>
            </button>
          ) : (
            <div className="flex flex-wrap gap-2 justify-center">
              {photos.map((p, i) => (
                <div key={i} className="relative h-16 w-24 rounded-lg overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p || "/placeholder.svg"} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove photo"
                  >
                    <X size={12} />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-semibold text-center py-0.5">
                      COVER
                    </span>
                  )}
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                className="h-16 w-24 rounded-lg border-2 border-dashed border-[#e0dcdb] flex items-center justify-center text-[#9e0000] hover:border-[#9e0000]"
                aria-label="Add more photos"
              >
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              </button>
            </div>
          )}
        </div>

        <ListingPreview draft={draft} photos={photos} />

        {/* Save bar */}
        <div className="rounded-2xl border border-[#eceae9] bg-white p-4 sticky bottom-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#8a7a77]">
              Listing progress
            </span>
            <span className="text-xs font-medium text-[#5e3f3a]">
              {completion.filled}/{completion.total} key fields
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[#f0eeed] overflow-hidden mb-3">
            <div
              className="h-full bg-[#9e0000] transition-all"
              style={{ width: `${(completion.filled / completion.total) * 100}%` }}
            />
          </div>
          {saveError && <p className="text-sm text-[#9e0000] mb-2">{saveError}</p>}
          <button
            onClick={save}
            disabled={!completion.ready || saving}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-[#9e0000] text-white py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-[#7e0000] transition-colors"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {completion.ready ? "Save listing as draft" : "Keep chatting to finish your listing"}
          </button>
        </div>
      </section>
    </div>
  )
}
