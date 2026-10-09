import { registerAccount } from "@/app/admin/actions";
import { requireAdmin } from "@/backend/auth";
import { listAccounts } from "@/backend/stats";
import { money, when } from "@/frontend/lib/format";
import { ActionForm, inputClass } from "@/frontend/components/admin/ui";
import Popup from "@/frontend/components/admin/Popup";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  await requireAdmin();
  const accounts = listAccounts(200);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">Accounts</h1>
        <Popup title="Register a customer" trigger="Register a customer" className="rounded-full bg-ink px-4 py-1.5 text-sm text-paper transition-colors hover:text-accent">
          <ActionForm
            action={registerAccount}
            submit="Register"
            className="space-y-3"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="full_name" placeholder="Full name" className={inputClass} />
              <input name="username" placeholder="Telegram @username" className={inputClass} />
              <input name="telegram_id" placeholder="Telegram ID (optional)" className={inputClass} />
              <input name="phone" placeholder="Phone (optional)" className={inputClass} />
              <input name="country" placeholder="Country (optional)" className={inputClass} />
            </div>
          </ActionForm>
        </Popup>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-graphite">
            <tr>
              {["Customer", "Telegram", "Country", "Source", "Trades", "Volume", "Joined"].map(
                (h) => (
                  <th key={h} className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-t border-line">
                <td className="px-4 py-3 text-ink">{a.full_name ?? "—"}</td>
                <td className="px-4 py-3 text-graphite">
                  {a.username ? (
                    <>
                      <span className="block text-ink">@{a.username}</span>
                      {a.telegram_id && <span className="block text-xs">{a.telegram_id}</span>}
                    </>
                  ) : (
                    (a.telegram_id ?? "—")
                  )}
                </td>
                <td className="px-4 py-3 text-graphite">{a.country ?? "—"}</td>
                <td className="px-4 py-3 capitalize text-graphite">{a.source}</td>
                <td className="px-4 py-3 text-graphite">{a.trade_count}</td>
                <td className="px-4 py-3 text-graphite">{money(a.volume)}</td>
                <td className="px-4 py-3 text-graphite">{when(a.created_at)}</td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-graphite">
                  No accounts yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
