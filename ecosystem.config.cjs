// pm2 process file for production: `pm2 start ecosystem.config.cjs`.
// Runs the three ORBITAL processes side by side on one server; all three
// share data/orbital.db, so they must run on the same machine.
module.exports = {
  apps: [
    { name: "orbital-web", script: "npm", args: "run start -- -p 3000", cwd: __dirname, env: { NODE_ENV: "production" } },
    { name: "orbital-bot", script: "npm", args: "run bot", cwd: __dirname },
    { name: "orbital-rates", script: "npm", args: "run rate-worker", cwd: __dirname },
  ],
};
