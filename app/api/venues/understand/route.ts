import { NextResponse } from "next/server"
import { generateText, Output } from "ai"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const maxDuration = 30

const IntentSchema = z.object({
  intent: z
    .enum(["search", "greeting", "smalltalk", "help", "off_topic"])
    .describe(
      "Classify the user's latest message. 'search' = they want to find a venue/space. 'greeting' = hi/hello/hey. 'smalltalk' = thanks, ok, casual chat. 'help' = asking what you can do. 'off_topic' = unrelated to venues.",
    ),
  reply: z
    .string()
    .describe(
      "A short, warm conversational reply (1-2 sentences) to show when intent is NOT 'search'. Empty string when intent IS 'search'.",
    ),
  searchQuery: z
    .string()
    .describe(
      "When intent is 'search', a clean, optimized Google Maps query for Hong Kong venues (e.g. 'rooftop bar with harbour view', 'wedding banquet hall Tsim Sha Tsui'). Strip filler words. Empty string otherwise.",
    ),
  wantsNearMe: z
    .boolean()
    .describe(
      "true ONLY if the user explicitly wants venues near their current location (e.g. 'near me', 'close by', 'around here', 'nearby').",
    ),
  district: z
    .string()
    .nullable()
    .describe(
      "The Hong Kong neighbourhood/district mentioned (e.g. 'Central', 'Tsim Sha Tsui'), or null if none.",
    ),
  introText: z
    .string()
    .describe(
      "When intent is 'search', a friendly one-line intro to show above the results (e.g. 'Here are some great rooftop bars in Central:'). Empty string otherwise.",
    ),
})

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Missing 'message' in request body" },
        { status: 400 },
      )
    }

    const historyText = Array.isArray(history)
      ? history
          .slice(-6)
          .map(
            (m: { role: string; text?: string }) =>
              `${m.role === "user" ? "User" : "Assistant"}: ${m.text ?? ""}`,
          )
          .join("\n")
      : ""

    const { experimental_output } = await generateText({
      model: "openai/gpt-5.4-mini",
      experimental_output: Output.object({ schema: IntentSchema }),
      system: `You are VenueChat, an AI concierge that helps people find event venues and spaces in Hong Kong (bars, restaurants, banquet halls, studios, rooftops, hotels, co-working, galleries, etc).

Your job is to understand the user's LATEST message and decide what to do:
- If they are looking for a place/venue/space → intent "search" and build an optimized Google Maps search query.
- If they just say hi/hello → intent "greeting", reply warmly and invite them to describe their event. DO NOT search.
- If they say thanks/ok/cool → intent "smalltalk", reply briefly. DO NOT search.
- If they ask what you can do → intent "help", explain you find Hong Kong venues. DO NOT search.
- If unrelated to venues/events → intent "off_topic", politely steer back. DO NOT search.

For search queries:
- Optimize for Google Maps. Keep venue type + qualities + location. Remove conversational filler.
- Detect "near me" intent precisely — only set wantsNearMe true for explicit proximity language.
- Extract the Hong Kong district if mentioned.
- Prefer specific, high-intent phrasing that returns the best matching results.

Always keep replies concise, friendly, and on-brand for a premium Hong Kong venue concierge.`,
      messages: [
        {
          role: "user",
          content: historyText
            ? `Conversation so far:\n${historyText}\n\nLatest user message: ${message}`
            : `Latest user message: ${message}`,
        },
      ],
    })

    return NextResponse.json(experimental_output)
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to understand message"
    console.log("[v0] understand error:", msg)
    // Fallback: treat as a search so the app still works if the model fails
    return NextResponse.json({
      intent: "search",
      reply: "",
      searchQuery: "",
      wantsNearMe: false,
      district: null,
      introText: "",
    })
  }
}
