import "server-only"

import { createClient } from "@supabase/supabase-js"

/**
 * Admin Supabase client that uses the service role key.
 * Bypasses RLS — only use in trusted server contexts (e.g. verifying a Stripe
 * Checkout session and writing venue_subscriptions, which has no owner-insert policy).
 * NEVER import this into client components.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  )
}
