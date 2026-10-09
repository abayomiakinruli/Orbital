import { spawn, type ChildProcess } from "node:child_process";
import { getBotLastSeen, getRateBotLastSeen, getRateWorkerLastSeen } from "./repo";
import { dbTime } from "../shared/format";

// Keeps ORBITAL's background processes running: the Telegram trading bot,
// the rate worker and the rate-updates channel bot. Started once per web
// server by instrumentation.ts: every CHECK_MS it looks at each one's
// heartbeat and, when it's stale and this server has no copy of its own
// alive, starts it as a child process. One started elsewhere (a terminal)
// keeps heartbeating, so it's left alone.
//
// Under pm2 (ecosystem.config.cjs) pm2 already runs and restarts all three,
// so orbital-web sets ORBITAL_SUPERVISOR=off: a heartbeat that's only late
// (a pm2 restart, the bot unable to reach /api/bot/ping) would otherwise
// start a second copy, and two bots polling one token knock each other off
// Telegram with 409 Conflict.

type Service = {
  name: string;
  script: string; // npm script
  lastSeen: () => string | null;
  // No heartbeat for this long means it isn't running.
  staleMs: number;
};

export const SERVICES: Service[] = [
  // Heartbeat every 10s (backend/bot/index.ts → app/api/bot/ping).
  { name: "bot", script: "bot", lastSeen: getBotLastSeen, staleMs: 45_000 },
  // Heartbeat every 30s (backend/worker/rate-refresh.ts).
  { name: "rate worker", script: "rate-worker", lastSeen: getRateWorkerLastSeen, staleMs: 90_000 },
  // Heartbeat every 30s (backend/rateBot/index.ts).
  { name: "rate bot", script: "rate-bot", lastSeen: getRateBotLastSeen, staleMs: 90_000 },
];

const CHECK_MS = 15_000;
// On web server start, give processes already running (e.g. under pm2) time
// to send a heartbeat before deciding they're missing.
const STARTUP_GRACE_MS = 20_000;

type State = { children: Map<string, ChildProcess>; timer: NodeJS.Timeout | null };
const g = globalThis as unknown as { orbitalSupervisor?: State };
const state: State = (g.orbitalSupervisor ??= { children: new Map(), timer: null });

// Age in ms of a `datetime('now')` value stored in the meta table (UTC).
export function heartbeatAge(lastSeen: string | null): number {
  if (!lastSeen) return Infinity;
  return Date.now() - dbTime(lastSeen);
}

function ensureRunning(service: Service) {
  const child = state.children.get(service.name);
  if (child && child.exitCode === null && !child.killed) return;
  if (heartbeatAge(service.lastSeen()) < service.staleMs) return;

  console.log(`[supervisor] No ${service.name} heartbeat; starting it`);
  // Its own process group, so stopChildren() can stop npm *and* the tsx
  // process under it — killing npm alone leaves the service running.
  const next = spawn("npm", ["run", service.script], {
    cwd: process.cwd(),
    stdio: "inherit",
    detached: true,
  });
  next.on("exit", (code, signal) => {
    console.log(`[supervisor] ${service.name} exited (${signal ?? `code ${code}`})`);
    if (state.children.get(service.name) === next) state.children.delete(service.name);
  });
  next.on("error", (err) => console.error(`[supervisor] Could not start ${service.name}:`, err));
  state.children.set(service.name, next);
}

function stopChildren() {
  for (const child of state.children.values()) {
    if (child.pid === undefined || child.exitCode !== null) continue;
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      // Already gone.
    }
  }
  state.children.clear();
}

export function startSupervisor() {
  if (process.env.ORBITAL_SUPERVISOR === "off") {
    console.log("[supervisor] ORBITAL_SUPERVISOR=off; background processes are managed elsewhere");
    return;
  }
  if (state.timer) return;
  state.timer = setTimeout(function check() {
    for (const service of SERVICES) {
      try {
        ensureRunning(service);
      } catch (err) {
        console.error(`[supervisor] ${service.name} check failed:`, err);
      }
    }
    state.timer = setTimeout(check, CHECK_MS);
  }, STARTUP_GRACE_MS);
  // Processes this server started go down with it. "exit" alone isn't enough:
  // it doesn't fire when the server is stopped by a signal nothing handles.
  process.once("exit", stopChildren);
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      stopChildren();
      // Our listener stopped the default exit; exit unless Next has its own
      // handler doing a graceful shutdown.
      if (process.listenerCount(signal) === 0) process.exit(signal === "SIGINT" ? 130 : 143);
    });
  }
}
