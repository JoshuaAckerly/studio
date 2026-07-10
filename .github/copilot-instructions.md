# studio

## Purpose
Graveyard Jokes Studios portfolio and creative showcase. Features a blog (BlogPosting schema + article OG), illustration gallery sourced from social media (Facebook/TikTok), video log, and newsletter signup. Used to demonstrate development capabilities and attract clients.

## Tech Stack
- **Backend**: Laravel 12, PHP 8.2+, Sanctum (session), Spatie Sitemap
- **Frontend**: React 19, TypeScript, Inertia.js 3, Tailwind CSS 4, Vite
- **Testing**: PHPUnit 11 (`php artisan test`), Vitest + React Testing Library
- **Storage**: MySQL (prod), SQLite (tests), AWS S3 (assets), optional Redis

## Architecture

### Controllers (`app/Http/Controllers/`)
- `BlogPostController` — blog listing (`/blog`) and single post (`/blog/{slug}`) with BlogPosting schema
- `IllustrationController` — illustration gallery page (social media sourced)
- `VideoLogController` — video log page
- `NewsletterController` — `POST /newsletter/subscribe`, `GET /newsletter/unsubscribe/{token}`
- `Admin/SubscriberController` — authenticated admin subscriber management
- `Api/` — API endpoints
- `Auth/` — Breeze-based auth

### Models (`app/Models/`)
- `BlogPost` — blog content with SEO metadata (BlogPosting JSON-LD)
- `FacebookGalleryPost` — Facebook illustration gallery posts
- `TikTokVideo` — TikTok video log entries
- `VideoLog` — video log entries
- `Subscriber` — newsletter subscribers (with unsubscribe token)
- `User`

### Services (`app/Services/`)
- `AuthSystemService` — proxies auth to centralized auth-system API
- `IllustrationService` — fetches and caches social media illustration posts
- `VideoLogService` — fetches and caches video log entries
- `StorageDiskAdapter`, `StorageUrlGenerator`, `StorageConfigProvider` — S3/storage abstractions

### Routes (`routes/web.php`)
| Route | Handler |
|-------|---------|
| `GET /` | welcome page |
| `GET /video-log` | `VideoLogController@index` |
| `GET /blog` | `BlogPostController@index` |
| `GET /blog/{slug}` | `BlogPostController@show` |
| `GET /illustrations` | route closure → Inertia |
| `POST /newsletter/subscribe` | `NewsletterController@store` |
| `GET /newsletter/unsubscribe/{token}` | `NewsletterController@unsubscribe` |
| `GET /admin/subscribers` | `Admin/SubscriberController@index` (auth) |

### Frontend (`resources/js/`)
- Pages: `pages/` (PascalCase)
  - `Blog/Index.tsx`, `Blog/Show.tsx`
  - `Illustrations.tsx`, `VideoLog.tsx`, `welcome.tsx`
- Components: `components/`
- SSR entry: `ssr.tsx`

## Key Patterns
- Social media gallery (illustrations + video log) uses cached API calls via `IllustrationService` / `VideoLogService` to avoid rate limits.
- Blog posts include **BlogPosting JSON-LD schema** and article-specific OG tags.
- Dynamic sitemap via `SitemapController`.
- Auth is handled via **auth-system** proxy (`AuthSystemService`). Do not add local auth logic.

## Build & Test
```bash
php artisan test
npm run test            # Vitest
npm run build:ssr
npm run types
npm run lint
./vendor/bin/pint
```

## Notable Files
- `deploy-production.sh` — production deployment script
