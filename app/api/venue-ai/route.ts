import { streamText, convertToModelMessages, tool, stepCountIs, type UIMessage } from "ai"
import { z } from "zod"
import { VENUE_AI_MODEL } from "@/lib/ai"
import { listingDraftSchema } from "@/lib/listing-template"

export const maxDuration = 60

const SYSTEM_PROMPT = `You are the VenueChat Listing Assistant. You help venue owners create a beautiful, professional venue listing purely through conversation — they should NEVER have to fill out a form.

Your job:
- Have a warm, efficient back-and-forth conversation to gather details about their venue.
- Ask only 1-2 short questions at a time. Be friendly and concise.
- As soon as you learn ANYTHING concrete (a name, a type, a capacity, a price, an amenity, etc.), immediately call the "updateListing" tool to record it. Call it frequently as the conversation evolves — every time you learn or refine a detail.
- You are an expert copywriter. Don't just copy what the owner types — transform rough notes into a polished, inviting "description" and a punchy "short_description". Write in professional, evocative marketing prose.
- It is completely fine if the owner only has SOME information. Never block on missing fields. Record what you have, leave the rest null, and gently offer to fill gaps. The listing template is always the same shape regardless of which fields are present.
- Prices are in Hong Kong Dollars (HKD), whole numbers. Districts are Hong Kong districts.
- If the owner uploads photos, acknowledge them warmly and use any visual cues they mention (e.g. "rooftop", "sea view") to enrich the listing.
- When the core fields (name, venue_type, description) are filled, tell the owner the listing looks ready and that they can save it with the "Save listing" button on the right, then continue refining if they want.

Keep your chat replies short and human. The rich content goes into the listing via the tool, not into long chat messages.`

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: VENUE_AI_MODEL,
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(6),
    tools: {
      updateListing: tool({
        description:
          "Record or update fields of the venue listing draft. Call this whenever you learn a new detail. Only include the fields you are updating; omitted fields keep their previous value. Always write polished marketing copy for description and short_description.",
        inputSchema: listingDraftSchema.partial(),
        execute: async (patch) => {
          // Echo the patch back; the client merges it into the live preview.
          return patch
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
