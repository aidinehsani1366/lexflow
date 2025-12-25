import { supabaseAdmin, getUserFromRequest } from "../../../../../lib/serverSupabase";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function ensureCaseAccess(caseId, userId) {
  const { data: caseRow, error } = await supabaseAdmin
    .from("cases")
    .select("id, user_id, title, status, created_at")
    .eq("id", caseId)
    .maybeSingle();

  if (error || !caseRow) {
    const err = new Error(error?.code === "PGRST116" ? "Case not found" : error?.message);
    err.status = error?.code === "PGRST116" ? 404 : 500;
    throw err;
  }

  if (caseRow.user_id === userId) return caseRow;

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from("case_members")
    .select("member_id")
    .eq("case_id", caseId)
    .eq("member_id", userId)
    .maybeSingle();

  if (membershipError) {
    const err = new Error(membershipError.message);
    err.status = 500;
    throw err;
  }

  if (!membership) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  return caseRow;
}

export async function GET(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const caseRow = await ensureCaseAccess(params.id, user.id);

    const [documentsResult, eventsResult, aiMessagesResult] = await Promise.all([
      supabaseAdmin
        .from("case_documents")
        .select("id, file_name, document_type, created_at, notes")
        .eq("case_id", params.id)
        .order("created_at", { ascending: false })
        .limit(25),
      supabaseAdmin
        .from("case_events")
        .select("id, title, description, event_date, reminder_minutes, suggested, source")
        .eq("case_id", params.id)
        .order("event_date", { ascending: true })
        .limit(25),
      supabaseAdmin
        .from("case_messages")
        .select("id, created_at, sender, content")
        .eq("case_id", params.id)
        .eq("sender", "ai")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const timeline = [];

    timeline.push({
      type: "case_created",
      title: "Case workspace created",
      timestamp: caseRow.created_at,
      details: {
        status: caseRow.status,
      },
    });

    (documentsResult.data || []).forEach((doc) => {
      timeline.push({
        type: "document",
        title: doc.file_name,
        timestamp: doc.created_at,
        details: {
          document_type: doc.document_type,
          notes: doc.notes,
        },
      });
    });

    (eventsResult.data || []).forEach((event) => {
      timeline.push({
        type: "event",
        title: event.title,
        timestamp: event.event_date,
        details: {
          description: event.description,
          reminder_minutes: event.reminder_minutes,
          suggested: event.suggested,
          source: event.source,
        },
      });
    });

    timeline.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const upcomingEvents = (eventsResult.data || []).filter(
      (event) => new Date(event.event_date) > new Date()
    );

    const stats = {
      totalDocuments: documentsResult.data?.length || 0,
      upcomingEvents: upcomingEvents.length,
      lastUpdated:
        timeline.length ? timeline[timeline.length - 1].timestamp : caseRow.created_at,
    };

    return jsonResponse({
      data: {
        case: caseRow,
        stats,
        timeline,
        aiHighlights: aiMessagesResult.data || [],
        upcomingEvents,
      },
    });
  } catch (err) {
    console.error(`GET /api/cases/${params.id}/recap error:`, err);
    const status = err.status || (err.message === "Unauthorized" ? 401 : 500);
    return jsonResponse({ error: err.message || "Failed to generate recap" }, status);
  }
}
