"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Upload, X, Save, Loader2, ImagePlus, CheckCircle2, Plus, ExternalLink, MapPin, Crown, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { createVenueFromDraft, getOwnerContext } from "@/app/actions/venue-actions"
import { EMPTY_DRAFT, listingCompletion, type ListingDraft } from "@/lib/listing-template"
import { ListingPreview } from "@/components/owner/listing-preview"
import { ChatInput } from "@/components/venue-chat/chat-input"
import { MapsImportDialog } from "@/components/owner/maps-import-dialog"
import { getPlanLimits, type AccountPlan } from "@/lib/account-plan"

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

export function AiVenueCreator({
  userId,
  plan: planProp = "free",
  listingCount: listingCountProp = 0,
  onExit,
}: {
  userId: string
  plan?: AccountPlan
  listingCount?: number
  onExit?: () => void
}) {
  const router = useRouter()
  const { data: ctx } = useSWR("owner-context", () => getOwnerContext())
  const plan: AccountPlan = ctx?.plan ?? planProp
  const listingCount = ctx?.listingCount ?? listingCountProp
  const limits = useMemo(() => getPlanLimits(plan), [plan])
  const atListingLimit = listingCount >= limits.maxListings
  const [draft, setDraft] = useState<ListingDraft>(EMPTY_DRAFT)
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Add photos while respecting the plan's per-listing photo cap.
  const addPhotos = useCallback(
    (urls: string[]) => {
      setPhotos((prev) => {
        const next = [...prev]
        for (const url of urls) {
          if (!url || next.includes(url)) continue
          if (next.length >= limits.maxPhotosPerListing) break
          next.push(url)
        }
        return next
      })
    },
    [limits.maxPhotosPerListing],
  )

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
      if (toolCall.toolName === "setPhotos") {
        const { urls } = (toolCall.input as { urls?: string[] }) ?? {}
        if (Array.isArray(urls) && urls.length) addPhotos(urls)
      }
    },
  })

  const busy = status === "streaming" || status === "submitted"
  const completion = useMemo(() => listingCompletion(draft), [draft])
  const hasConversation = messages.length > 0

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || busy) return
      const note =
        photos.length > 0
          ? `${trimmed}\n\n(The owner has uploaded ${photos.length} photo${photos.length > 1 ? "s" : ""} of the venue.)`
          : trimmed
      sendMessage({ text: note })
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
      addPhotos(urls)
      setUploading(false)
    },
    [userId, addPhotos],
  )

  const handleImport = useCallback(
    (patch: Partial<ListingDraft>, importedPhotos: string[]) => {
      setDraft((prev) => {
        const next: ListingDraft = { ...prev }
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined || v === null) continue
          // @ts-expect-error dynamic key assignment
          next[k] = v
        }
        return next
      })
      if (importedPhotos.length) addPhotos(importedPhotos)
    },
    [addPhotos],
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
      setSavedId(res.id)
      setSaving(false)
    } else {
      if (res.limitReached) setLimitReached(true)
      setSaveError(res.error || "Could not save the listing.")
      setSaving(false)
    }
  }

  const resetForAnother = () => {
    setDraft(EMPTY_DRAFT)
    setPhotos([])
    setSavedId(null)
    setSaveError(null)
  }

  // Inline success — stays on the homepage, no navigation.
  if (savedId) {
    return (
      <div className="grid lg:grid-cols-2 gap-4 lg:gap-5 w-full h-full min-h-0">
        <section className="flex flex-col items-center justify-center text-center rounded-2xl border border-[#eceae9] bg-white p-8">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#3f8f4f]/12 text-[#3f8f4f] mb-5">
            <CheckCircle2 size={34} />
          </span>
          <h2 className="text-xl font-bold text-[#1a1c1c]">
            {draft.name || "Your venue"} is saved as a draft
          </h2>
          <p className="text-sm text-[#8a7a77] mt-2 max-w-sm leading-relaxed">
            Nice work. Your listing is saved. You can keep refining it, add more
            photos, or publish it from your venue manager.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-xs">
            <button
              onClick={() => router.push(`/owner/venues/${savedId}`)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#9e0000] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7e0000]"
            >
              <ExternalLink size={15} />
              Open listing
            </button>
            <button
              onClick={resetForAnother}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-[#e8bdb6] bg-white px-4 py-2.5 text-sm font-semibold text-[#5e3f3a] transition-colors hover:border-[#9e0000] hover:text-[#9e0000]"
            >
              <Plus size={15} />
              List another
            </button>
          </div>
          {onExit && (
            <button
              onClick={onExit}
              className="mt-4 text-sm font-medium text-[#8a7a77] hover:text-[#9e0000] transition-colors"
            >
              Back to search
            </button>
          )}
        </section>

        {/* Keep the finished showcase visible on the right */}
        <section className="overflow-y-auto min-h-0 vc-scroll">
          <ListingPreview draft={draft} photos={photos} />
        </section>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4 lg:gap-5 w-full h-full min-h-0">
      {/* Hidden file input shared by both columns */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
      />

      {/* LEFT: Homepage-style chat */}
      <section className="flex flex-col min-h-0 rounded-2xl border border-[#eceae9] bg-[#f9f9f9] overflow-hidden">
        {/* Scrollable canvas */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto vc-scroll">
          <div className="max-w-[620px] mx-auto w-full px-5">
            {hasConversation ? (
              <div className="pt-6 pb-2 flex flex-col gap-3">
                {messages.map((m) => {
                  const text = getText(m.parts as { type: string; text?: string }[])
                  const isUser = m.role === "user"
                  const display = isUser ? text.split("\n\n(The owner has uploaded")[0] : text
                  if (!display) return null
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        isUser
                          ? "self-end bg-[#9e0000] text-white rounded-br-sm"
                          : "self-start bg-white border border-[#eceae9] text-[#1a1c1c] rounded-bl-sm"
                      }`}
                    >
                      {display}
                    </div>
                  )
                })}

                {busy && (
                  <div className="self-start bg-white border border-[#eceae9] rounded-2xl rounded-bl-sm px-3.5 py-3">
                    <span className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-[#c4b8b5] animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 rounded-full bg-[#c4b8b5] animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 rounded-full bg-[#c4b8b5] animate-bounce" />
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Welcome hero — mirrors the consumer homepage */
              <div className="flex flex-col gap-7 pt-10 md:pt-14 pb-4">
                <div className="flex justify-center">
                  <div className="flex items-center gap-2">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-[#9e0000]"
                      aria-hidden="true"
                    >
                      <path d="M12 2L2 22L12 18L22 22L12 2Z" />
                    </svg>
                    <span className="text-[#9e0000] font-black text-2xl tracking-tight leading-none">
                      VenueChat
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <h1 className="text-[26px] md:text-[30px] font-semibold leading-[34px] md:leading-[38px] tracking-[-0.02em] text-[#1a1c1c] mb-3 text-balance">
                    Let&apos;s list your venue.
                    <br />
                    Just tell me about your space.
                  </h1>
                  <p className="text-[15px] md:text-[16px] text-[#5e3f3a] leading-7 max-w-md mx-auto text-pretty">
                    No forms. Describe your venue in plain words — I&apos;ll write a
                    polished listing and you&apos;ll watch it build on the right in
                    real time.
                  </p>
                </div>

                <div className="max-w-sm mx-auto w-full">
                  <button
                    type="button"
                    onClick={() => setImportOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#1a1c1c] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#333]"
                  >
                    <MapPin size={15} />
                    Import from Google Maps
                  </button>
                  <div className="flex items-center gap-3 my-4">
                    <span className="h-px flex-1 bg-[#e8e4e3]" />
                    <span className="text-[11px] font-medium text-[#b8aeac]">or describe it</span>
                    <span className="h-px flex-1 bg-[#e8e4e3]" />
                  </div>
                </div>

                <div className="flex flex-col gap-2 max-w-sm mx-auto w-full">
                  <p className="text-[13px] font-semibold text-[#8a7a77] text-center mb-1">
                    Try one of these to start
                  </p>
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-sm rounded-xl border border-[#e8bdb6]/70 bg-white px-3.5 py-2.5 hover:border-[#9e0000] hover:bg-[#fdecea] transition-colors text-[#3a3a3a] font-medium"
                    >
                      &ldquo;{s}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input dock */}
        <div className="px-4 pt-2 pb-4 bg-gradient-to-t from-[#f9f9f9] via-[#f9f9f9]/95 to-transparent">
          <div className="max-w-[620px] mx-auto w-full">
            {/* Photo strip */}
            {photos.length > 0 && (
              <div className="mb-2 flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-[11px] font-semibold text-[#8a7a77] shrink-0">
                  Photos {photos.length}/{limits.maxPhotosPerListing}:
                </span>
                {photos.map((p, i) => (
                  <div key={i} className="relative h-9 w-12 rounded-md overflow-hidden group shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p || "/placeholder.svg"} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove photo"
                    >
                      <X size={11} />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-[#9e0000]/80 text-white text-[8px] font-bold text-center py-px">
                        COVER
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <ChatInput
              onSubmit={send}
              disabled={busy}
              placeholder="Describe your venue — type or speak…"
            />

            <div className="flex justify-center items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8a7a77] hover:text-[#9e0000] transition-colors"
              >
                {uploading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <ImagePlus size={13} />
                )}
                Add venue photos
              </button>
              <span className="h-3 w-px bg-[#e0dcdb]" />
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8a7a77] hover:text-[#9e0000] transition-colors"
              >
                <MapPin size={13} />
                Import from Maps
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT: Live showcase + save */}
      <section className="flex flex-col gap-4 overflow-y-auto min-h-0 vc-scroll">
        <div className="flex items-center gap-2 px-0.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#3f8f4f] opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3f8f4f]" />
          </span>
          <p className="text-sm font-bold text-[#1a1c1c]">Live showcase</p>
          <span
            className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              plan === "pro"
                ? "bg-[#9e0000]/10 text-[#9e0000]"
                : "bg-[#f0eeed] text-[#8a7a77]"
            }`}
          >
            {plan === "pro" && <Crown size={10} />}
            {plan === "pro" ? "Pro" : "Free plan"}
          </span>
        </div>

        {/* Drop zone (collapsed when photos exist) */}
        {photos.length === 0 && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`rounded-2xl border-2 border-dashed p-5 text-center transition-colors cursor-pointer ${
              dragOver ? "border-[#9e0000] bg-[#9e0000]/5" : "border-[#e0dcdb] bg-white hover:border-[#c4b8b5]"
            }`}
            onClick={() => fileRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-1.5 text-[#5e3f3a]">
              {uploading ? (
                <Loader2 size={20} className="animate-spin text-[#9e0000]" />
              ) : (
                <Upload size={20} className="text-[#9e0000]" />
              )}
              <span className="text-sm font-semibold">Drop photos here or click to upload</span>
              <span className="text-xs text-[#8a7a77]">The first photo becomes your cover image</span>
            </div>
          </div>
        )}

        <ListingPreview draft={draft} photos={photos} />

        {/* Save bar */}
        <div className="rounded-2xl border border-[#eceae9] bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#8a7a77]">
              Listing completeness
            </span>
            <span className="text-xs font-medium text-[#5e3f3a]">
              {completion.filled} / {completion.total} fields
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#f0eeed] overflow-hidden mb-3">
            <div
              className="h-full bg-[#9e0000] rounded-full transition-all duration-500"
              style={{ width: `${(completion.filled / completion.total) * 100}%` }}
            />
          </div>
          {(atListingLimit || limitReached) && (
            <div className="mb-3 overflow-hidden rounded-2xl border border-[#2a1a1a]">
              {/* Dark header band */}
              <div className="bg-[#1a0a0a] px-5 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c79100]/15">
                    <Crown size={16} className="text-[#c79100]" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white tracking-tight">VenueChat Pro</p>
                    <p className="text-[11px] text-[#a08060] mt-0.5 leading-snug">
                      Your free listing is live
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-[#c79100]/30 bg-[#c79100]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#c79100]">
                  Upgrade
                </span>
              </div>
              {/* Light body */}
              <div className="bg-[#fdf8f5] px-5 py-4">
                <p className="text-xs font-medium text-[#3d2a20] leading-relaxed">
                  Unlock{" "}
                  <span className="font-bold text-[#9e0000]">multiple listings</span>,{" "}
                  up to {getPlanLimits("pro").maxPhotosPerListing} photos per venue, full
                  Google Maps import and priority placement in search.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => router.push("/pricing")}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a0a0a] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#2d1010] transition-colors"
                  >
                    <Crown size={12} className="text-[#c79100]" />
                    Upgrade to Pro
                  </button>
                  <button
                    onClick={() => router.push("/pricing")}
                    className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-[#8a7a77] hover:text-[#5e3f3a] transition-colors"
                  >
                    See plans
                  </button>
                </div>
              </div>
            </div>
          )}

          {saveError && !limitReached && (
            <p className="text-sm text-[#9e0000] bg-[#fdecea] rounded-lg px-3 py-2 mb-3">
              {saveError}
            </p>
          )}
          <button
            onClick={save}
            disabled={!completion.ready || saving || atListingLimit}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-[#9e0000] text-white py-3 text-sm font-semibold disabled:opacity-40 hover:bg-[#7e0000] transition-colors"
          >
            {atListingLimit ? (
              <Lock size={16} />
            ) : saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {atListingLimit
              ? "Upgrade to add another listing"
              : completion.ready
                ? "Save listing as draft"
                : "Keep chatting to complete listing"}
          </button>
          {!completion.ready && (
            <p className="text-center text-xs text-[#8a7a77] mt-2">
              Need: {[
                !draft.name && "venue name",
                !draft.venue_type && "venue type",
                !draft.district && "location",
                !draft.capacity_max && "capacity",
                !draft.price_min && "pricing",
              ].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </section>

      <MapsImportDialog
        open={importOpen}
        plan={plan}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />
    </div>
  )
}
