import { supabaseAdmin } from "./serverSupabase";

export const PLAN_PRESETS = {
  solo: { seat_limit: 1, docs_quota: 100, ai_quota: 300 },
  team: { seat_limit: 10, docs_quota: 1000, ai_quota: 2000 },
  firm: { seat_limit: 1000, docs_quota: 100000, ai_quota: 100000 },
};

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
