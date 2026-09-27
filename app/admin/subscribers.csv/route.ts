import { isAdmin } from "@/backend/auth";
import { listSubscribers } from "@/backend/repo";

// GET /admin/subscribers.csv — the footer sign-up list as a spreadsheet,
// for the "Download CSV" link on /admin/subscribers. Admin session required.
export async function GET() {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const cell = (v: string | null) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const rows = listSubscribers().map((s) =>
    [cell(s.email), cell(s.source), cell(s.created_at)].join(","),
  );
  return new Response(["email,signed_up_on_page,signed_up_at_utc", ...rows].join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="orbital-subscribers.csv"',
    },
  });
}
