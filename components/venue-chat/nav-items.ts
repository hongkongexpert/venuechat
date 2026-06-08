import {
  Heart,
  History,
  Scale,
  ClipboardList,
  Compass,
  type LucideIcon,
} from "lucide-react"
import type { PanelId } from "./app-context"

export interface NavItem {
  icon: LucideIcon
  label: string
  id: Exclude<PanelId, null>
}

export const NAV_ITEMS: NavItem[] = [
  { icon: Heart, label: "Saved", id: "saved" },
  { icon: History, label: "History", id: "history" },
  { icon: Scale, label: "Compare", id: "compare" },
  { icon: ClipboardList, label: "Enquiries", id: "enquiries" },
  { icon: Compass, label: "Explore", id: "explore" },
]
