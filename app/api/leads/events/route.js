import { supabaseAdmin, getUserFromRequest } from "../../../../lib/serverSupabase";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

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
    const leadId = searchParams.get("leadId");
    if (!leadId) {
      return jsonResponse({ error: "leadId query param is required" }, 400);
    }

    if (!isAdmin) {
      const { data: lead, error: leadError } = await supabaseAdmin
        .from("leads")
        .select("firm_id, assigned_to")
        .eq("id", leadId)
        .maybeSingle();

      if (leadError || !lead) {
        return jsonResponse({ error: "Lead not found" }, 404);
      }

      const canView = lead.assigned_to === user.id || lead.firm_id === profile.firm_id;
      if (!canView) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }
    }

    const { data, error } = await supabaseAdmin
      .from("lead_events")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const actorIds = Array.from(new Set((data || []).map((event) => event.actor_id).filter(Boolean)));
    const actorEmails = {};
    await Promise.all(
      actorIds.map(async (actorId) => {
        try {
          const { data: actorData, error: actorError } = await supabaseAdmin.auth.admin.getUserById(
            actorId
          );
          if (actorError) throw actorError;
          actorEmails[actorId] = actorData?.user?.email || "";
        } catch (actorErr) {
          console.error("Failed to load actor for lead event", actorErr);
        }
      })
    );

    const enriched =
      data?.map((event) => ({
        ...event,
        actor_email: event.actor_id ? actorEmails[event.actor_id] || "Unknown user" : "System",
      })) || [];

    return jsonResponse({ data: enriched });
  } catch (err) {
    console.error("GET /api/leads/events error:", err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to load lead history" }, status);
  }
}
