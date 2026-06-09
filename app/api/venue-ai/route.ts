import { streamText, convertToModelMessages, tool, stepCountIs, type UIMessage } from "ai"
import { z } from "zod"
import { VENUE_AI_MODEL } from "@/lib/ai"
import { listingDraftSchema } from "@/lib/listing-template"
import { searchVenues, getVenuePhotos } from "@/lib/serpapi"

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

GOOGLE MAPS AUTO-IMPORT:
- When the owner names an existing, real venue (e.g. "my restaurant is called Lily & Bloom in Central"), use the "lookupVenueOnMaps" tool to find it on Google Maps.
- If you find a clear match, immediately call "updateListing" with the matched details (name, venue_type, district, area, address, contact_phone, website_url) — but always rewrite the description and short_description into polished marketing copy rather than using raw Google text.
- After a successful match, call "getMapsPhotos" with the match's data_id, then call "setPhotos" with the returned image URLs so the owner's listing has real photos.
- Briefly tell the owner what you imported and ask them to confirm or correct it. Never invent capacity or pricing — ask the owner for those.
- If there are several possible matches, ask a quick clarifying question before importing.

Keep your chat replies short and human. The rich content goes into the listing via the tools, not into long chat messages.`

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: VENUE_AI_MODEL,
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(8),
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
      lookupVenueOnMaps: tool({
        description:
          "Search Google Maps for a real, existing venue by name (optionally with a district) to auto-import its details. Returns up to 5 candidate matches with a data_id you can pass to getMapsPhotos.",
        inputSchema: z.object({
          query: z
            .string()
            .describe("The venue name, ideally with its district, e.g. 'Lily & Bloom Central'"),
        }),
        execute: async ({ query }) => {
          try {
            const results = await searchVenues(query)
            return {
              candidates: results.slice(0, 5).map((v) => ({
                data_id: v.id,
                name: v.name,
                type: v.type ?? null,
                district: v.district ?? null,
                address: v.address ?? null,
                phone: v.phone ?? null,
                website: v.website ?? null,
                description: v.description ?? null,
              })),
            }
          } catch (e) {
            return { error: e instanceof Error ? e.message : "Lookup failed" }
          }
        },
      }),
      getMapsPhotos: tool({
        description:
          "Fetch real photos for a venue from Google Maps using the data_id returned by lookupVenueOnMaps. Returns a list of image URLs.",
        inputSchema: z.object({
          data_id: z.string().describe("The data_id of the matched venue"),
        }),
        execute: async ({ data_id }) => {
          try {
            const photos = await getVenuePhotos(data_id)
            return {
              photos: photos
                .map((p) => p.image)
                .filter(Boolean)
                .slice(0, 10),
            }
          } catch (e) {
            return { error: e instanceof Error ? e.message : "Photo fetch failed" }
          }
        },
      }),
      setPhotos: tool({
        description:
          "Attach photos to the listing. Pass the image URLs returned by getMapsPhotos. The client adds them to the listing (respecting the owner's plan photo limit).",
        inputSchema: z.object({
          urls: z.array(z.string()).describe("Image URLs to add to the listing"),
        }),
        execute: async ({ urls }) => {
          // Echo back; the client merges into the live photo list.
          return { urls }
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
