import { removeSubscriber } from "@/app/admin/actions";
import { requireAdmin } from "@/backend/auth";
import { listSubscribers } from "@/backend/repo";
import { listAccounts } from "@/backend/stats";
import { ago, money, when } from "@/frontend/lib/format";
import Popup from "@/frontend/components/admin/Popup";

export const dynamic = "force-dynamic";

// Every email left in the website footer's "Get ORBITAL updates" box
// (frontend/components/NewsletterSignup.tsx), newest first.
export default async function SubscribersPage() {
  await requireAdmin();
  const subscribers = listSubscribers();
  const telegramCustomers = listAccounts(200).filter((account) => account.telegram_id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Subscribers</h1>
          <p className="mt-1 text-sm text-graphite">
            Website email sign-ups and customer profiles created through the Telegram bot.
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

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Telegram Customers</h2>
            <p className="text-sm text-graphite">Profiles and saved payment destinations collected by the trading bot.</p>
          </div>
          <p className="text-sm text-graphite">{telegramCustomers.length.toLocaleString()} profiles</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-graphite">
              <tr>
                {["Customer", "Telegram", "Trades", "Activity", "Details"].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-medium">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {telegramCustomers.map((account) => (
                <tr key={account.id} className="border-t border-line">
                  <td className="px-4 py-3 text-ink">
                    <span className="block font-medium">{account.preferred_name ?? account.full_name ?? "Name not provided"}</span>
                    {account.preferred_name && account.full_name && account.full_name !== account.preferred_name && (
                      <span className="block text-xs text-graphite">{account.full_name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-graphite">
                    {account.username ? <span className="block">@{account.username}</span> : null}
                    <span className="text-xs">ID: {account.telegram_id}</span>
                  </td>
                  <td className="px-4 py-3 text-graphite">{account.trade_count}</td>
                  <td className="px-4 py-3 text-graphite">
                    <span className="block">Joined {when(account.created_at)}</span>
                    {account.last_activity_at && <span className="block text-xs">Active {ago(account.last_activity_at)}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Popup
                      title={account.preferred_name ?? account.full_name ?? "Customer profile"}
                      label={`View profile of ${account.preferred_name ?? account.full_name ?? account.telegram_id}`}
                      trigger="View"
                      className="text-sm text-ink underline decoration-line underline-offset-2 hover:decoration-ink"
                    >
                      <dl className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-2 text-sm">
                        {[
                          ["Preferred name", account.preferred_name],
                          ["Full name", account.full_name],
                          ["Username", account.username ? `@${account.username}` : null],
                          ["Telegram ID", account.telegram_id],
                          ["Phone", account.phone],
                          ["Country", account.country],
                          ["Source", account.source],
                          ["Trades", String(account.trade_count)],
                          ["Volume", money(account.volume)],
                          ["Saved bank accounts", String(account.saved_bank_count)],
                          ["Saved wallet addresses", String(account.saved_wallet_count)],
                          ["Joined", when(account.created_at)],
                          ["Last active", account.last_activity_at ? ago(account.last_activity_at) : null],
                        ].map(([label, value]) => (
                          <div key={label} className="contents">
                            <dt className="text-graphite">{label}</dt>
                            <dd className="text-ink">{value ?? "Not provided"}</dd>
                          </div>
                        ))}
                      </dl>
                    </Popup>
                  </td>
                </tr>
              ))}
              {telegramCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-graphite">No Telegram customer profiles yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Email Subscribers</h2>
            <p className="text-sm text-graphite">People who signed up for website updates.</p>
          </div>
          <p className="text-sm text-graphite">{subscribers.length.toLocaleString()} subscribers</p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-graphite">
              <tr>
                {["Email", "Signed up on page", "Date", ""].map((h, i) => (
                  <th key={i} className="px-4 py-3 font-medium">{h}</th>
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
                  <td colSpan={4} className="px-4 py-6 text-center text-graphite">No sign-ups yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
