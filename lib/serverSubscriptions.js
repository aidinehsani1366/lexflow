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

  if (data) {
    if (data.status === "trialing" && data.trial_ends_at) {
      const trialEnds = new Date(data.trial_ends_at);
      if (!Number.isNaN(trialEnds.getTime()) && trialEnds < new Date()) {
        const { data: expiredData, error: expiredError } = await supabaseAdmin
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("id", data.id)
          .select()
          .single();
        if (expiredError) throw expiredError;
        return expiredData;
      }
    }
    return data;
  }

  const preset = PLAN_PRESETS.solo;
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 7);
  const { data: insertData, error: insertError } = await supabaseAdmin
    .from("subscriptions")
    .insert({
      user_id: userId,
      plan: "solo",
      seat_limit: preset.seat_limit,
      docs_quota: preset.docs_quota,
      ai_quota: preset.ai_quota,
      status: "trialing",
      trial_ends_at: trialEndsAt.toISOString(),
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return insertData;
}
