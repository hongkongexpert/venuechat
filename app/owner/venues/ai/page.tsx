import { redirect } from "next/navigation"

// The AI creator is now the default view on /owner
export default function OldAiPage() {
  redirect("/owner")
}
