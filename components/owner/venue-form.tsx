"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { createVenue, updateVenue, type VenueListing } from "@/app/actions/venue-actions"
import { Spinner } from "@/components/ui/spinner"

interface VenueFormProps {
  userId: string
  venue?: VenueListing | null
}

const DISTRICTS = [
  "Central", "Wan Chai", "Causeway Bay", "Tsim Sha Tsui", "Mong Kok",
  "Sheung Wan", "Sai Ying Pun", "Kennedy Town", "North Point", "Quarry Bay",
  "Kowloon Tong", "Kwun Tong", "Sha Tin", "Tsuen Wan", "Other",
]

const VENUE_TYPES = [
  "Restaurant", "Rooftop", "Banquet hall", "Bar / Lounge", "Hotel ballroom",
  "Gallery / Studio", "Garden / Outdoor", "Private kitchen", "Event space", "Other",
]

export function VenueForm({ userId, venue }: VenueFormProps) {
  const router = useRouter()
  const editing = !!venue
  const inputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(venue?.name ?? "")
  const [shortDescription, setShortDescription] = useState(venue?.short_description ?? "")
  const [description, setDescription] = useState(venue?.description ?? "")
  const [venueType, setVenueType] = useState(venue?.venue_type ?? "")
  const [district, setDistrict] = useState(venue?.district ?? "")
  const [address, setAddress] = useState(venue?.address ?? "")
  const [capacityMin, setCapacityMin] = useState(venue?.capacity_min?.toString() ?? "")
  const [capacityMax, setCapacityMax] = useState(venue?.capacity_max?.toString() ?? "")
  const [priceMin, setPriceMin] = useState(venue?.price_min?.toString() ?? "")
  const [priceMax, setPriceMax] = useState(venue?.price_max?.toString() ?? "")
  const [contactEmail, setContactEmail] = useState(venue?.contact_email ?? "")
  const [contactPhone, setContactPhone] = useState(venue?.contact_phone ?? "")
  const [websiteUrl, setWebsiteUrl] = useState(venue?.website_url ?? "")
  const [coverImage, setCoverImage] = useState<string | null>(venue?.cover_image ?? null)

  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const path = `${userId}/cover-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from("venue-images")
      .upload(path, file, { upsert: true, cacheControl: "3600" })
    if (upErr) {
      setError(upErr.message)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from("venue-images").getPublicUrl(path)
    setCoverImage(data.publicUrl)
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError("Please enter a venue name.")
      return
    }
    setSaving(true)
    const input = {
      name,
      short_description: shortDescription || null,
      description: description || null,
      venue_type: venueType || null,
      district: district || null,
      address: address || null,
      capacity_min: capacityMin ? Number.parseInt(capacityMin) : null,
      capacity_max: capacityMax ? Number.parseInt(capacityMax) : null,
      price_min: priceMin ? Number.parseInt(priceMin) : null,
      price_max: priceMax ? Number.parseInt(priceMax) : null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      website_url: websiteUrl || null,
      cover_image: coverImage,
    }

    const res = editing
      ? await updateVenue(venue.id, input)
      : await createVenue(input)
    setSaving(false)
    if (!res.ok) {
      setError(res.error || "Could not save the venue.")
      return
    }
    const id = editing ? venue.id : (res as { id?: string }).id
    router.push(`/owner/venues/${id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Cover image */}
      <div>
        <label className="text-sm font-medium text-[#1a1c1c]">Cover photo</label>
        <div className="mt-2 relative overflow-hidden rounded-xl border border-[#e2dfde] bg-[#f3f3f3] aspect-[16/9]">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImage || "/placeholder.svg"} alt="Venue cover" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-[#9a9999]">
              No cover photo yet
            </div>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#5e3f3a] shadow-sm hover:bg-white transition-colors disabled:opacity-60"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            {coverImage ? "Change" : "Upload"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleCover}
            className="hidden"
          />
        </div>
      </div>

      <Field label="Venue name" required>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={inputCls}
          placeholder="e.g. The Rooftop at Central"
        />
      </Field>

      <Field label="Short tagline">
        <input
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          maxLength={120}
          className={inputCls}
          placeholder="One line that sums up your space"
        />
      </Field>

      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={`${inputCls} resize-y`}
          placeholder="Tell planners what makes your venue special…"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Venue type">
          <select value={venueType} onChange={(e) => setVenueType(e.target.value)} className={inputCls}>
            <option value="">Select type</option>
            {VENUE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="District">
          <select value={district} onChange={(e) => setDistrict(e.target.value)} className={inputCls}>
            <option value="">Select district</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Address">
        <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} placeholder="Street address" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Min capacity">
          <input type="number" min={0} value={capacityMin} onChange={(e) => setCapacityMin(e.target.value)} className={inputCls} placeholder="e.g. 20" />
        </Field>
        <Field label="Max capacity">
          <input type="number" min={0} value={capacityMax} onChange={(e) => setCapacityMax(e.target.value)} className={inputCls} placeholder="e.g. 200" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Price from (HK$)">
          <input type="number" min={0} value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className={inputCls} placeholder="e.g. 5000" />
        </Field>
        <Field label="Price to (HK$)">
          <input type="number" min={0} value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className={inputCls} placeholder="e.g. 50000" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Contact email">
          <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={inputCls} placeholder="bookings@venue.com" />
        </Field>
        <Field label="Contact phone">
          <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={inputCls} placeholder="+852 …" />
        </Field>
      </div>

      <Field label="Website">
        <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className={inputCls} placeholder="https://…" />
      </Field>

      {error && <p className="text-sm text-[#9e0000]">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9e0000] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {saving && <Spinner className="size-4" />}
          {editing ? "Save changes" : "Create listing"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/owner")}
          className="rounded-full border border-[#e2dfde] bg-white px-6 py-2.5 text-sm font-semibold text-[#5e3f3a] hover:bg-[#f5f5f5] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

const inputCls =
  "w-full rounded-lg border border-[#e2dfde] bg-white px-3 py-2.5 text-base outline-none focus:border-[#9e0000] transition-colors"

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[#1a1c1c]">
        {label}
        {required && <span className="text-[#9e0000]"> *</span>}
      </label>
      {children}
    </div>
  )
}
