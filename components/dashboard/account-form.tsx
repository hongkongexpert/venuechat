"use client"

import { useState } from "react"
import { updateProfile, type ProfileData } from "@/app/actions/venue-actions"
import { Spinner } from "@/components/ui/spinner"
import { Check } from "lucide-react"

interface AccountFormProps {
  initial: {
    display_name: string | null
    default_guest_count: number | null
    default_budget: string | null
    default_event_type: string | null
    default_district: string | null
  }
}

const inputCls =
  "w-full rounded-lg border border-[#e2dfde] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9e0000] transition-colors"
const labelCls = "text-sm font-medium text-[#1a1c1c]"

export function AccountForm({ initial }: AccountFormProps) {
  const [form, setForm] = useState({
    display_name: initial.display_name ?? "",
    default_guest_count: initial.default_guest_count?.toString() ?? "",
    default_budget: initial.default_budget ?? "",
    default_event_type: initial.default_event_type ?? "",
    default_district: initial.default_district ?? "",
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    const payload: ProfileData = {
      display_name: form.display_name || null,
      default_guest_count: form.default_guest_count
        ? Number.parseInt(form.default_guest_count, 10)
        : null,
      default_budget: form.default_budget || null,
      default_event_type: form.default_event_type || null,
      default_district: form.default_district || null,
    }
    const res = await updateProfile(payload)
    setSaving(false)
    if (!res.ok) {
      setError(res.error || "Could not save changes.")
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="display_name" className={labelCls}>
          Display name
        </label>
        <input
          id="display_name"
          value={form.display_name}
          onChange={(e) => setForm({ ...form, display_name: e.target.value })}
          className={inputCls}
          placeholder="Your name"
        />
      </div>

      <div className="border-t border-[#f0eeed] pt-4">
        <h3 className="text-sm font-semibold text-[#1a1c1c] mb-1">Event preferences</h3>
        <p className="text-xs text-[#9a9999] mb-3">
          We&apos;ll use these to personalise venue recommendations.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="default_event_type" className={labelCls}>
              Event type
            </label>
            <input
              id="default_event_type"
              value={form.default_event_type}
              onChange={(e) => setForm({ ...form, default_event_type: e.target.value })}
              className={inputCls}
              placeholder="e.g. Wedding"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="default_guest_count" className={labelCls}>
              Typical guest count
            </label>
            <input
              id="default_guest_count"
              type="number"
              min={1}
              value={form.default_guest_count}
              onChange={(e) => setForm({ ...form, default_guest_count: e.target.value })}
              className={inputCls}
              placeholder="e.g. 80"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="default_budget" className={labelCls}>
              Budget range
            </label>
            <input
              id="default_budget"
              value={form.default_budget}
              onChange={(e) => setForm({ ...form, default_budget: e.target.value })}
              className={inputCls}
              placeholder="e.g. HK$50k–100k"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="default_district" className={labelCls}>
              Preferred district
            </label>
            <input
              id="default_district"
              value={form.default_district}
              onChange={(e) => setForm({ ...form, default_district: e.target.value })}
              className={inputCls}
              placeholder="e.g. Central"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-[#9e0000] bg-[#fdecea] rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9e0000] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving && <Spinner className="size-4" />}
          Save changes
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-[#1a7f37]">
            <Check size={16} /> Saved
          </span>
        )}
      </div>
    </form>
  )
}
