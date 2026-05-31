<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $slug = 'may-31-infrastructure-day';

        $excerpt = 'The last day of May turned into a full infrastructure push across every project: '
            .'Symfony CVE patches, Dependabot, CI/CD pipelines live, and a round of feature '
            .'work — Velvet Radio\'s schedule page, Hollow Press blog polish, Lunar Blood\'s '
            .'dark mode, The Velvet Pulse\'s rate limiting, and Graveyard Jokes\' Google Places fallback.';

        $content = <<<'HTML'
<p>The last day of the month became an infrastructure day. Every project in the portfolio got touched. Some got features. All of them got security patches, Dependabot, and working CD pipelines. This is what that looked like.</p>

<hr />

<h2>Cross-Project — Symfony CVE Patches</h2>

<p>Three Symfony CVEs dropped: CVE-2026-48736, CVE-2026-48784, and CVE-2026-46644. All of them affect components that every Laravel project in the portfolio pulls in transitively. The fix was a <code>composer update</code> targeting the affected packages — <code>symfony/http-foundation</code>, <code>symfony/http-kernel</code>, and related — across Graveyard Jokes, Hollow Press, Lunar Blood, Noteleks, SynthVeil, The Velvet Pulse, Velvet Radio, and the Auth System.</p>

<p>All eight projects are now on patched versions. The auth system had a slightly different set of CVEs (CVE-2026-45075, 45068, 45070, 45067) and was patched separately.</p>

<hr />

<h2>Cross-Project — Dependabot and CD Pipeline Fixes</h2>

<p>Dependabot was added to every project. It will now open automated PRs when npm or Composer dependencies have updates available. This removes the manual tracking burden for dependency hygiene — instead of remembering to check, the project creates a PR.</p>

<p>The CD deploy scripts also got a consistent fix applied everywhere. The previous scripts included a block that tried to commit and push from the server after running migrations, which fails in a CI context where the working tree is clean and there is nothing to commit. The fix replaces that block with a <code>git fetch origin main &amp;&amp; git reset --hard origin/main</code> pattern, which pulls the latest code without attempting any writes back to the remote. Clean, safe, and idempotent.</p>

<hr />

<h2>Velvet Radio — Schedule Page</h2>

<p>Velvet Radio now has a <code>/schedule</code> page. Shows can be assigned a day of the week and a broadcast time via two new fields — <code>schedule_day</code> and <code>schedule_time</code> — added to the <code>shows</code> table in a migration.</p>

<p>The schedule page groups shows by day and renders them in order. The header and mobile nav both link to it. The episodes index page gains show filter pills: clicking a show name appends <code>?show=ShowName</code> to the URL and filters the results. Both the shows listing and the schedule route use <code>Cache::remember</code> with a five-minute TTL. The admin <code>ShowController</code> exposes the schedule fields in the form and busts the cache on any write.</p>

<hr />

<h2>Hollow Press — Blog Polish</h2>

<p>The Hollow Press blog got a substantial update. Featured image uploads were added to posts — images are stored via the existing storage disk and referenced in the post record. Tags were added as a JSON column, with the index response decoding them to an array so the frontend can use them directly.</p>

<p>Email notifications now fire when a post is published. Caching was added to the posts index query. Structured logging records post creation and update events for observability.</p>

<p>Alongside those backend changes, the post create and edit components had TypeScript errors that were resolved, and the frontend was auto-formatted. The full suite — mobile responsiveness, WCAG accessibility, and performance improvements — was applied in a single pass: responsive breakpoints, focus management, reduced motion support, and image lazy loading.</p>

<p>Toast notifications replace the previous inline flash messages. Flash data is now centralised through a single shared composable, so every page picks it up automatically without any per-page wiring. Loading states were added to form submission buttons to prevent double-submits.</p>

<p>Security headers were also tightened for production — stricter CSP, <code>X-Frame-Options</code>, and <code>Referrer-Policy</code> values.</p>

<hr />

<h2>Lunar Blood — Dark Mode, Analytics, and Accessibility</h2>

<p>Lunar Blood now has a dark/light theme toggle. The preference is persisted in <code>localStorage</code> and applied on page load, so there is no flash of the wrong theme. The toggle is accessible — it has a label and keyboard support.</p>

<p>Accessible confirm dialogs were added for destructive actions. Previously, destructive operations used the browser's native <code>confirm()</code> call, which cannot be styled and is blocked in some embedded contexts. The new dialogs are modal, focus-trapped, and dismissible with Escape.</p>

<p>Google Analytics was wired up and a stray <code>console.warn</code> that was firing in production was removed. Pagination got an accessibility pass — page controls now have proper ARIA labels. CI/CD and security headers were added in the same session.</p>

<hr />

<h2>The Velvet Pulse — Form Requests, Dark Mode, and Rate Limiting</h2>

<p>Form validation on The Velvet Pulse was moved out of controllers into dedicated <code>FormRequest</code> classes. This keeps controllers thin and makes the validation rules testable in isolation. A dark mode toggle matching the Lunar Blood implementation was added. Rate limiting was applied to the relevant API-facing routes to prevent abuse. Security headers and a CD pipeline were also added in the same pass.</p>

<hr />

<h2>Noteleks — Security Headers and CI/CD</h2>

<p>Noteleks received security headers via a dedicated middleware and a CI/CD pipeline. The PHPStan baseline was cleaned up — an <code>array_filter</code> call that was generating a false positive in the <code>AddSecurityHeaders</code> middleware was removed. The game test suite had two failing assertions where the expected world height was out of sync with the actual <code>GameConfig</code> value; both were corrected.</p>

<hr />

<h2>SynthVeil — Security Headers and CD</h2>

<p>SynthVeil received the same security headers and CD pipeline treatment. The CD workflow was triggered with SSH secrets configured and the deployment ran clean.</p>

<hr />

<h2>Graveyard Jokes — Google Places Fallback</h2>

<p>The Business Profile endpoints on Graveyard Jokes now have a Google Places API fallback. The primary source for reviews and business info is the Google Business Profile API. When that is unavailable or returns an error, the controller falls back to the Places API using a new <code>GooglePlacesService</code>.</p>

<p>The service handles both the reviews and business info endpoints. It reads <code>GOOGLE_PLACES_API_KEY</code> and <code>GOOGLE_PLACES_PLACE_ID</code> from the environment. Feature tests were added for the fallback behavior and unit tests for the service itself — 176 lines of coverage for the service alone.</p>

<p>A <code>SocialPostsWeekSeeder</code> was also added to make it easy to seed a week of scheduled social content on demand, rather than writing one-off migrations each time.</p>

<hr />

<h2>Auth System — CI/CD</h2>

<p>The shared auth system got its own CI and CD workflows. It was the last project in the portfolio without automated deployment. That is now corrected.</p>

<hr />

<h2>Closing Out May</h2>

<p>That is eight projects updated in a single day. Not all of it is glamorous — security patches and pipeline fixes are maintenance, not features. But maintenance done consistently is what keeps a portfolio of live projects from accumulating debt that eventually blocks everything else.</p>

<p>The feature work — Velvet Radio's schedule page, Hollow Press's blog improvements, Lunar Blood's dark mode and analytics, The Velvet Pulse's rate limiting, Graveyard Jokes' Places fallback — is the kind of incremental progress that compounds. Each one is a small addition. Across a month, they add up to something substantially more capable than what existed at the start.</p>

<p>May closes out with every project healthy, patched, and deploying automatically. That is the foundation for June.</p>

<p>If you are looking for web development, design, or digital marketing — <a href="https://graveyardjokes.com">Graveyard Jokes Studios</a> has the portfolio and the rates. Reach out.</p>

<p><em>— Joshua, Graveyard Jokes Studios</em></p>
HTML;

        DB::table('blog_posts')->updateOrInsert(
            ['slug' => $slug],
            [
                'title' => 'May 31 — Infrastructure Day',
                'slug' => $slug,
                'content' => $content,
                'excerpt' => $excerpt,
                'author' => 'Joshua',
                'published_at' => '2026-05-31 18:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('blog_posts')->where('slug', 'may-31-infrastructure-day')->delete();
    }
};
