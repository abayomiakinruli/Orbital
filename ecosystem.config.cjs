// pm2 process file for production: `pm2 start ecosystem.config.cjs`.
// Runs the four ORBITAL processes side by side on one server; all four
// share data/orbital.db, so they must run on the same machine. pm2 restarts
// the background three itself, so the web server's own supervisor is off
// (backend/supervisor.ts) to avoid running a second copy of any of them.
module.exports = {
  apps: [
    {
      name: "orbital-web",
      script: "npm",
      args: "run start -- -p 3000",
      cwd: __dirname,
      env: { NODE_ENV: "production", ORBITAL_SUPERVISOR: "off" },
    },
    { name: "orbital-bot", script: "npm", args: "run bot", cwd: __dirname },
    { name: "orbital-rates", script: "npm", args: "run rate-worker", cwd: __dirname },
    { name: "orbital-rate-bot", script: "npm", args: "run rate-bot", cwd: __dirname },
  ],
};
