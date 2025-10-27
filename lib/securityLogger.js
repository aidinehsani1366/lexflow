import { supabaseAdmin } from "./serverSupabase";

const SECURITY_WEBHOOK_URL = process.env.SECURITY_WEBHOOK_URL;

export async function logSecurityEvent(eventType, details = {}) {
  try {
    await supabaseAdmin.from("security_events").insert({
      event_type: eventType,
      details,
    });
  } catch (err) {
    console.error("Failed to persist security event", err);
  }

  if (SECURITY_WEBHOOK_URL) {
    try {
      await fetch(SECURITY_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: eventType,
          details,
          created_at: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error("Failed to notify security webhook", err);
    }
  }
}
