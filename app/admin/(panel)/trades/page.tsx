import { recordTrade } from "@/app/admin/actions";
import TradeStatusSelect from "@/components/admin/TradeStatusSelect";
import { requireAdmin } from "@/lib/auth";
import { accountOptions, listTrades } from "@/lib/stats";
import { TRADE_STATUSES } from "@/lib/repo";
import { money, when } from "@/lib/format";
import { ActionForm, inputClass } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function TradesPage() {
  await requireAdmin();
  const trades = listTrades(200);
  const accounts = accountOptions();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Trades</h1>

      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="mb-3 font-display text-sm font-semibold text-ink">
          Record a trade manually
        </p>
        <ActionForm action={recordTrade} submit="Record trade" className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-4">
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
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-graphite">
            <tr>
              {["Transaction ID", "Customer", "Trade", "Value", "Payout to", "Status", "Date"].map((h) => (
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
                <td className="px-4 py-3 text-graphite">
                  {t.account_number ? (
                    <>
                      {t.account_number}
                      <br />
                      <span className="text-xs">
                        {t.account_name}
                        {t.bank_name ? ` · ${t.bank_name}` : ""}
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
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
