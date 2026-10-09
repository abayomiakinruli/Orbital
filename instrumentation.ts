// Runs once when the Next.js server starts. Starts the watcher that keeps the
// Telegram bot, the rate worker and the rate-updates bot running
// (backend/supervisor.ts), unless ORBITAL_SUPERVISOR=off.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startSupervisor } = await import("./backend/supervisor");
    startSupervisor();
  }
}
