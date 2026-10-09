import Link from "next/link";
import {
  addAssetAddress,
  deleteAssetAddress,
  savePaymentAccount,
  saveRate,
  refreshAutoRates,
  saveTradeDuration,
  setAssetRateMode,
  toggleAsset,
} from "@/app/admin/actions";
import { requireAdmin } from "@/backend/auth";
import { ago, naira } from "@/frontend/lib/format";
import { bybitConfigured } from "@/backend/bybit";
import {
  getPaymentAccount,
  getRateHistory,
  getTradeDurationMinutes,
  listAssetAddresses,
  listRates,
  getMarginSettings,
  type RateRow,
} from "@/backend/repo";
import { getRateStatus } from "@/backend/rateEngine";
import { nextPostTime } from "@/backend/rateChannel";
import { getBybitSystemStatus, getRateChannelStatus, getRateWorkerStatus, getRatesStatus } from "@/backend/systemStatus";
import { ActionForm, inputClass } from "@/frontend/components/admin/ui";
import Popup from "@/frontend/components/admin/Popup";

const STATUS_DOT: Record<string, { color: string; label: string }> = {
  active: { color: "#0ca30c", label: "Live" },
  refreshing: { color: "#fab219", label: "Delayed" },
  stale: { color: "#d03b3b", label: "Offline" },
  unavailable: { color: "#d03b3b", label: "Unavailable" },
};

export const dynamic = "force-dynamic";
const MAX_ADDRESSES_PER_ASSET = 5;
const editButton = "rounded-full border border-line px-4 py-1.5 text-sm text-ink transition-colors hover:border-ink";

function AssetAddresses({ symbol }: { symbol: string }) {
  const addresses = listAssetAddresses(symbol);
  const atLimit = addresses.length >= MAX_ADDRESSES_PER_ASSET;
  return (
    <div className="mt-5 space-y-3 border-t border-line pt-4">
      <p className="text-xs font-medium uppercase tracking-wide text-graphite">Deposit addresses</p>
      {addresses.length === 0 ? (
        <p className="text-xs text-graphite">None set up yet — the bot can&apos;t take a sell order for {symbol} until one exists.</p>
      ) : (
        <ul className="space-y-2">
          {addresses.map((addr) => (
            <li key={addr.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 text-sm">
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
        <p className="text-xs text-graphite">{symbol} has the maximum of {MAX_ADDRESSES_PER_ASSET} addresses — remove one to add another.</p>
      ) : (
        <ActionForm action={addAssetAddress} submit="Add address" className="space-y-2">
          <input type="hidden" name="symbol" value={symbol} />
          <div className="grid gap-2 sm:grid-cols-2">
            <input name="network" placeholder={addresses.length === 0 ? "Network (optional)" : "Network (required)"} required={addresses.length > 0} maxLength={40} className={inputClass} />
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
  const rates = listRates();
  const config = getMarginSettings();
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

  const workerStatus = await getRateWorkerStatus();
  const bybitStatus = await getBybitSystemStatus();
  const rateBotStatus = await getRateChannelStatus();
  const ratesStatus = getRatesStatus();
  const latestUpdate = rates
    .map((item) => item.rate?.updated_at ?? "")
    .filter(Boolean)
    .sort()
    .at(-1);
  const engineOnline = workerStatus.state === "online" || bybitStatus.state === "online";

  const statusTiles = [
    { label: "Last refresh", value: latestUpdate ? ago(latestUpdate) : "None yet" },
    { label: "Rates", value: ratesStatus.label },
    { label: "Worker", value: workerStatus.label },
    { label: "Bybit", value: bybitStatus.label },
    { label: "Rate channel", value: rateBotStatus.label },
    { label: "Next channel post", value: nextPostTime() ?? "Not scheduled" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Assets &amp; Rates</h1>
        <p className="mt-1 text-sm text-graphite">
          The coins ORBITAL trades and the rates customers see on the website and in the bot.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="flex items-center gap-2">
          <span className={`inline-flex h-3 w-3 rounded-full ${engineOnline ? "bg-green-500" : "bg-red-500"}`} />
          <span className="font-display text-sm font-semibold text-ink">
            {engineOnline ? "Rate engine online" : "Rate engine offline"}
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {statusTiles.map((tile) => (
            <div key={tile.label} className="rounded-xl bg-paper-dim p-3">
              <dt className="text-xs uppercase tracking-wide text-graphite">{tile.label}</dt>
              <dd className="mt-2 text-sm font-semibold text-ink">{tile.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-sm font-semibold text-ink">Coins</p>
            <p className="mt-1 text-xs text-graphite">Buy rate on top, sell rate below. Click a coin to manage its rate and deposit addresses.</p>
          </div>
          
        </div>

        {!bybitConfigured() && (
          <p className="mt-2 text-xs text-graphite">Bybit isn&apos;t connected, so &quot;Follow Bybit&quot; isn&apos;t available yet — every asset can still be priced manually.</p>
        )}

        {bybitConfigured() && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-paper-dim p-5">
            <div>
              <p className="font-display text-sm font-semibold text-ink">Rate engine</p>
              <p className="mt-1 text-xs text-graphite">Refreshes active auto-priced assets from Bybit. A scheduled refresh already in progress is never interrupted.</p>
            </div>
            <ActionForm action={refreshAutoRates} submit="Refresh rates now" className="shrink-0"><></></ActionForm>
          </div>
        )}

        {/* One line per coin; a line opens everything about that coin (rate,
            pricing mode, deposit addresses) in a pop-up. */}
        <ul className="mt-5 divide-y divide-line border-t border-line">
          {rates.map((a) => {
            const rate: RateRow | null = a.rate;
            const isAuto = rate?.mode === "auto";
            const hasLiveRate = !!rate && rate.buy_rate > 0 && rate.sell_rate > 0;
            const status = isAuto ? getRateStatus(a.symbol) : null;
            const dot = status ? STATUS_DOT[status] : null;
            const pricing =
              rate && hasLiveRate
                ? `${isAuto ? "Auto" : "Manual"} · updated ${ago(rate.updated_at)}`
                : isAuto
                  ? "Waiting for its first rate"
                  : "No rate set yet";
            return (
              <li key={a.symbol} className="flex items-center gap-3 py-3">
                <Popup
                  title={`${a.symbol} — ${a.name}`}
                  label={`Manage ${a.symbol}`}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left transition-colors hover:bg-ink/5"
                  trigger={
                    <>
                      <span className="w-14 shrink-0 font-display text-sm font-semibold text-ink">{a.symbol}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 truncate text-sm text-ink">
                          {a.name}
                          {dot && (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs" style={{ color: dot.color, background: `${dot.color}1a` }}>
                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot.color }} />
                              {dot.label}
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-graphite">{pricing}</span>
                      </span>
                      {hasLiveRate && (
                        <span className="shrink-0 text-right text-sm tabular-nums">
                          <span className="block text-ink">{naira(rate!.buy_rate)}</span>
                          <span className="block text-graphite">{naira(rate!.sell_rate)}</span>
                        </span>
                      )}
                    </>
                  }
                >
                  <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
                    <dt className="text-graphite">Pricing</dt>
                    <dd className="text-ink">
                      {pricing}
                      {rate?.updated_by ? ` by ${rate.updated_by}` : ""}
                    </dd>
                    <dt className="text-graphite">Buy rate</dt>
                    <dd className="text-ink">{hasLiveRate ? naira(rate!.buy_rate) : "—"}</dd>
                    <dt className="text-graphite">Sell rate</dt>
                    <dd className="text-ink">{hasLiveRate ? naira(rate!.sell_rate) : "—"}</dd>
                    {isAuto && rate?.reference_rate ? (
                      <>
                        <dt className="text-graphite">Market rate</dt>
                        <dd className="text-ink">{naira(rate.reference_rate)}</dd>
                      </>
                    ) : null}
                    {isAuto && rate?.last_refresh_failure_at && rate.last_refresh_error ? (
                      <>
                        <dt className="text-graphite">Last failure</dt>
                        <dd className="text-ink">
                          {ago(rate.last_refresh_failure_at)}: {rate.last_refresh_error}
                        </dd>
                      </>
                    ) : null}
                  </dl>

                  {!isAuto && (
                    <ActionForm action={saveRate} submit={rate ? "Update rate" : "Set manual rate"} className="mt-4 space-y-3">
                      <input type="hidden" name="symbol" value={a.symbol} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm">
                          <span className="text-ink">Buy rate (₦)</span>
                          <div className="mt-1">
                            <input name="buy" type="number" step="any" min="0" required defaultValue={rate?.buy_rate} placeholder="What a customer pays" className={inputClass} />
                          </div>
                        </label>
                        <label className="block text-sm">
                          <span className="text-ink">Sell rate (₦)</span>
                          <div className="mt-1">
                            <input name="sell" type="number" step="any" min="0" required defaultValue={rate?.sell_rate} placeholder="What a customer receives" className={inputClass} />
                          </div>
                        </label>
                      </div>
                    </ActionForm>
                  )}

                  {bybitConfigured() && (
                    <form action={setAssetRateMode} className="mt-3 border-t border-line pt-3">
                      <input type="hidden" name="symbol" value={a.symbol} />
                      <input type="hidden" name="mode" value={isAuto ? "manual" : "auto"} />
                      <p className="mb-2 text-xs text-graphite">Auto = priced by the rate-refresh worker from USDT/NGN (± the margin engine above), every {process.env.RATE_REFRESH_INTERVAL ?? "600"}s.</p>
                      <button className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${isAuto ? "bg-ink/10 text-graphite hover:bg-ink hover:text-paper" : "bg-accent text-accent-ink hover:bg-white hover:ring-1 hover:ring-ink"}`}>
                        {isAuto ? "Switch to manual" : "Switch to auto"}
                      </button>
                    </form>
                  )}

                  <AssetAddresses symbol={a.symbol} />
                </Popup>
                <form action={toggleAsset}>
                  <input type="hidden" name="symbol" value={a.symbol} />
                  <input type="hidden" name="active" value={a.active ? "0" : "1"} />
                  <button className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${a.active ? "bg-accent text-accent-ink hover:bg-white hover:ring-1 hover:ring-ink" : "bg-ink/10 text-graphite hover:bg-ink hover:text-paper"}`}>
                    {a.active ? "Active" : "Disabled"}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Settings shown as one line each, edited in a pop-up. */}
      <div className="rounded-2xl border border-line bg-white p-5">
        <ul className="divide-y divide-line">
          <li className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-ink">ORBITAL payment account</p>
              <p className="mt-1 truncate text-xs text-graphite">
                {paymentAccount
                  ? `${paymentAccount.account_name} · ${paymentAccount.account_number} · ${paymentAccount.bank_name}`
                  : "Not set yet — customers can't be shown where to pay."}
              </p>
            </div>
            <Popup title="ORBITAL payment account" trigger="Edit" className={editButton}>
              <p className="mb-4 text-xs text-graphite">Shown to a customer when they buy — where they send payment to ORBITAL.</p>
              <ActionForm action={savePaymentAccount} submit={paymentAccount ? "Update" : "Save"} className="space-y-3">
                <div className="grid gap-3">
                  <input name="account_name" placeholder="Account name" required defaultValue={paymentAccount?.account_name} className={inputClass} />
                  <input name="account_number" placeholder="Account number" required defaultValue={paymentAccount?.account_number} className={inputClass} />
                  <input name="bank_name" placeholder="Bank" required defaultValue={paymentAccount?.bank_name} className={inputClass} />
                </div>
              </ActionForm>
            </Popup>
          </li>
          <li className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="font-display text-sm font-semibold text-ink">Trade duration</p>
              <p className="mt-1 text-xs text-graphite">
                {tradeDuration ? `${tradeDuration} minutes to complete a trade` : "Not set yet"}
              </p>
            </div>
            <Popup title="Trade duration" trigger="Edit" className={editButton}>
              <p className="mb-4 text-xs text-graphite">How long a customer has to complete a trade — shown in the bot&apos;s buy preview.</p>
              <ActionForm action={saveTradeDuration} submit={tradeDuration ? "Update" : "Save"} className="space-y-3">
                <input name="minutes" type="number" min="1" step="1" placeholder="Minutes (e.g. 30)" required defaultValue={tradeDuration ?? undefined} className={inputClass} />
              </ActionForm>
            </Popup>
          </li>
          <li className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="font-display text-sm font-semibold text-ink">Margins</p>
              <p className="mt-1 text-xs text-graphite">
                {config.mode === "fixed"
                  ? `Buy ₦${config.buyMargin} · Sell ₦${config.sellMargin} per $1`
                  : `Buy ${config.buyMargin}% · Sell ${config.sellMargin}%`}
              </p>
            </div>
            <Link href="/admin/margins" className={editButton}>
              Manage
            </Link>
          </li>
          <li className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <div>
              <p className="font-display text-sm font-semibold text-ink">Rate change history</p>
              <p className="mt-1 text-xs text-graphite">
                {history.length === 0 ? "No rate changes yet" : `Last change ${ago(history[0].created_at)}`}
              </p>
            </div>
            <Popup title="Rate change history" trigger="View" className={editButton}>
              <p className="mb-3 text-xs text-graphite">Manual rate changes and switches to/from auto-pricing. Automatic refreshes aren&apos;t logged.</p>
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
                      <span className="text-graphite">{h.changed_by ?? "unknown"} · {ago(h.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Popup>
          </li>
        </ul>
      </div>
    </div>
  );
}
