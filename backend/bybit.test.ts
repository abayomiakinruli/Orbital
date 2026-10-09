import assert from "node:assert/strict";
import test from "node:test";
import { BybitRequestError, requestBybitJson } from "./bybit";

function withBybitEnv(values: Record<string, string>, run: () => Promise<void>) {
  const previous = new Map(Object.keys(values).map((key) => [key, process.env[key]]));
  Object.assign(process.env, values);
  return run().finally(() => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

test("Bybit client accepts a valid V5 ticker response", async () => {
  await withBybitEnv({ BYBIT_MAX_ATTEMPTS: "1", BYBIT_BASE_URL: "https://api.bybit.com" }, async () => {
    const result = await requestBybitJson<{ retCode: number; result: { list: string[] } }>(
      "/v5/market/tickers?category=spot&symbol=BTCUSDT",
      {},
      async () => Response.json({ retCode: 0, result: { list: ["ok"] } }),
    );
    assert.deepEqual(result.result.list, ["ok"]);
  });
});

test("Bybit client honours HTTP 429 Retry-After before one retry", async () => {
  await withBybitEnv({ BYBIT_MAX_ATTEMPTS: "2", BYBIT_BASE_URL: "https://api.bybit.com" }, async () => {
    let calls = 0;
    const result = await requestBybitJson<{ retCode: number; result: { value: number } }>(
      "/v5/market/tickers?category=spot&symbol=BTCUSDT",
      {},
      async () => {
        calls += 1;
        return calls === 1
          ? new Response("slow down", { status: 429, headers: { "Retry-After": "0" } })
          : Response.json({ retCode: 0, result: { value: 1 } });
      },
    );
    assert.equal(calls, 2);
    assert.equal(result.result.value, 1);
  });
});

test("Bybit client classifies a timeout and never retries past its limit", async () => {
  await withBybitEnv({ BYBIT_MAX_ATTEMPTS: "1", BYBIT_BASE_URL: "https://api.bybit.com" }, async () => {
    await assert.rejects(
      requestBybitJson("/v5/market/tickers?category=spot&symbol=BTCUSDT", {}, async () => {
        const error = new Error("timed out");
        error.name = "TimeoutError";
        throw error;
      }),
      (error: unknown) => error instanceof BybitRequestError && error.kind === "timeout",
    );
  });
});

test("Bybit client rejects invalid API JSON instead of accepting a fabricated rate", async () => {
  await withBybitEnv({ BYBIT_MAX_ATTEMPTS: "1", BYBIT_BASE_URL: "https://api.bybit.com" }, async () => {
    await assert.rejects(
      requestBybitJson("/v5/market/tickers?category=spot&symbol=BTCUSDT", {}, async () =>
        new Response("not json"),
      ),
      (error: unknown) => error instanceof BybitRequestError && error.kind === "invalid_response",
    );
  });
});

test("Bybit client falls back to the other official host when one is unreachable", async () => {
  await withBybitEnv({ BYBIT_MAX_ATTEMPTS: "2", BYBIT_BASE_URL: "https://api.bybit.com" }, async () => {
    const tried: string[] = [];
    const result = await requestBybitJson<{ retCode: number; result: { value: number } }>(
      "/v5/market/time",
      {},
      async (input) => {
        const host = new URL(String(input)).host;
        tried.push(host);
        if (host === "api.bybit.com") {
          const error = new Error("timed out");
          error.name = "TimeoutError";
          throw error;
        }
        return Response.json({ retCode: 0, result: { value: 1 } });
      },
    );
    assert.deepEqual(tried, ["api.bybit.com", "api.bytick.com"]);
    assert.equal(result.result.value, 1);

    // The host that answered is remembered for the next call.
    tried.length = 0;
    await requestBybitJson("/v5/market/time", {}, async (input) => {
      tried.push(new URL(String(input)).host);
      return Response.json({ retCode: 0 });
    });
    assert.deepEqual(tried, ["api.bytick.com"]);
  });
});

test("Bybit client stays on one host when falling back is switched off", async () => {
  await withBybitEnv(
    { BYBIT_MAX_ATTEMPTS: "2", BYBIT_BASE_URL: "https://api.bybit.com", BYBIT_FALLBACK_BASE_URL: "off" },
    async () => {
      const tried: string[] = [];
      await assert.rejects(
        requestBybitJson("/v5/market/time", {}, async (input) => {
          tried.push(new URL(String(input)).host);
          const error = new Error("timed out");
          error.name = "TimeoutError";
          throw error;
        }),
        (error: unknown) => error instanceof BybitRequestError && error.kind === "timeout",
      );
      assert.deepEqual(tried, ["api.bybit.com", "api.bybit.com"]);
    },
  );
});

test("Bybit client does not hammer a rate-limited API with blind retries", async () => {
  await withBybitEnv({ BYBIT_MAX_ATTEMPTS: "3", BYBIT_BASE_URL: "https://api.bybit.com" }, async () => {
    let calls = 0;
    await assert.rejects(
      requestBybitJson("/v5/p2p/item/online", {}, async () => {
        calls += 1;
        return Response.json({ retCode: 10006, retMsg: "Too many visits. Exceeded the API Rate Limit." });
      }),
      (error: unknown) => error instanceof BybitRequestError && error.kind === "rate_limit",
    );
    assert.equal(calls, 1);
  });
});

test("Bybit client waits for a rate limit that resets within seconds, then retries", async () => {
  await withBybitEnv({ BYBIT_MAX_ATTEMPTS: "2", BYBIT_BASE_URL: "https://api.bybit.com" }, async () => {
    let calls = 0;
    const result = await requestBybitJson<{ retCode: number; result?: { value: number } }>(
      "/v5/p2p/item/online",
      {},
      async () => {
        calls += 1;
        return calls === 1
          ? Response.json(
              { retCode: 10006, retMsg: "Too many visits." },
              { headers: { "X-Bapi-Limit-Reset-Timestamp": String(Date.now() + 50) } },
            )
          : Response.json({ retCode: 0, result: { value: 7 } });
      },
    );
    assert.equal(calls, 2);
    assert.equal(result.result?.value, 7);
  });
});

