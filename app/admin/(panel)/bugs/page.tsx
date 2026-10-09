import { markBugReport, removeBugReport } from "@/app/admin/actions";
import { requireAdmin } from "@/backend/auth";
import { listBugReports } from "@/backend/repo";
import { when } from "@/frontend/lib/format";
import Popup from "@/frontend/components/admin/Popup";

export const dynamic = "force-dynamic";

// Every report sent from the website's /report-bug page
// (frontend/components/BugReportForm.tsx), open ones first, newest first.
export default async function BugReportsPage() {
  await requireAdmin();
  const reports = listBugReports();
  const open = reports.filter((r) => r.status === "open").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Bug reports</h1>
        <p className="mt-1 text-sm text-graphite">
          Reports sent from the website&apos;s &ldquo;Report a Bug&rdquo; page.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-graphite">Open</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">
            {open.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-graphite">Total reported</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">
            {reports.length.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-graphite">
            <tr>
              {["Bug", "Email", "Page", "Date", "Status", ""].map((h, i) => (
                <th key={i} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="max-w-xs px-4 py-3">
                  <Popup
                    title="Bug report"
                    label={`Read bug report from ${r.email}`}
                    trigger={r.message}
                    className="block w-full truncate text-left text-ink underline decoration-line underline-offset-2 hover:decoration-ink"
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{r.message}</p>
                    <dl className="mt-5 grid grid-cols-[6rem_1fr] gap-x-4 gap-y-2 border-t border-line pt-4 text-sm">
                      <dt className="text-graphite">From</dt>
                      <dd>
                        <a href={`mailto:${r.email}`} className="text-ink hover:underline">
                          {r.email}
                        </a>
                      </dd>
                      <dt className="text-graphite">Page</dt>
                      <dd className="text-ink">{r.page ?? "—"}</dd>
                      <dt className="text-graphite">Sent</dt>
                      <dd className="text-ink">{when(r.created_at)}</dd>
                      <dt className="text-graphite">Status</dt>
                      <dd className="text-ink">{r.status === "open" ? "Open" : "Resolved"}</dd>
                    </dl>
                  </Popup>
                </td>
                <td className="px-4 py-3">
                  <a href={`mailto:${r.email}`} className="text-ink hover:underline">
                    {r.email}
                  </a>
                </td>
                <td className="px-4 py-3 text-graphite">{r.page ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-graphite">{when(r.created_at)}</td>
                <td className="px-4 py-3">
                  <form action={markBugReport}>
                    <input type="hidden" name="id" value={r.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={r.status === "open" ? "resolved" : "open"}
                    />
                    <button
                      title={r.status === "open" ? "Mark resolved" : "Reopen"}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        r.status === "open"
                          ? "bg-[#fab219]/15 text-[#a06b00] hover:bg-ink hover:text-paper"
                          : "bg-[#0ca30c]/10 text-[#0ca30c] hover:bg-ink hover:text-paper"
                      }`}
                    >
                      {r.status === "open" ? "Open" : "Resolved"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={removeBugReport}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="text-xs text-red-700 hover:underline">Remove</button>
                  </form>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-graphite">
                  No bugs reported yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
