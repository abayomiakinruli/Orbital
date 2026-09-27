# Deploying ORBITAL

ORBITAL runs as three processes (website, Telegram bot, rate worker) that share one SQLite file, so they must run **on the same server**. A small Linux VPS (1 GB RAM, Ubuntu 24.04) is enough. Serverless hosts such as Vercel will not work: the bot must run continuously and the database lives on disk.

## 1. Prepare the server

```bash
# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git
sudo npm install -g pm2

# Check the server can reach Bybit (rates depend on it)
curl -s -o /dev/null -w "%{http_code}\n" https://api.bybit.com/v5/market/time
curl -s -o /dev/null -w "%{http_code}\n" https://api.bytick.com/v5/market/time
```

If the first check fails and the second returns 200, set `BYBIT_BASE_URL=https://api.bytick.com` in step 2.

## 2. Install ORBITAL

```bash
git clone <your private repo URL> orbital && cd orbital
npm ci
cp .env.example .env.local && nano .env.local
```

In `.env.local`, set at least:

- `SITE_URL` to your domain, e.g. `https://orbital.ng`
- `API_BASE_URL=http://localhost:3000`
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (generate with `openssl rand -base64 32`)
- the secrets from your current `.env.local` (admin password, session secret, bot token, bot API key, staff chat IDs, Bybit keys)

**Moving from a laptop?** Stop the bot there first (only one copy may run per bot token), then copy your data across so accounts, trades, rates and uploaded adverts come too:

```bash
scp -r data/ user@your-server:~/orbital/
```

## 3. Build and start

```bash
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup      # run the command it prints, so ORBITAL restarts after a reboot
pm2 logs         # watch all three processes
```

## 4. Domain and HTTPS

Point your domain's DNS A record to the server's IP, then install Caddy, which handles HTTPS certificates automatically:

```bash
sudo apt-get install -y caddy
```

`/etc/caddy/Caddyfile`:

```
orbital.ng, www.orbital.ng {
    reverse_proxy localhost:3000 {
        # ORBITAL rate-limits logins and lookups by the client IP it reads
        # from X-Forwarded-For; overwrite it so visitors cannot fake it.
        header_up X-Forwarded-For {remote_host}
    }
}
```

```bash
sudo systemctl reload caddy
```

## 5. Back up the data every day

`data/` holds every account, trade and uploaded image. Back it up off the server:

```bash
mkdir -p ~/backups
crontab -e
# add:
0 3 * * * cd ~/orbital && node -e "new (require('node:sqlite').DatabaseSync)('data/orbital.db').exec(\"VACUUM INTO '$HOME/backups/orbital-$(date +\%F).db'\")" && tar czf ~/backups/uploads-$(date +\%F).tgz data/uploads
```

Copy `~/backups` somewhere else regularly (another machine or cloud storage).

## Updating

```bash
cd ~/orbital
git pull
npm ci
npm run build
pm2 restart all
```

## Checklist after going live

- [ ] Website loads over HTTPS at your domain
- [ ] `/admin` login works; the dashboard shows the bot as online
- [ ] Rates appear on the homepage (the worker is reaching Bybit)
- [ ] A test trade in Telegram shows a rate and ends with a "Track it any time" link
- [ ] The bot is stopped on any other machine
