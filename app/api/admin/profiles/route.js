import { supabaseAdmin, getUserFromRequest } from "../../../../lib/serverSupabase";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const ROLE_OPTIONS = ["admin", "firm_admin", "firm_staff", "user"];

async function getProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load profile role", error);
    throw new Error(error.message || "Failed to load profile");
  }

  if (data) return data;

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("profiles")
    .insert({ id: userId })
    .select("role")
    .single();

  if (insertError) {
    console.error("Failed to create profile", insertError);
    throw new Error(insertError.message || "Failed to create profile");
  }

  return inserted;
}

async function ensureAdmin(userId) {
  const profile = await getProfile(userId);
  if (profile.role !== "admin") {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
}

async function listUsersEmails() {
  const emails = new Map();
  let page = 1;
  const perPage = 100;

  // Loop until Stripe returns fewer than perPage results.
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("Failed to list users for role manager:", error);
      break;
    }
    const users = data?.users || [];
    users.forEach((user) => {
      emails.set(user.id, user.email || "");
    });
    if (users.length < perPage) break;
    page += 1;
  }
  return emails;
}

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    await ensureAdmin(user.id);

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, role, firm_id, created_at")
      .order("created_at", { ascending: true });

    if (error) throw error;

    const emails = await listUsersEmails();

    return jsonResponse({
      data: (profiles || []).map((profile) => ({
        ...profile,
        email: emails.get(profile.id) || "",
      })),
    });
  } catch (err) {
    console.error("GET /api/admin/profiles error:", err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to load profiles" }, status);
  }
}

export async function PATCH(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    await ensureAdmin(user.id);

    const { userId, role, firmId } = await req.json();
    if (!userId || !ROLE_OPTIONS.includes(role)) {
      return jsonResponse({ error: "Invalid payload" }, 400);
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ role, firm_id: firmId || null })
      .eq("id", userId)
      .select("id, role, firm_id, created_at")
      .single();

    if (error) throw error;

    return jsonResponse({ data });
  } catch (err) {
    console.error("PATCH /api/admin/profiles error:", err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to update profile" }, status);
  }
}
