import {
  addAsset,
  addAssetAddress,
  deleteAssetAddress,
  saveMarginSettings,
  savePaymentAccount,
  saveRate,
  saveTradeDuration,
  setAssetRateMode,
  toggleAsset,
} from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { ago, naira } from "@/lib/format";
import { bybitConfigured } from "@/lib/bybit";
import {
  getMarginSettings,
  getPaymentAccount,
  getRateHistory,
  getTradeDurationMinutes,
  listAssetAddresses,
  listRates,
  type RateRow,
} from "@/lib/repo";
import { getRateStatus } from "@/lib/rateEngine";
import { ActionForm, inputClass } from "@/components/admin/ui";

const STATUS_DOT: Record<string, { color: string; label: string }> = {
  active: { color: "#0ca30c", label: "Rate active" },
  refreshing: { color: "#fab219", label: "Rate refreshing" },
  stale: { color: "#d03b3b", label: "Rate stale" },
  unavailable: { color: "#d03b3b", label: "Rate provider unavailable" },
};

export const dynamic = "force-dynamic";
const MAX_ADDRESSES_PER_ASSET = 5;

function AssetAddresses({ symbol }: { symbol: string }) {
  const addresses = listAssetAddresses(symbol);
  const atLimit = addresses.length >= MAX_ADDRESSES_PER_ASSET;
  return (
    <div className="mt-3 space-y-3 border-t border-line pt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-graphite">
        Deposit addresses
      </p>
      {addresses.length === 0 ? (
        <p className="text-xs text-graphite">
          None set up yet — the bot can&apos;t take a sell order for {symbol} until one exists.
        </p>
      ) : (
        <ul className="space-y-2">
          {addresses.map((addr) => (
            <li
              key={addr.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 text-sm"
            >
              <span className="min-w-0">
                <span className="text-ink">{addr.network ?? "Single network"}</span>
                <span className="block truncate text-xs text-graphite">{addr.address}</span>
              </span>
              <form action={deleteAssetAddress}>
                <input type="hidden" name="id" value={addr.id} />
                <button className="shrink-0 text-xs text-graphite hover:text-ink">Remove</button>
              </form>
            </li>
          ))}
        </ul>
      )}
      {atLimit ? (
        <p className="text-xs text-graphite">
          {symbol} has the maximum of {MAX_ADDRESSES_PER_ASSET} addresses — remove one to add another.
        </p>
      ) : (
        <ActionForm action={addAssetAddress} submit="Add address" className="space-y-2">
          <input type="hidden" name="symbol" value={symbol} />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              name="network"
              placeholder={addresses.length === 0 ? "Network (optional)" : "Network (required)"}
              required={addresses.length > 0}
              maxLength={40}
              className={inputClass}
            />
            <input name="address" placeholder="Address" required maxLength={200} className={inputClass} />
          </div>
        </ActionForm>
      )}
    </div>
  );
}

export default async function RatesPage() {
  await requireAdmin();
  const paymentAccount = getPaymentAccount();
  const tradeDuration = getTradeDurationMinutes();
  const marginSettings = getMarginSettings();
  // The raw rate row (including a stale/unavailable one, with its mode
  // intact) — this page needs to show true state, unlike the
  // customer-facing lib/rates.ts's getEffectiveRates, which filters those
  // out so a customer never gets quoted a stale number.
  const rates = listRates();

  const history = rates.flatMap((a) =>
    getRateHistory(a.symbol, 5).map((h) => ({ ...(h as Record<string, unknown>), symbol: a.symbol })),
  ) as {
    id: number;
    symbol: string;
    old_buy_rate: number | null;
    old_sell_rate: number | null;
    new_buy_rate: number;
    new_sell_rate: number;
    changed_by: string | null;
    created_at: string;
  }[];
  history.sort((a, b) => b.id - a.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Assets &amp; Rates
        </h1>
        <p className="text-sm text-graphite">
          What ORBITAL trades, and the buy/sell rate customers see in the Telegram bot.
        </p>
        {!bybitConfigured() && (
          <p className="mt-2 text-xs text-graphite">
            Bybit isn&apos;t connected, so &quot;Follow Bybit&quot; isn&apos;t available yet — every
            asset can still be priced manually.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="font-display text-sm font-semibold text-ink">ORBITAL payment account</p>
        <p className="mt-1 text-xs text-graphite">
          Shown to a customer when they buy — where they send payment to ORBITAL.
        </p>
        <ActionForm action={savePaymentAccount} submit={paymentAccount ? "Update" : "Save"} className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              name="account_name"
              placeholder="Account name"
              required
              defaultValue={paymentAccount?.account_name}
              className={inputClass}
            />
            <input
              name="account_number"
              placeholder="Account number"
              required
              defaultValue={paymentAccount?.account_number}
              className={inputClass}
            />
            <input
              name="bank_name"
              placeholder="Bank"
              required
              defaultValue={paymentAccount?.bank_name}
              className={inputClass}
            />
          </div>
        </ActionForm>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="font-display text-sm font-semibold text-ink">Trade duration</p>
        <p className="mt-1 text-xs text-graphite">
          How long a customer has to complete a trade — shown in the bot&apos;s buy preview.
        </p>
        <ActionForm action={saveTradeDuration} submit={tradeDuration ? "Update" : "Save"} className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              name="minutes"
              type="number"
              min="1"
              step="1"
              placeholder="Minutes (e.g. 30)"
              required
              defaultValue={tradeDuration ?? undefined}
              className={inputClass}
            />
          </div>
        </ActionForm>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="font-display text-sm font-semibold text-ink">Margin engine</p>
        <p className="mt-1 text-xs text-graphite">
          Applied uniformly to every auto-priced asset by the rate-refresh worker — a
          percentage of the asset&apos;s own reference rate, or a fixed ₦ amount per $1 of
          value. The bulk tier (and its own live re-check) kicks in at or above the threshold.
        </p>
        <ActionForm action={saveMarginSettings} submit="Save" className="mt-3 space-y-4">
          <label className="block text-sm">
            <span className="text-ink">Margin mode</span>
            <select name="mode" defaultValue={marginSettings.mode} className={`mt-1 ${inputClass}`}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed ₦ per $1-equivalent</option>
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-ink">Regular buy margin</span>
              <input
                name="buyMargin"
                type="number"
                step="any"
                min="0"
                required
                defaultValue={marginSettings.buyMargin}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="block text-sm">
              <span className="text-ink">Regular sell margin</span>
              <input
                name="sellMargin"
                type="number"
                step="any"
                min="0"
                required
                defaultValue={marginSettings.sellMargin}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="block text-sm">
              <span className="text-ink">Bulk buy margin</span>
              <input
                name="bulkBuyMargin"
                type="number"
                step="any"
                min="0"
                required
                defaultValue={marginSettings.bulkBuyMargin}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="block text-sm">
              <span className="text-ink">Bulk sell margin</span>
              <input
                name="bulkSellMargin"
                type="number"
                step="any"
                min="0"
                required
                defaultValue={marginSettings.bulkSellMargin}
                className={`mt-1 ${inputClass}`}
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-ink">Bulk threshold (₦)</span>
            <input
              name="bulkThresholdNgn"
              type="number"
              step="any"
              min="0"
              required
              defaultValue={marginSettings.bulkThresholdNgn}
              className={`mt-1 ${inputClass}`}
            />
          </label>
        </ActionForm>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="mb-3 font-display text-sm font-semibold text-ink">Add an asset</p>
        <ActionForm action={addAsset} submit="Add asset" className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <input name="symbol" placeholder="Symbol (e.g. ETH)" required maxLength={12} className={inputClass} />
            <input name="name" placeholder="Name (e.g. Ethereum)" required maxLength={60} className={inputClass} />
          </div>
        </ActionForm>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {rates.map((a) => {
          const rate: RateRow | null = a.rate;
          const isAuto = rate?.mode === "auto";
          // An auto asset with no successful refresh yet is cached at the
          // 0 placeholder from setRateMode — never shown as a real ₦0.
          const hasLiveRate = !!rate && rate.buy_rate > 0 && rate.sell_rate > 0;
          const status = isAuto ? getRateStatus(a.symbol) : null;
          const dot = status ? STATUS_DOT[status] : null;
          return (
            <div key={a.symbol} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-display text-sm font-semibold text-ink">
                    {a.symbol} — {a.name}
                    {dot && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-normal"
                        style={{ color: dot.color, background: `${dot.color}1a` }}
                        title={dot.label}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot.color }} />
                        {dot.label}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-graphite">
                    {rate && hasLiveRate ? (
                      <>
                        {isAuto ? "Auto (worker-priced)" : "Set manually"} · updated {ago(rate.updated_at)}
                        {rate.updated_by ? ` by ${rate.updated_by}` : ""}
                      </>
                    ) : isAuto ? (
                      "Waiting for the rate-refresh worker's first pass — not shown to customers yet"
                    ) : (
                      "No rate set yet"
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {hasLiveRate && (
                    <span className="text-right text-sm">
                      <span className="block text-ink">{naira(rate!.buy_rate)}</span>
                      <span className="block text-graphite">{naira(rate!.sell_rate)}</span>
                    </span>
                  )}
                  <form action={toggleAsset}>
                    <input type="hidden" name="symbol" value={a.symbol} />
                    <input type="hidden" name="active" value={a.active ? "0" : "1"} />
                    <button
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        a.active
                          ? "bg-accent text-accent-ink hover:bg-white hover:ring-1 hover:ring-ink"
                          : "bg-ink/10 text-graphite hover:bg-ink hover:text-paper"
                      }`}
                    >
                      {a.active ? "Active" : "Disabled"}
                    </button>
                  </form>
                </div>
              </div>

              {!isAuto && (
                <ActionForm
                  action={saveRate}
                  submit={rate ? "Update rate" : "Set manual rate"}
                  className="mt-4 space-y-3"
                >
                  <input type="hidden" name="symbol" value={a.symbol} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm">
                      <span className="text-ink">Buy rate (₦)</span>
                      <div className="mt-1">
                        <input
                          name="buy"
                          type="number"
                          step="any"
                          min="0"
                          required
                          defaultValue={rate?.buy_rate}
                          placeholder="What a customer pays"
                          className={inputClass}
                        />
                      </div>
                    </label>
                    <label className="block text-sm">
                      <span className="text-ink">Sell rate (₦)</span>
                      <div className="mt-1">
                        <input
                          name="sell"
                          type="number"
                          step="any"
                          min="0"
                          required
                          defaultValue={rate?.sell_rate}
                          placeholder="What a customer receives"
                          className={inputClass}
                        />
                      </div>
                    </label>
                  </div>
                </ActionForm>
              )}

              {bybitConfigured() && (
                <form action={setAssetRateMode} className="mt-3 border-t border-line pt-3">
                  <input type="hidden" name="symbol" value={a.symbol} />
                  <input type="hidden" name="mode" value={isAuto ? "manual" : "auto"} />
                  <p className="mb-2 text-xs text-graphite">
                    Auto = priced by the rate-refresh worker from USDT/NGN (± the margin
                    engine above), every {process.env.RATE_REFRESH_INTERVAL ?? "600"}s.
                  </p>
                  <button
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      isAuto
                        ? "bg-ink/10 text-graphite hover:bg-ink hover:text-paper"
                        : "bg-accent text-accent-ink hover:bg-white hover:ring-1 hover:ring-ink"
                    }`}
                  >
                    {isAuto ? "Switch to manual" : "Switch to auto"}
                  </button>
                </form>
              )}

              <AssetAddresses symbol={a.symbol} />
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="mb-3 font-display text-sm font-semibold text-ink">
          Rate change history
        </p>
        <p className="mb-3 text-xs text-graphite">
          Manual rate changes and switches to/from auto-pricing. Doesn&apos;t log every automatic
          Bybit refresh — that would be every few minutes.
        </p>
        {history.length === 0 ? (
          <p className="text-sm text-graphite">No rate changes yet</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {history.slice(0, 20).map((h) => (
              <li key={h.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span className="text-ink">
                  {h.symbol}:{" "}
                  {h.old_buy_rate ? `${naira(h.old_buy_rate)}/${naira(h.old_sell_rate!)} → ` : ""}
                  {naira(h.new_buy_rate)}/{naira(h.new_sell_rate)}
                </span>
                <span className="text-graphite">
                  {h.changed_by ?? "unknown"} · {ago(h.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
