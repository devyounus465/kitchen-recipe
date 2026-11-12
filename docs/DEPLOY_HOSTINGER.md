# Deploying to a Hostinger VPS

The stack is PostgreSQL + the Next.js app + Caddy (automatic HTTPS), all in Docker.
Tested end-to-end: production image build, migrations, seed, importer, HTTPS, 67/67 browser
tests, upload persistence across restarts, and backups.

> Use a **VPS** plan (KVM 1 is enough for launch, KVM 2 for more traffic).
> Hostinger *shared/Business web hosting* does not provide PostgreSQL and is not suitable.

## 1. Create the VPS
hPanel → VPS → choose **Ubuntu 24.04 with Docker** as the OS template, set a root password
(or SSH key), and note the server's **IP address**.

## 2. Point the domain
hPanel → Domains → DNS: create **A** records for `@` and `www` pointing to the VPS IP.
(DNS can take a few minutes to an hour.)

## 3. Log in and prepare the server
```bash
ssh root@YOUR_SERVER_IP
apt update && apt -y upgrade
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable
docker --version || (curl -fsSL https://get.docker.com | sh)
```

## 4. Get the code and configure
```bash
git clone https://github.com/devyounus465/kitchen-recipe /opt/simmerly
cd /opt/simmerly
cp deploy/env.example .env
nano .env          # set DOMAIN, POSTGRES_PASSWORD, AUTH_SECRET (openssl rand -hex 32)
```
For a private repository, use a GitHub fine-grained personal access token (read-only) when cloning.

## 5. Start
```bash
docker compose up -d --build                       # first build takes ~3–5 minutes
docker compose exec app npm run db:push            # create tables + search index
docker compose exec app npm run db:seed            # OPTIONAL: demo content (wipes content tables!)
docker compose exec app npm run import -- scripts/your-content.json   # real content import
```
Open `https://YOUR_DOMAIN`. Caddy obtains the HTTPS certificate automatically on first visit.

**Immediately** log in at `/admin` (seed admin: admin@simmerly.test / Admin123!) and change the
password, or create your own admin user and delete the demo one.

## 6. Backups (daily, 14-day retention)
```bash
crontab -e
15 3 * * * /opt/simmerly/deploy/backup.sh >> /var/log/simmerly-backup.log 2>&1
```
Restore: `deploy/restore.sh /opt/simmerly-backups/db-XXXX.dump /opt/simmerly-backups/uploads-XXXX.tar.gz`.
Copy backups off the server too (e.g. Hostinger snapshot, or `rclone` to Google Drive/S3).

## 7. Updating the site
```bash
cd /opt/simmerly && git pull && docker compose up -d --build && docker compose exec app npm run db:push
```

## Useful commands
| Task | Command |
|---|---|
| See status | `docker compose ps` |
| App logs | `docker compose logs -f app` |
| Restart | `docker compose restart app` |
| Database shell | `docker compose exec db psql -U simmerly` |
