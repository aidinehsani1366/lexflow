import { supabaseAdmin, getUserFromRequest } from "../../../../../lib/serverSupabase";
import { ensureSubscription } from "../../../../../lib/serverSubscriptions";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function fetchCase(caseId) {
  const { data, error } = await supabaseAdmin
    .from("cases")
    .select("id, user_id, created_at, title")
    .eq("id", caseId)
    .single();

  if (error || !data) {
    const err = new Error(error?.message || "Case not found");
    err.status = error?.code === "PGRST116" ? 404 : 500;
    throw err;
  }
  return data;
}

async function ensureCaseAccess(caseId, userId) {
  const caseRow = await fetchCase(caseId);
  if (caseRow.user_id === userId) return caseRow;

  const { data: membership, error } = await supabaseAdmin
    .from("case_members")
    .select("member_id")
    .eq("case_id", caseId)
    .eq("member_id", userId);

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  if (!membership || membership.length === 0) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  return caseRow;
}

async function fetchAuthUser(userId) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data?.user) {
    const err = new Error(error?.message || "User not found");
    err.status = 404;
    throw err;
  }
  return data.user;
}

async function buildMembersPayload(caseRow, currentUserId) {
  const ownerUser = await fetchAuthUser(caseRow.user_id);
  const { data: memberRows, error } = await supabaseAdmin
    .from("case_members")
    .select("id, member_id, role, created_at")
    .eq("case_id", caseRow.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const collaborators = await Promise.all(
    (memberRows || []).map(async (row) => {
      const memberUser = await fetchAuthUser(row.member_id);
      return {
        id: row.id,
        member_id: row.member_id,
        email: memberUser.email,
        role: row.role,
        created_at: row.created_at,
      };
    })
  );

  return {
    owner: {
      member_id: caseRow.user_id,
      email: ownerUser.email,
      role: "owner",
      created_at: caseRow.created_at,
    },
    collaborators,
    isOwner: currentUserId === caseRow.user_id,
  };
}

async function findUserByEmail(email) {
  const normalized = email.toLowerCase();
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      throw new Error(error.message);
    }
    const users = data?.users || [];
    const match = users.find(
      (user) => user.email?.toLowerCase() === normalized
    );
    if (match) return match;
    if (users.length < perPage) break;
    page += 1;
  }
  return null;
}

export async function GET(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const caseRow = await ensureCaseAccess(params.id, user.id);
    const payload = await buildMembersPayload(caseRow, user.id);
    return jsonResponse({ data: payload });
  } catch (err) {
    console.error(`GET /api/cases/${params.id}/members error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to load members" }, status);
  }
}

export async function POST(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const caseRow = await ensureCaseAccess(params.id, user.id);
    if (caseRow.user_id !== user.id) {
      return jsonResponse({ error: "Only case owners can invite members." }, 403);
    }

    const subscription = await ensureSubscription(caseRow.user_id);

    const { data: ownerCases, error: ownerCasesError } = await supabaseAdmin
      .from("cases")
      .select("id")
      .eq("user_id", caseRow.user_id);

    if (ownerCasesError) throw ownerCasesError;

    const ownerCaseIds = (ownerCases || []).map((row) => row.id);

    let collaboratorCount = 0;
    if (ownerCaseIds.length > 0) {
      const { count, error: memberCountError } = await supabaseAdmin
        .from("case_members")
        .select("*", { count: "exact", head: true })
        .in("case_id", ownerCaseIds);

      if (memberCountError) throw memberCountError;
      collaboratorCount = count || 0;
    }

    const seatUsage = 1 + collaboratorCount;
    if (seatUsage >= subscription.seat_limit) {
      return jsonResponse(
        {
          error:
            "Seat limit reached. Remove a member or upgrade your plan on the billing page.",
        },
        403
      );
    }

    const { email, role = "editor" } = await req.json();
    if (!email) {
      return jsonResponse({ error: "Email is required." }, 400);
    }
    const normalizedRole = role === "viewer" ? "viewer" : "editor";

    const targetUser = await findUserByEmail(email.trim());
    if (!targetUser) {
      return jsonResponse(
        { error: "No user found with that email. Ask them to sign up first." },
        404
      );
    }

    if (targetUser.id === caseRow.user_id) {
      return jsonResponse({ error: "Owner already has access." }, 400);
    }

    const { data: existingMember } = await supabaseAdmin
      .from("case_members")
      .select("id")
      .eq("case_id", caseRow.id)
      .eq("member_id", targetUser.id)
      .maybeSingle();

    if (existingMember) {
      return jsonResponse({ error: "That user is already a member." }, 400);
    }

    const { error: insertError } = await supabaseAdmin
      .from("case_members")
      .insert({
        case_id: caseRow.id,
        member_id: targetUser.id,
        role: normalizedRole,
      });

    if (insertError) throw insertError;

    const payload = await buildMembersPayload(caseRow, user.id);
    return jsonResponse({ data: payload }, 201);
  } catch (err) {
    console.error(`POST /api/cases/${params.id}/members error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to invite member" }, status);
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const caseRow = await ensureCaseAccess(params.id, user.id);
    if (caseRow.user_id !== user.id) {
      return jsonResponse({ error: "Only case owners can remove members." }, 403);
    }

    const { memberId } = await req.json();
    if (!memberId) {
      return jsonResponse({ error: "memberId is required" }, 400);
    }

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("case_members")
      .select("id")
      .eq("id", memberId)
      .eq("case_id", caseRow.id)
      .single();

    if (membershipError) {
      return jsonResponse({ error: "Member not found in this case." }, 404);
    }

    const { error: deleteError } = await supabaseAdmin
      .from("case_members")
      .delete()
      .eq("id", membership.id);

    if (deleteError) throw deleteError;

    const payload = await buildMembersPayload(caseRow, user.id);
    return jsonResponse({ data: payload });
  } catch (err) {
    console.error(`DELETE /api/cases/${params.id}/members error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to remove member" }, status);
  }
}
