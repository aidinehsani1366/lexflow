import { supabaseAdmin, getUserFromRequest } from "../../../lib/serverSupabase";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const STATUS_ORDER = ["new", "contacted", "assigned", "retained", "closed"];
const DEFAULT_RANGE_DAYS = 90;

function parseRangeParam(value) {
  if (!value || value === "auto") return DEFAULT_RANGE_DAYS;
  if (value === "all") return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  return DEFAULT_RANGE_DAYS;
}

async function getProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, role, firm_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    const err = new Error("Profile not found");
    err.status = 403;
    throw err;
  }

  return data;
}

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const profile = await getProfile(user.id);
    const isAdmin = profile.role === "admin";

    const { searchParams } = new URL(req.url);
    const rangeParam = searchParams.get("range");
    const scopeParam = (searchParams.get("scope") || "").toLowerCase();
    const firmIdParam = searchParams.get("firmId");

    const rangeDays = parseRangeParam(rangeParam);
    const filterSince =
      rangeDays != null ? new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString() : null;

    let scope = scopeParam || (isAdmin ? "all" : profile.firm_id ? "firm" : "mine");
    if (!isAdmin) {
      if (!profile.firm_id) {
        scope = "mine";
      } else if (!["firm", "mine"].includes(scope)) {
        scope = "firm";
      }
    } else if (!["all", "firm", "mine"].includes(scope)) {
      scope = "all";
    }

    let firmFilterId = null;
    if (scope === "firm") {
      if (isAdmin) {
        firmFilterId = firmIdParam || null;
      } else {
        firmFilterId = profile.firm_id || null;
      }
      if (!firmFilterId) {
        return jsonResponse({ error: "firmId is required for firm scope" }, 400);
      }
    }

    let leadsQuery = supabaseAdmin
      .from("leads")
      .select("id, source, status, firm_id, created_at");

    if (filterSince) {
      leadsQuery = leadsQuery.gte("created_at", filterSince);
    }

    if (!isAdmin) {
      if (scope === "mine") {
        leadsQuery = leadsQuery.eq("assigned_to", user.id);
      } else {
        leadsQuery = leadsQuery.eq("firm_id", profile.firm_id);
      }
    } else if (scope === "firm") {
      leadsQuery = leadsQuery.eq("firm_id", firmFilterId);
    } else if (scope === "mine") {
      leadsQuery = leadsQuery.eq("assigned_to", user.id);
    }

    const { data: leads, error: leadsError } = await leadsQuery;
    if (leadsError) throw leadsError;

    const totalLeads = leads?.length || 0;
    const sourceCounts = new Map();
    const statusCounts = new Map();
    let recentCount = 0;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    (leads || []).forEach((lead) => {
      const sourceKey = lead.source || "unknown";
      sourceCounts.set(sourceKey, (sourceCounts.get(sourceKey) || 0) + 1);
      const statusKey = lead.status || "new";
      statusCounts.set(statusKey, (statusCounts.get(statusKey) || 0) + 1);
      if (lead.created_at && new Date(lead.created_at).getTime() >= weekAgo) {
        recentCount += 1;
      }
    });

    const retainedCount = statusCounts.get("retained") || 0;
    const retentionRate = totalLeads ? Math.round((retainedCount / totalLeads) * 100) : 0;

    const leadsBySource = Array.from(sourceCounts.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    const statusBreakdown = STATUS_ORDER.map((status) => ({
      status,
      count: statusCounts.get(status) || 0,
    }));

    let revenueByFirm = [];
    if (isAdmin || profile.firm_id) {
      let feeQuery = supabaseAdmin.from("referral_fees").select("firm_id, amount, status");
      if (filterSince) {
        feeQuery = feeQuery.gte("created_at", filterSince);
      }
      if (!isAdmin) {
        feeQuery = feeQuery.eq("firm_id", profile.firm_id);
      } else if (scope === "firm" && firmFilterId) {
        feeQuery = feeQuery.eq("firm_id", firmFilterId);
      }
      const { data: fees, error: feesError } = await feeQuery;
      if (feesError) throw feesError;
      const firmTotals = new Map();
      (fees || []).forEach((fee) => {
        const key = fee.firm_id || "unassigned";
        if (!firmTotals.has(key)) {
          firmTotals.set(key, { total: 0, paid: 0 });
        }
        const entry = firmTotals.get(key);
        const amount = Number(fee.amount) || 0;
        entry.total += amount;
        if (fee.status === "paid") entry.paid += amount;
      });

      const firmIds = Array.from(firmTotals.keys()).filter((id) => id !== "unassigned");
      let firmNames = {};
      if (firmIds.length > 0) {
        const { data: firmRows, error: firmError } = await supabaseAdmin
          .from("firms")
          .select("id, name")
          .in("id", firmIds);
        if (firmError && firmError.code !== "PGRST201") throw firmError;
        (firmRows || []).forEach((firm) => {
          firmNames[firm.id] = firm.name;
        });
      }

      revenueByFirm = Array.from(firmTotals.entries())
        .map(([firmId, amounts]) => {
          const total = Number(amounts.total.toFixed(2));
          const paid = Number(amounts.paid.toFixed(2));
          return {
            firm_id: firmId,
          firm_name:
            firmId === "unassigned"
              ? "Unassigned"
              : firmNames[firmId] ||
                (firmId === profile.firm_id ? "Your firm" : "Partner firm"),
            total,
            paid,
            pending: Number((total - paid).toFixed(2)),
          };
        })
        .sort((a, b) => b.total - a.total);
    }

    return jsonResponse({
      totals: {
        leads: totalLeads,
        retained: retainedCount,
        recent: recentCount,
        retentionRate,
      },
      leadsBySource,
      statusBreakdown,
      revenueByFirm,
    });
  } catch (err) {
    console.error("GET /api/insights error:", err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to load insights" }, status);
  }
}
