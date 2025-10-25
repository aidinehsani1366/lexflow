#!/usr/bin/env node
/**
 * Clears the stripe_customer_id for a given Supabase user so that the next
 * “Manage billing” action can create a fresh Stripe customer in the selected mode.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run reset-stripe-customer -- <user-id>
 */
import { createClient } from "@supabase/supabase-js";

const userId = process.argv[2];

if (!userId) {
  console.error("⚠️  Please provide a Supabase user ID.\nExample: npm run reset-stripe-customer -- <user-id>");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("⚠️  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

try {
  const { error } = await supabase
    .from("subscriptions")
    .update({ stripe_customer_id: null })
    .eq("user_id", userId);

  if (error) {
    console.error("❌ Failed to reset stripe_customer_id:", error.message);
    process.exit(1);
  }

  console.log(`✅ stripe_customer_id cleared for user ${userId}. Next billing-portal visit will create a new Stripe customer in the current mode.`);
} catch (err) {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
}
