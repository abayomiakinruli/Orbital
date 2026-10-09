import {
  resetCoinMargin,
  saveCoinMargin,
  saveMarginSettings,
} from "@/app/admin/actions";
import { requireAdmin } from "@/backend/auth";
import {
  getMarginSettings,
  listCoinMargins,
  listRates,
  type CoinMargin,
  type MarginSettings,
} from "@/backend/repo";
import { ActionForm, inputClass } from "@/frontend/components/admin/ui";
import Popup from "@/frontend/components/admin/Popup";

export const dynamic = "force-dynamic";

// Margins for auto-priced assets (backend/margin.ts does the math): the
// defaults every coin uses, and per-coin overrides on top — e.g. a higher
// margin on volatile BTC/SOL than on USDT. Applied by the rate worker on its
// next refresh and by live bulk quotes (backend/repo.ts's marginTierFor).

// One number in the Margin engine form: label, a line saying what it does,
// then the input, with room between them so the figures don't crowd.
function MarginField({
  name,
  label,
  hint,
  defaultValue,
}: {
  name: string;
  label: string;
  hint: string;
  defaultValue: number;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink">{label}</span>
      <span className="mt-0.5 block text-xs leading-snug text-graphite">{hint}</span>
      <input
        name={name}
        type="number"
        step="any"
        min="0"
        required
        defaultValue={defaultValue}
        className={`mt-2 tabular-nums ${inputClass}`}
      />
    </label>
  );
}

const unit = (s: MarginSettings) => (s.mode === "fixed" ? "₦ per $1" : "%");
const show = (n: number, s: MarginSettings) => (s.mode === "fixed" ? `₦${n}` : `${n}%`);

// One coin's overrides. Blank fields fall back to the default, shown as the
// placeholder.
function CoinMarginCard({
  symbol,
  name,
  auto,
  own,
  settings,
}: {
  symbol: string;
  name: string;
  auto: boolean;
  own: CoinMargin | null;
  settings: MarginSettings;
}) {
  const fields = [
    { key: "buy", label: "Buy", value: own?.buy, fallback: settings.buyMargin },
    { key: "sell", label: "Sell", value: own?.sell, fallback: settings.sellMargin },
    { key: "bulkBuy", label: "Bulk buy", value: own?.bulk_buy, fallback: settings.bulkBuyMargin },
    { key: "bulkSell", label: "Bulk sell", value: own?.bulk_sell, fallback: settings.bulkSellMargin },
  ];
  const summary = own
    ? fields
        .filter((f) => f.value !== null && f.value !== undefined)
        .map((f) => `${f.label} ${show(f.value as number, settings)}`)
        .join(" · ") || "Using the default margins"
    : "Using the default margins";
  return (
    <li>
      <Popup
        title={`${symbol} margins`}
        label={`Edit ${symbol} margins`}
        className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-ink/5"
        trigger={
          <>
            <span className="w-16 shrink-0 font-display text-sm font-semibold text-ink">{symbol}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-ink">{name}</span>
              <span className="block truncate text-xs text-graphite">
                {summary}
                {!auto && " · priced manually"}
              </span>
            </span>
            <span className="shrink-0 text-xs text-graphite">Edit</span>
          </>
        }
      >
        <p className="mb-4 text-xs text-graphite">
          {own ? "Using its own margins where set." : "Using the default margins."} Leave a box blank
          to use the default.
          {!auto && " This coin is priced manually, so margins don't apply until it's switched to auto."}
        </p>
          {/* Keyed on whether the coin has overrides, so "Reset to default"
              rebuilds the inputs empty (they'd otherwise keep the old numbers),
              without wiping the "saved" message on an ordinary save. */}
          <ActionForm
            key={own ? "own" : "default"}
            action={saveCoinMargin}
            submit="Save"
            className="space-y-4"
          >
            <input type="hidden" name="symbol" value={symbol} />
            <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
              {fields.map((f) => (
                <label key={f.key} className="block">
                  <span className="block text-sm font-medium text-ink">
                    {f.label} <span className="font-normal text-graphite">({unit(settings)})</span>
                  </span>
                  <input
                    name={f.key}
                    type="number"
                    step="any"
                    min="0"
                    defaultValue={f.value ?? undefined}
                    placeholder={`Default: ${show(f.fallback, settings)}`}
                    className={`mt-2 tabular-nums ${inputClass}`}
                  />
                </label>
              ))}
            </div>
          </ActionForm>
        {own && (
          <form action={resetCoinMargin} className="mt-3 border-t border-line pt-3">
            <input type="hidden" name="symbol" value={symbol} />
            <button className="text-sm text-graphite underline-offset-4 hover:text-ink hover:underline">
              Reset to default
            </button>
          </form>
        )}
      </Popup>
    </li>
  );
}

export default async function MarginsPage() {
  await requireAdmin();
  const marginSettings = getMarginSettings();
  const own = new Map(listCoinMargins().map((m) => [m.asset_symbol, m]));
  const coins = listRates().filter((a) => a.active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Margins</h1>
        <p className="mt-1 text-sm text-graphite">
          What ORBITAL adds when customers buy and takes off when they sell. Changes reach
          the bot on the next rate refresh (within 10 minutes).
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-sm font-semibold text-ink">Default margins</p>
            <p className="mt-1 text-xs text-graphite">
              Used by every auto-priced coin unless it has its own.{" "}
              {marginSettings.mode === "fixed" ? "Fixed ₦ per $1 of value." : "A percentage of the market rate."}
            </p>
          </div>
          <Popup
            title="Default margins"
            trigger="Edit"
            className="rounded-full bg-ink px-4 py-1.5 text-sm text-paper transition-colors hover:text-accent"
          >
            <p className="mb-5 text-xs text-graphite">
              A percentage of the coin&apos;s market rate, or a fixed ₦ amount per $1 of value. Bulk
              margins apply to trades at or above the threshold. The mode applies to all coins.
            </p>
              <ActionForm action={saveMarginSettings} submit="Save" className="space-y-6">
                {/* Keyed on the saved mode: React resets a form after its action
                    runs, and an uncontrolled select would snap back to the mode
                    the page first loaded with. Remounting shows the saved one. */}
                <fieldset key={marginSettings.mode}>
                  <legend className="block text-sm font-medium text-ink">Margin mode</legend>
                  <span className="mt-0.5 block text-xs text-graphite">
                    How every margin below is read. Currently{" "}
                    {marginSettings.mode === "fixed" ? "fixed ₦ per $1" : "percentage"}.
                  </span>
                  <div className="mt-2 inline-flex rounded-full border border-line bg-white p-1 text-sm">
                    {[
                      { value: "percentage", label: "Percentage (%)" },
                      { value: "fixed", label: "Fixed ₦ per $1" },
                    ].map((m) => (
                      <label key={m.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="mode"
                          value={m.value}
                          defaultChecked={marginSettings.mode === m.value}
                          className="peer sr-only"
                        />
                        <span className="block rounded-full px-4 py-1.5 text-graphite transition-colors peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:ring-2 peer-focus-visible:ring-accent hover:text-ink peer-checked:hover:text-paper">
                          {m.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="border-t border-line pt-5">
                  <legend className="sr-only">Regular trades</legend>
                  <p className="text-xs font-semibold uppercase tracking-wide text-graphite">
                    Regular trades
                  </p>
                  <div className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                    <MarginField
                      name="buyMargin"
                      label="Buy margin"
                      hint="Added on top of the market rate when a customer buys."
                      defaultValue={marginSettings.buyMargin}
                    />
                    <MarginField
                      name="sellMargin"
                      label="Sell margin"
                      hint="Taken off the market rate when a customer sells."
                      defaultValue={marginSettings.sellMargin}
                    />
                  </div>
                </fieldset>

                <fieldset className="border-t border-line pt-5">
                  <legend className="sr-only">Bulk trades</legend>
                  <p className="text-xs font-semibold uppercase tracking-wide text-graphite">
                    Bulk trades
                  </p>
                  <div className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                    <MarginField
                      name="bulkBuyMargin"
                      label="Bulk buy margin"
                      hint="Used instead of the buy margin for trades at or above the threshold."
                      defaultValue={marginSettings.bulkBuyMargin}
                    />
                    <MarginField
                      name="bulkSellMargin"
                      label="Bulk sell margin"
                      hint="Used instead of the sell margin for trades at or above the threshold."
                      defaultValue={marginSettings.bulkSellMargin}
                    />
                    <MarginField
                      name="bulkThresholdNgn"
                      label="Bulk threshold (₦)"
                      hint="Trades worth this much or more get the bulk margins."
                      defaultValue={marginSettings.bulkThresholdNgn}
                    />
                  </div>
                </fieldset>
              </ActionForm>
          </Popup>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            ["Buy", show(marginSettings.buyMargin, marginSettings)],
            ["Sell", show(marginSettings.sellMargin, marginSettings)],
            ["Bulk buy", show(marginSettings.bulkBuyMargin, marginSettings)],
            ["Bulk sell", show(marginSettings.bulkSellMargin, marginSettings)],
            ["Bulk from", `₦${marginSettings.bulkThresholdNgn.toLocaleString("en-US")}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-paper-dim p-3">
              <dt className="text-xs uppercase tracking-wide text-graphite">{label}</dt>
              <dd className="mt-2 text-sm font-semibold tabular-nums text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="font-display text-sm font-semibold text-ink">Per-coin margins</p>
        <p className="mt-1 text-xs text-graphite">
          Give a coin its own margins, e.g. higher on BTC and SOL. Click a coin to edit.
        </p>
        <ul className="mt-4 divide-y divide-line border-t border-line">
          {coins.map((c) => (
            <CoinMarginCard
              key={c.symbol}
              symbol={c.symbol}
              name={c.name}
              auto={c.rate?.mode === "auto"}
              own={own.get(c.symbol) ?? null}
              settings={marginSettings}
            />
          ))}
          {coins.length === 0 && <li className="py-3 text-sm text-graphite">No active coins.</li>}
        </ul>
      </div>
    </div>
  );
}
