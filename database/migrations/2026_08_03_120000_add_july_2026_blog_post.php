<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $slug = 'july-2026-gsap-redesigns-content-hub';

        $excerpt = 'July was the month the portfolio started to feel alive. GSAP animations '
            .'landed across every project, Studio was rebuilt as a proper content hub, '
            .'SynthVeil got a full visual redesign, and the auth system analytics got '
            .'significantly smarter. Here is what actually shipped.';

        $content = <<<'HTML'
<p>July was a sustained push. No single project dominated — every site in the portfolio got touched, and a few of them changed substantially. Here is the honest account.</p>

<hr />

<h2>GSAP — Portfolio-Wide Animations</h2>

<p>The biggest cross-cutting change this month was adding GSAP across every project. Graveyard Jokes, Hollow Press, Lunar Blood, SynthVeil, The Velvet Pulse, and Velvet Radio all got hero parallax, scroll-triggered reveals, and page transitions in the same pass.</p>

<p>Graveyard Jokes also got 3D card tilt on the services section — a small touch that makes the page feel substantially more premium. The ScrollTrigger plugin required explicit registration, which caused a brief production regression before it was caught and fixed.</p>

<p>The animations are not decorative noise. Each one is tied to a scroll position or navigation event. Pages that previously loaded flat now have a sense of depth and progression. It changes how the work reads.</p>

<hr />

<h2>Studio — Rebuilt as a Content Hub</h2>

<p>Studio was redesigned from the ground up this month. The previous version was a portfolio showcase. The new version is a content hub: blog, TikTok video log, Discord feed, Facebook posts, and Instagram — all pulled from their respective APIs and presented in one place.</p>

<p>Four new sync commands were added: <code>facebook:sync-posts</code>, <code>discord:sync-posts</code>, <code>tiktok:sync-posts</code>, and <code>instagram:sync</code>. Each one pulls recent content from its platform and stores it locally, so the studio pages are not dependent on live API calls at render time. Facebook and Instagram now appear in the nav and on the homepage.</p>

<p>The mobile nav was also fixed — the hamburger toggle and dropdown were wired up properly, which they had not been since the previous redesign. That was embarrassing in retrospect.</p>

<p>This post is appearing on the new Studio. The irony of writing about rebuilding the blog on the blog is not lost on me.</p>

<hr />

<h2>SynthVeil — Full Redesign</h2>

<p>SynthVeil received the first full visual redesign of any portfolio project since launch. The previous version was functional but generic. The new version has an animated gradient hero, a character reveal section, and GSAP scroll animations tied to the releases, shows, and about sections.</p>

<p>The design leans into the SynthVeil brand identity — dark, atmospheric, electronic. It is a substantial departure from what was there before and the first site in the portfolio that feels genuinely distinct rather than a variation on a shared template.</p>

<hr />

<h2>Hollow Press — Artist Cards and Visual Polish</h2>

<p>Hollow Press got a visual polish pass. Artist cards now have colorful avatar gradients instead of grey placeholder boxes. Project cards show a gradient placeholder when no cover image is set — previously they collapsed or showed a broken image. Small changes, but the kind that make a demo feel finished rather than scaffolded.</p>

<p>An SSR build regression was also fixed here — the <code>manualChunks</code> configuration was conflicting with the <code>@sentry/react</code> external during SSR builds. The fix (<code>isSsrBuild ? undefined : {...}</code>) was applied across the full portfolio wherever the pattern appeared.</p>

<hr />

<h2>Lunar Blood — Payment Idempotency and Caching</h2>

<p>Lunar Blood's payment flow received a reliability upgrade. The idempotency key implementation was hardened: keys are now server-generated, use an atomic <code>Cache::add</code> check, and require <code>orderData</code> validation. A redirect guard was added to the checkout route to prevent duplicate submissions on page reload.</p>

<p>Dashboard queries also got caching added with a short TTL. The event management pages were loading slowly under modest traffic — this brings them in line with the rest of the portfolio.</p>

<hr />

<h2>Auth System — Analytics Gets Smarter</h2>

<p>The shared auth system analytics dashboard had three meaningful additions this month.</p>

<p>First, bot filtering. A <code>scopeHuman</code> scope was added to the <code>SiteVisit</code> model and an <code>is_bot</code> index was added to the <code>site_visits</code> table. The analytics dashboard now filters out bot traffic by default, so the numbers reflect actual human visits. The index makes those queries fast at scale.</p>

<p>Second, a social referrals section was added — showing which social platforms are actually driving traffic. Having Search Console, Google Business, and social referral data in one dashboard is genuinely useful for understanding what is working.</p>

<p>Third, a potential clients panel was added. This surfaces visits that look like agency evaluation traffic — relevant for Graveyard Jokes' client pipeline.</p>

<hr />

<h2>Graveyard Jokes — eCommerce Add-On and Scheduling</h2>

<p>An eCommerce add-on package was added back to the Graveyard Jokes services page and homepage. It had been removed in the June services overhaul. Based on a few conversations, it was clear that leaving it out entirely was losing leads — so it is back, repositioned as an explicit add-on rather than a core offering.</p>

<p>The social post scheduler also got a bulk-delete endpoint, which makes it significantly faster to clean up or reschedule batches of queued posts. Previously that required individual deletes.</p>

<hr />

<h2>Security and CI/CD — Finishing the Sweep</h2>

<p>The Guzzle CVE (<code>GHSA-wm3w/f283/94pj</code>) was patched across every project — Graveyard Jokes, Hollow Press, Lunar Blood, SynthVeil, The Velvet Pulse, Velvet Radio, Noteleks, and Auth System all got the update.</p>

<p>Weekly security audit and daily uptime check GitHub Actions workflows were added to every project that was still missing them. Manual re-run support (<code>workflow_dispatch</code>) was added to the CD workflows across the board.</p>

<p>Noteleks was upgraded from PHP 8.3 to PHP 8.4 and got ESLint and Prettier added to its CI. Legal pages — cookie policy and terms — were added to SynthVeil, The Velvet Pulse, Velvet Radio, and Noteleks, completing the legal coverage across the portfolio.</p>

<hr />

<h2>What Is Next</h2>

<p>The portfolio is visually and technically in the best shape it has been. The next priorities are Noteleks enemy art (still placeholder rectangles — that has been the backlog item since May), continuing the Graveyard Jokes client pipeline, and keeping the Studio content updated more consistently.</p>

<p>A month between posts is too long. That changes from here.</p>

<p>If you are looking for web development, design, or social media management — <a href="https://graveyardjokes.com">Graveyard Jokes Studios</a> is open. Reach out.</p>

<p><em>— Joshua, Graveyard Jokes Studios</em></p>
HTML;

        DB::table('blog_posts')->updateOrInsert(
            ['slug' => $slug],
            [
                'title' => 'July 2026 — GSAP, Redesigns, and a Studio Built for Content',
                'slug' => $slug,
                'content' => $content,
                'excerpt' => $excerpt,
                'author' => 'Joshua',
                'published_at' => '2026-08-03 06:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('blog_posts')->where('slug', 'july-2026-gsap-redesigns-content-hub')->delete();
    }
};
