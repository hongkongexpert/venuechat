"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import {
  getSavedVenueKeys,
  toggleSavedVenue as toggleSavedVenueAction,
} from "@/app/actions/venue-actions"
import type { SerpVenue } from "@/lib/serpapi"

export type PanelId =
  | "saved"
  | "history"
  | "compare"
  | "enquiries"
  | "explore"
  | null

export type SettingsTab = "account" | "preferences" | "data"

interface AppContextValue {
  user: User | null
  loadingUser: boolean
  savedKeys: Set<string>
  isSaved: (venue: SerpVenue) => boolean
  toggleSaved: (venue: SerpVenue) => Promise<boolean>
  // panel control
  activePanel: PanelId
  openPanel: (id: PanelId) => void
  closePanel: () => void
  // settings modal control
  settingsOpen: boolean
  settingsTab: SettingsTab
  openSettings: (tab?: SettingsTab) => void
  closeSettings: () => void
  // inline "list your venue" mode (lives on the homepage)
  listMode: boolean
  openListMode: () => void
  closeListMode: () => void
  // compare list (session only)
  compare: SerpVenue[]
  toggleCompare: (venue: SerpVenue) => void
  isComparing: (venue: SerpVenue) => boolean
  clearCompare: () => void
  // refresh signal for panels to re-fetch
  dataVersion: number
  bumpData: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

const venueKey = (v: SerpVenue) => v.id || v.name

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const [activePanel, setActivePanel] = useState<PanelId>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("account")
  const [listMode, setListMode] = useState(false)
  const [compare, setCompare] = useState<SerpVenue[]>([])
  const [dataVersion, setDataVersion] = useState(0)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient()
    return supabaseRef.current
  }

  const bumpData = useCallback(() => setDataVersion((v) => v + 1), [])

  const openSettings = useCallback((tab: SettingsTab = "account") => {
    setSettingsTab(tab)
    setSettingsOpen(true)
    setActivePanel(null)
  }, [])

  const closeSettings = useCallback(() => setSettingsOpen(false), [])

  const openListMode = useCallback(() => {
    setListMode(true)
    setActivePanel(null)
    setSettingsOpen(false)
  }, [])

  const closeListMode = useCallback(() => setListMode(false), [])

  // Load auth state + subscribe to changes
  useEffect(() => {
    const supabase = getSupabase()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
      setLoadingUser(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Load saved keys whenever the user changes
  useEffect(() => {
    if (!user) {
      setSavedKeys(new Set())
      return
    }
    getSavedVenueKeys().then((keys) => setSavedKeys(new Set(keys)))
  }, [user, dataVersion])

  const isSaved = useCallback(
    (venue: SerpVenue) => savedKeys.has(venueKey(venue)),
    [savedKeys],
  )

  const toggleSaved = useCallback(
    async (venue: SerpVenue) => {
      if (!user) {
        setActivePanel(null)
        window.location.href = "/auth/login"
        return false
      }
      const key = venueKey(venue)
      // optimistic
      setSavedKeys((prev) => {
        const next = new Set(prev)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
      const res = await toggleSavedVenueAction(venue)
      if (!res.ok) {
        // revert on failure
        setSavedKeys((prev) => {
          const next = new Set(prev)
          if (next.has(key)) next.delete(key)
          else next.add(key)
          return next
        })
        return false
      }
      bumpData()
      return res.saved ?? false
    },
    [user, bumpData],
  )

  const toggleCompare = useCallback((venue: SerpVenue) => {
    setCompare((prev) => {
      const key = venueKey(venue)
      const exists = prev.some((v) => venueKey(v) === key)
      if (exists) return prev.filter((v) => venueKey(v) !== key)
      if (prev.length >= 3) return prev // cap at 3
      return [...prev, venue]
    })
  }, [])

  const isComparing = useCallback(
    (venue: SerpVenue) => compare.some((v) => venueKey(v) === venueKey(venue)),
    [compare],
  )

  const clearCompare = useCallback(() => setCompare([]), [])

  return (
    <AppContext.Provider
      value={{
        user,
        loadingUser,
        savedKeys,
        isSaved,
        toggleSaved,
        activePanel,
        openPanel: setActivePanel,
        closePanel: () => setActivePanel(null),
        settingsOpen,
        settingsTab,
        openSettings,
        closeSettings,
        listMode,
        openListMode,
        closeListMode,
        compare,
        toggleCompare,
        isComparing,
        clearCompare,
        dataVersion,
        bumpData,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
