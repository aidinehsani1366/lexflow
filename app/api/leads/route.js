import { supabaseAdmin, getUserFromRequest } from "../../../lib/serverSupabase";
import { logSecurityEvent } from "../../../lib/securityLogger";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitStore = new Map();
const SPAM_TERMS = ["loan", "crypto", "seo", "marketing", "viagra", "casino", "forex"];

function isRateLimited(ipAddress) {
  if (!ipAddress) return false;
  const now = Date.now();
  const hits = rateLimitStore.get(ipAddress) || [];
  const recent = hits.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  rateLimitStore.set(ipAddress, recent);
  return recent.length > RATE_LIMIT_MAX;
}

function looksLikeSpam(body) {
  const summary = body?.summary?.toLowerCase() || "";
  const combined = `${summary} ${body?.contact_name || ""} ${body?.case_type || ""}`.toLowerCase();
  let score = 0;
  if (!summary || summary.length < 12) score += 1;
  if (/(https?:\/\/|www\.)/.test(combined)) score += 1;
  if (SPAM_TERMS.some((term) => combined.includes(term))) score += 1;
  return score >= 2;
}

async function getProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role, firm_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load profile", error);
    throw new Error("Failed to load profile");
  }

  if (data) return data;

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("profiles")
    .insert({ id: userId })
    .select("role, firm_id")
    .single();

  if (insertError) throw new Error(insertError.message);

  return inserted;
}

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const profile = await getProfile(user.id);
    const isAdmin = profile.role === "admin";

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    let query = supabaseAdmin
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      const filters = [`assigned_to.eq.${user.id}`];
      if (profile.firm_id) {
        filters.push(`firm_id.eq.${profile.firm_id}`);
      }
      query = query.or(filters.join(","));
    }

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return jsonResponse({ data: data || [] });
  } catch (err) {
    console.error("GET /api/leads error:", err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to load leads" }, status);
  }
}

export async function POST(req) {
  const requestIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  try {
    const body = await req.json();
    const contact_name = body?.contact_name?.trim();
    if (!contact_name) {
      return jsonResponse({ error: "Name is required." }, 400);
    }
    if (!body?.consent) {
      return jsonResponse({ error: "Consent is required." }, 400);
    }
    const ipAddress = requestIp;

    if (isRateLimited(ipAddress)) {
      await logSecurityEvent("lead_rate_limited", {
        ip: ipAddress,
        email: body?.email || null,
      });
      return jsonResponse({ error: "Too many submissions. Please try again later." }, 429);
    }

    if (looksLikeSpam(body)) {
      await logSecurityEvent("lead_spam_blocked", {
        ip: ipAddress,
        email: body?.email || null,
      });
      return jsonResponse({ error: "Submission flagged as spam." }, 400);
    }

    const consentText =
      body?.consent_text ||
      "I agree that LexFlow and its partner law firms may contact me about my case.";

    const payload = {
      contact_name,
      email: body?.email || null,
      phone: body?.phone || null,
      case_type: body?.case_type || null,
      jurisdiction: body?.jurisdiction || null,
      summary: body?.summary || null,
      source: body?.source || "website",
      metadata: body?.metadata || null,
      firm_id: body?.firm_id || null,
      consent_text: consentText,
      consented_at: new Date().toISOString(),
      submitted_ip: ipAddress,
    };

    const { data, error } = await supabaseAdmin.from("leads").insert(payload).select().single();
    if (error) throw error;

    await supabaseAdmin.from("lead_events").insert({
      lead_id: data.id,
      event_type: "intake_submitted",
      details: {
        source: payload.source,
        consent_text: payload.consent_text,
      },
    });

    return jsonResponse({ success: true }, 201);
  } catch (err) {
    console.error("POST /api/leads error:", err);
    await logSecurityEvent("lead_intake_failed", {
      error: err.message,
      ip: requestIp,
    });
    return jsonResponse({ error: err.message || "Failed to submit lead" }, 500);
  }
}
