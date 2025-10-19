# Deployment checklist — Herd / Forge

This file documents a safe, repeatable deploy process for `studio.graveyardjokes.com` using Herd (Forge integration) or manual Forge/SSH deploys.

Follow these steps exactly to minimize downtime and make rollbacks straightforward.

## 1) Preconditions

- Ensure GitHub Actions on `main` are green (unit + integration). If CI is failing, do not deploy.
- Communicate with your team and pick a low-traffic window if migrations or breaking changes are included.

## 2) Backups (required)

Database (MySQL example). Run on the production server or via your hosting control panel/Forge console:

Windows / PowerShell (adjust credentials and paths):
```powershell
mysqldump -u <db_user> -p<db_pass> <db_name> > C:\backups\studio-db-$(Get-Date -Format yyyyMMddHHmm).sql
```

Linux / SSH (example):
```bash
ssh forge@your-server 'mysqldump -u <db_user> -p"<db_pass>" <db_name> > /tmp/studio-db-$(date +%Y%m%d%H%M).sql'
scp forge@your-server:/tmp/studio-db-*.sql ~/backups/
```

Storage / S3 backup (if using S3 or MinIO):
```bash
# sync production bucket to a backup bucket or local folder
aws s3 sync s3://your-prod-bucket s3://your-backup-bucket --profile production
# OR to local (be mindful of size)
aws s3 sync s3://your-prod-bucket /tmp/studio-s3-backup --profile production
```

## 3) Quick local checks (on your dev machine)

1. Pull latest main and run fast tests:
```powershell
git checkout main
git pull origin main
composer install --no-dev --prefer-dist
composer run test:fast
npm ci
npm run build
```

2. If tests fail, do not deploy until fixed.

## 4) Verify production environment variables (Forge/Herd)

- In Forge, open the Site -> Environment tab and confirm the following are set correctly:
  - APP_KEY, APP_ENV=production, APP_URL
  - DB_CONNECTION, DB_DATABASE, DB_USERNAME, DB_PASSWORD, DB_HOST, DB_PORT
  - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET, AWS_ENDPOINT (if MinIO), AWS_USE_PATH_STYLE_ENDPOINT
  - CLOUDFRONT_DOMAIN (if used) and any other 3rd-party API keys

## 5) Put app into maintenance mode (optional, for major changes)

On the server (Forge console or SSH):
```bash
cd /home/forge/studio.graveyardjokes.com
php artisan down --message="Deploying update" --retry=60
```

## 6) Deploy (Herd + Forge recommended)

Using Herd UI (preferred if configured):
- Open Herd, select the Forge integration and the site `studio.graveyardjokes.com`.
- Trigger a deploy for the `main` branch or upload a build artifact created by CI.

Manual Forge / SSH steps (if you deploy directly):
```bash
ssh forge@<server-ip>
cd /home/forge/studio.graveyardjokes.com
git fetch origin
git checkout main
git pull origin main
composer install --no-dev --optimize-autoloader --prefer-dist
# If you build assets on server (prefer building in CI instead):
npm ci && npm run build
php artisan migrate --force
php artisan queue:restart
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Notes:
- Prefer building assets in CI and deploying built assets to the server (faster, deterministic).
- Use `--force` when running migrations on production.

## 7) Bring the site up and run smoke tests

If you put the app into maintenance mode, bring it up:
```bash
php artisan up
```

Smoke tests (copy/paste from your workstation):
```powershell
curl -I https://studio.graveyardjokes.com
curl -sS https://studio.graveyardjokes.com/api/video-logs | jq .
# Check video serve endpoint (sample path)
curl -I "https://studio.graveyardjokes.com/api/video-logs/serve?path=video-logs/sample.mp4"
```

Also check logs on the server:
```bash
tail -n 200 storage/logs/laravel.log
```

## 8) Rollback plan

Code rollback (quick):
```bash
# revert the last deployed commit and push to main, or use Forge UI to redeploy previous release
git revert <deploy-commit>  # creates a revert commit
git push origin main
```

Database rollback:
- Restore from the DB dump you created earlier.

## 9) Optional: Post-deploy housekeeping

- Purge CDN caches (CloudFront) if you changed asset paths but kept filenames.
- Monitor logs and metrics for at least 10–30 minutes after deploy.

## 10) Common pitfalls

- Missing or incorrect env vars (APP_KEY, DB_*, AWS_*) — causes runtime errors.
- Running migrations that delete or alter data without a pre-migration backup.
- Assets mismatch: prefer building assets in CI to avoid server-side build variance.

If you want, I can also add a small `deploy.ps1` (PowerShell) or `deploy.sh` that runs these commands via SSH and creates a DB dump automatically before migrating. Tell me which you prefer and I'll create it.

---
Last updated: 2025-10-18
