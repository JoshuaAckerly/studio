# TikTok Post URLs

These are the TikTok posts imported into the `tiktok_videos` table.

| # | Type | URL |
|---|------|-----|
| 1 | video | https://www.tiktok.com/@graveyardjokes/video/7613737078420999438 |
| 2 | video | https://www.tiktok.com/@graveyardjokes/video/7605710205610921229 |
| 3 | photo | https://www.tiktok.com/@graveyardjokes/photo/7560046021741432078 |

## Post IDs

```text
7613737078420999438
7605710205610921229
7560046021741432078
```

## Import Command

```bash
php8.3 artisan tiktok:fetch-thumbnails \
  --import="https://www.tiktok.com/@graveyardjokes/video/7613737078420999438" \
  --import="https://www.tiktok.com/@graveyardjokes/video/7605710205610921229" \
  --import="https://www.tiktok.com/@graveyardjokes/photo/7560046021741432078"
```
