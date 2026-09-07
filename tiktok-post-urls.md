# TikTok Post URLs

These are the TikTok posts imported into the `tiktok_videos` table.

| # | Type | URL |
|---|------|-----|
| 1 | video | https://www.tiktok.com/@graveyardjokes/video/7613737078420999438 |
| 2 | video | https://www.tiktok.com/@graveyardjokes/video/7605710205610921229 |
| 3 | photo | https://www.tiktok.com/@graveyardjokes/photo/7560046021741432078 |
| 4 | photo | https://www.tiktok.com/@graveyardjokes/photo/7583766628282797325 |
| 5 | photo | https://www.tiktok.com/@graveyardjokes/photo/7560792076493802765 |
| 6 | video | https://www.tiktok.com/@graveyardjokes/video/7559781755084066062 |
| 7 | photo | https://www.tiktok.com/@graveyardjokes/photo/7559667703221341453 |
| 8 | video | https://www.tiktok.com/@graveyardjokes/video/7558983852576869687 |
| 9 | video | https://www.tiktok.com/@graveyardjokes/video/7558140302943341837 |
| 10 | video | https://www.tiktok.com/@graveyardjokes/video/7557957722805783863 |
| 11 | video | https://www.tiktok.com/@graveyardjokes/video/7557609780521487629 |
| 12 | video | https://www.tiktok.com/@graveyardjokes/video/7557213857043844365 |
| 13 | video | https://www.tiktok.com/@graveyardjokes/video/7556817391771061517 |
| 14 | video | https://www.tiktok.com/@graveyardjokes/video/7556404381550152974 |
| 15 | video | https://www.tiktok.com/@graveyardjokes/video/7556101134067305742 |
| 16 | video | https://www.tiktok.com/@graveyardjokes/video/7555717620046105870 |

## Post IDs

```text
7613737078420999438
7605710205610921229
7560046021741432078
7583766628282797325
7560792076493802765
7559781755084066062
7559667703221341453
7558983852576869687
7558140302943341837
7557957722805783863
7557609780521487629
7557213857043844365
7556817391771061517
7556404381550152974
7556101134067305742
7555717620046105870
```

## Import Command

`TIKTOK_ACCESS_TOKEN` is not configured, so new videos must be added manually with `--import` (no `--page`-style auto-discovery exists for TikTok, unlike `gallery:fetch-thumbnails --page` for Facebook). Check https://www.tiktok.com/@graveyardjokes periodically for new posts not yet in the table above.

```bash
php8.3 artisan tiktok:fetch-thumbnails \
  --import="https://www.tiktok.com/@graveyardjokes/video/NEW_VIDEO_ID" \
  --import="https://www.tiktok.com/@graveyardjokes/photo/NEW_PHOTO_ID"
```
