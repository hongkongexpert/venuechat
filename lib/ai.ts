import { createOpenRouter } from "@openrouter/ai-sdk-provider"

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

// Opus 4.8 via OpenRouter. Override with OPENROUTER_MODEL if needed.
export const VENUE_AI_MODEL = openrouter(
  process.env.OPENROUTER_MODEL || "anthropic/claude-opus-4.8",
)
