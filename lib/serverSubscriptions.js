import { supabaseAdmin } from "./serverSupabase";
import { PLAN_PRESETS } from "./planConfig";

export async function ensureSubscription(userId) {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  if (data) return data;

  const preset = PLAN_PRESETS.solo;
  const { data: insertData, error: insertError } = await supabaseAdmin
    .from("subscriptions")
    .insert({
      user_id: userId,
      plan: "solo",
      seat_limit: preset.seat_limit,
      docs_quota: preset.docs_quota,
      ai_quota: preset.ai_quota,
      status: "active",
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return insertData;
}
