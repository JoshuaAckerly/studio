Migration & local MinIO sync

This document documents the small tooling provided in `scripts/` to normalize the S3 prefix for illustrations and copy production objects into a local MinIO for deterministic local/CI testing.

Files of interest

- `scripts/aws_to_minio_copy.php` — PHP script that copies objects from the configured AWS S3 bucket/prefix (`images/illustrations/`) into a local MinIO endpoint. It:
  - prefers admin credentials in `.env`: `AWS_ACCESS_KEY_ID_ADMIN` / `AWS_SECRET_ACCESS_KEY_ADMIN` if present,
  - falls back to `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`,
  - falls back to the AWS SDK default provider chain if no explicit credentials exist.
  - Usage: `php scripts/aws_to_minio_copy.php [--dry]` (use `--dry` to list objects without copying).

- `scripts/aws_move_illustrations_dryrun.ps1` — PowerShell dry-run enumerator for legacy prefix `images/Illustrations/` mapping to canonical `images/illustrations/` and writes a JSON report.

- `scripts/aws_move_illustrations_copy.ps1` — PowerShell script to copy objects internally within S3 (copy within the same bucket), skipping existing targets and writing a report.

- `policy_graveyard_put_illustrations.json` & `policy_S3PutObjectToBuildsPrefix.json` — Minimal IAM policy examples for granting `s3:PutObject` to the canonical `images/illustrations/*` prefix.

Quick start (local)

1. Ensure MinIO is running locally at `http://127.0.0.1:9000` (credentials `minioadmin/minioadmin` in scripts). If you run MinIO at a different host/port, update `scripts/aws_to_minio_copy.php` destination client accordingly.

2. Add admin credentials to your `.env` (or rely on your preferred AWS credentials provider):

   AWS_ACCESS_KEY_ID_ADMIN=AKIA...\n   AWS_SECRET_ACCESS_KEY_ADMIN=...

3. Dry-run the copy to verify which objects will be copied:

   ```powershell
   php scripts\aws_to_minio_copy.php --dry
   ```

4. If dry-run lists the expected files, run the real copy:

   ```powershell
   php scripts\aws_to_minio_copy.php
   ```

Notes about environments and region

- Windows shells sometimes include stray whitespace when setting environment variables inline; if you hit "InvalidRegionException", check `AWS_DEFAULT_REGION` for trailing spaces. The script reads from `.env` preferentially.

- The script will use `AWS_ACCESS_KEY_ID_ADMIN` from `.env` if present. If you prefer not to store admin creds in `.env`, run the script with inline env vars or rely on ~/.aws/credentials.

Verifying local MinIO

- Quick check (PHP): `php scripts/minio_list.php` (lists `images/illustrations/` keys).
- The test suite also has integration tests intended to run against MinIO in CI; confirm `php artisan test` as needed.

Cleaning up

- All scripts are safe to re-run; they skip copying if the target exists (the PowerShell copy script does; the PHP copy uploads unconditionally — run dry-run first if unsure).

If you'd like, I can open a short PR with this README as `README_MIGRATION.md` and a follow-up `README_UI.md` addition, or rename this file to `README.md` — tell me which you'd prefer.
