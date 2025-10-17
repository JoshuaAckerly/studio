Video Log Page

What I added

- New Inertia React page: `resources/js/pages/VideoLog.tsx`.
- New routes in `routes/web.php`:
  - GET `/video-log` — renders the Video Log page via Inertia.
  - GET `/api/video-logs` — returns a static JSON list of video log entries for the page.

How the page works

- The page fetches `/api/video-logs` and displays thumbnails in a responsive grid.
- Clicking a thumbnail opens a modal with a native HTML5 `<video>` player.

Preview locally

1. Start the app and Vite (you may already run these):

```powershell
# from project root
npm run dev
# in parallel, start your Laravel server (if using php artisan serve)
php artisan serve
```

2. Open https://studio.test/video-log or http://localhost:8000/video-log depending on your local environment.

Notes

- The sample API returns static items and file paths for thumbnails/videos. Add real media to `public/images/vlogs/*` and `public/videos/*` or update the returned URLs.
- Accessibility: the page uses Headless UI `Dialog` for accessible modal behavior. Video player uses native controls.
- Next improvements: pagination, server-side pagination API, lazy-loading thumbnails, lightbox transitions, or YouTube/OEmbed support for hosted videos.
