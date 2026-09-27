import { removeSubscriber } from "@/app/admin/actions";
import { requireAdmin } from "@/backend/auth";
import { listSubscribers } from "@/backend/repo";
import { when } from "@/frontend/lib/format";

export const dynamic = "force-dynamic";

// Every email left in the website footer's "Get ORBITAL updates" box
// (frontend/components/NewsletterSignup.tsx), newest first.
export default async function SubscribersPage() {
  await requireAdmin();
  const subscribers = listSubscribers();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Subscribers</h1>
          <p className="mt-1 text-sm text-graphite">
            Emails from the website footer&apos;s &ldquo;Get ORBITAL updates&rdquo; box.
          </p>
        </div>
        {subscribers.length > 0 && (
          <a
            href="/admin/subscribers.csv"
            className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition hover:bg-accent hover:text-accent-ink"
          >
            Download CSV
          </a>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="text-xs uppercase tracking-wide text-graphite">Total subscribers</p>
        <p className="mt-2 font-display text-3xl font-semibold text-ink">
          {subscribers.length.toLocaleString()}
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-graphite">
            <tr>
              {["Email", "Signed up on page", "Date", ""].map((h, i) => (
                <th key={i} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="px-4 py-3 text-ink">{s.email}</td>
                <td className="px-4 py-3 text-graphite">{s.source ?? "—"}</td>
                <td className="px-4 py-3 text-graphite">{when(s.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <form action={removeSubscriber}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="text-xs text-red-700 hover:underline">Remove</button>
                  </form>
                </td>
              </tr>
            ))}
            {subscribers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-graphite">
                  No sign-ups yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
