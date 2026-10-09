import { recordTrade } from "@/app/admin/actions";
import TradeStatusSelect from "@/frontend/components/admin/TradeStatusSelect";
import { requireAdmin } from "@/backend/auth";
import { accountOptions, listTrades } from "@/backend/stats";
import { TRADE_STATUSES } from "@/backend/repo";
import { money, when } from "@/frontend/lib/format";
import { ActionForm, inputClass } from "@/frontend/components/admin/ui";
import Popup from "@/frontend/components/admin/Popup";

export const dynamic = "force-dynamic";

export default async function TradesPage() {
  await requireAdmin();
  const trades = listTrades(200);
  const accounts = accountOptions();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">Trades</h1>
        <Popup title="Record a trade manually" trigger="Record a trade" className="rounded-full bg-ink px-4 py-1.5 text-sm text-paper transition-colors hover:text-accent">
          <ActionForm action={recordTrade} submit="Record trade" className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <select name="account_id" required className={inputClass} defaultValue="">
                <option value="" disabled>
                  Customer…
                </option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <input name="asset" placeholder="Asset (BTC)" required className={inputClass} />
              <select name="side" className={inputClass} defaultValue="buy">
                <option value="buy">Customer buys</option>
                <option value="sell">Customer sells</option>
              </select>
              <select name="status" className={inputClass} defaultValue="processing">
                {TRADE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input name="amount" type="number" step="any" min="0" placeholder="Crypto amount (optional)" className={inputClass} />
              <input name="rate" type="number" step="any" min="0" placeholder="Rate (optional)" className={inputClass} />
              <input name="fiat_amount" type="number" step="any" min="0" placeholder="Total value" required className={inputClass} />
              <input name="fiat_currency" placeholder="Currency (USD)" className={inputClass} />
              <input name="account_number" placeholder="Account number (for a sell)" className={inputClass} />
              <input name="account_name" placeholder="Account name (for a sell)" className={inputClass} />
            </div>
          </ActionForm>
        </Popup>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-graphite">
            <tr>
              {["Transaction ID", "Customer", "Trade", "Value", "Details", "Status", "Date"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="border-t border-line">
                <td className="px-4 py-3 font-mono text-xs text-graphite">
                  {t.transaction_id ?? t.id}
                </td>
                <td className="px-4 py-3 text-ink">{t.customer ?? "—"}</td>
                <td className="px-4 py-3 text-graphite">
                  {t.side} {t.amount} {t.asset}
                </td>
                <td className="px-4 py-3 text-graphite">
                  {money(t.fiat_amount, t.fiat_currency)}
                </td>
                <td className="px-4 py-3">
                  <Popup
                    title={`Trade ${t.transaction_id ?? t.id}`}
                    label={`View trade ${t.transaction_id ?? t.id}`}
                    trigger="View"
                    className="text-sm text-ink underline decoration-line underline-offset-2 hover:decoration-ink"
                  >
                    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
                      <dt className="text-graphite">Customer</dt>
                      <dd className="text-ink">{t.customer ?? "—"}</dd>
                      <dt className="text-graphite">Trade</dt>
                      <dd className="text-ink">
                        {t.side} {t.amount} {t.asset}
                      </dd>
                      <dt className="text-graphite">Value</dt>
                      <dd className="text-ink">{money(t.fiat_amount, t.fiat_currency)}</dd>
                      <dt className="text-graphite">Payout account</dt>
                      <dd className="text-ink">{t.account_number ?? "—"}</dd>
                      <dt className="text-graphite">Account name</dt>
                      <dd className="text-ink">{t.account_name ?? "—"}</dd>
                      <dt className="text-graphite">Bank</dt>
                      <dd className="text-ink">{t.bank_name ?? "—"}</dd>
                      <dt className="text-graphite">Status</dt>
                      <dd className="text-ink">{t.status}</dd>
                      <dt className="text-graphite">Date</dt>
                      <dd className="text-ink">{when(t.created_at)}</dd>
                    </dl>
                  </Popup>
                </td>
                <td className="px-4 py-3">
                  <TradeStatusSelect id={t.id} status={t.status} statuses={TRADE_STATUSES} />
                </td>
                <td className="px-4 py-3 text-graphite">{when(t.created_at)}</td>
              </tr>
            ))}
            {trades.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-graphite">
                  No trades yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
