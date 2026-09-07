<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $slug = 'september-2026-paline-bot-filtering-facebook-fixes';

        $excerpt = 'It has been over a month since the last post — longer than it should have been. '
            .'In that gap: a brand new client project went from prototype to a real production '
            .'booking platform, the auth system\'s analytics got a serious bot-filtering overhaul, '
            .'and Studio\'s own social media sync turned out to be quietly broken in more than one way.';

        $content = <<<'HTML'
<p>It has been a little over a month since the last post here. Longer than the usual gap, and worth just saying so rather than pretending the pace never slipped. The work did not stop — it is just overdue to be written up. Here is what actually happened.</p>

<hr />

<h2>Paline — A New Client Project, Start to Finish</h2>

<p>The biggest thing to land since the last post: <strong>Paline</strong>, a booking platform built for a touring band, went from a bare-bones five-page site to a real production application in about three weeks.</p>

<p>It started small — an Americana-themed site with a bio, photo galleries, and a Music page embedding Spotify and Apple Music. Within a couple of weeks it grew a full booking system: a calendar and routing API for checking date availability, secure booking authentication, and a persistence layer for booking requests. From there it kept going — recurring booking dates, production options (sound, lighting, staging tiers), venue and event detail capture, and a production entry flow that takes a request from first inquiry through to a confirmed booking.</p>

<p>Two pieces worth calling out specifically:</p>

<p><strong>Flexible-date routing</strong> — when a booker is open to a range of dates rather than one fixed night, the system now ranks candidate dates using real geocoding and a distance-based scoring formula, instead of just sorting by availability. It favors dates that keep a tour routing efficient over dates that are merely open.</p>

<p><strong>A self-contained admin panel</strong> — messages, analytics, social links, page-level SEO controls, and a dual-mode login (magic link or password). Deliberately kept independent from the auth-system and Graveyard Jokes admin tooling rather than sharing infrastructure, since this is a distinct client product and the two should not become entangled.</p>

<p>Paline was added to the Graveyard Jokes Studios portfolio on September 5th. It is currently in a soft-launch phase behind a per-person email allowlist rather than a public launch — admins can approve testers one at a time from the admin panel with no redeploy required.</p>

<hr />

<h2>Auth System — Analytics Stopped Lying</h2>

<p>The shared analytics dashboard (used across every project to report site visits back to one place) had a problem that took a while to notice: roughly <strong>91% of recorded traffic was bots</strong>, not people. Scanners probing for <code>.env</code> files, WordPress paths, and actuator endpoints; AI crawlers; old IE/Trident user agents; scripting clients hitting the server directly by IP instead of through a real domain.</p>

<p>Fixing this took several layers stacked on top of each other rather than one clever filter: user-agent pattern matching, a scan-path signature list, loopback and hosting-provider IP detection, and — the one that mattered most — a host-header allowlist. It turns out a large share of the noise was requests hitting the raw server IP or a spoofed Host header for a domain that has nothing to do with any of these sites. Once a client IP is caught behaving like a scanner once, it now gets flagged everywhere, not just on the site where it was caught.</p>

<p>The dashboard itself also got a redesign — collapsible sections, a more compact layout, and a donut chart for traffic breakdown — and the "Top Pages," "Top Cities," and "Potential Clients" panels now order by most recent visit instead of raw count, which surfaces what is happening <em>right now</em> instead of just historical volume.</p>

<hr />

<h2>Graveyard Jokes — Pricing Cleanup and a Platform Removed</h2>

<p>A few smaller but overdue changes to the agency site itself. The intake questionnaire lost its budget field and its gate in front of the PayPal buttons — the checkout is now always reachable, and the questionnaire is optional context rather than a blocker. A Website Maintenance package was added at the low end of the pricing ladder. LinkedIn was wired up as a real social-posting destination alongside the existing platforms.</p>

<p>Twitter/X was removed as a posting platform entirely. Not a policy decision — the API started returning 402 (credits depleted) and paying to keep posting there was not worth it. Discord, Facebook, Instagram, Google Business, and now LinkedIn cover the platforms actually worth the effort.</p>

<hr />

<h2>Studio — Social Media Sync Was Quietly Broken</h2>

<p>This one is close to home, since it is the platform this post is published on. A routine check today turned into a real debugging session once it became clear the Facebook gallery had several independent problems stacked on top of each other.</p>

<p>First: dozens of stored Facebook links were 404ing. The Page had been through an ID change at some point — Meta's Graph API was still returning permalinks pointing at the old, now-nonexistent Page ID, even though the underlying posts were still live under the current one. Every link built from that stale ID was dead on arrival.</p>

<p>Second, once those were fixed, it turned out the gallery had never imported <em>text-only</em> posts at all — the sync command silently skipped anything without an image, which meant a meaningful slice of the actual page history was simply missing from the site.</p>

<p>Third — and the most humbling one — the first fix for the stale-Page-ID problem introduced a new bug of its own. A <code>preg_replace</code> replacement string built as plain interpolated PHP text collided with PHP's own backreference syntax, silently mangling every newly-synced URL in a different way. Caught it, rewrote the fix using <code>preg_replace_callback</code> instead (no ambiguity possible), and cleaned up the handful of posts it had corrupted in the few minutes it was live.</p>

<p>End state: Facebook, Instagram, and TikTok sync are now genuinely automated on a weekly schedule instead of quietly stalling, photo links use the modern share-URL format the Facebook app actually deep-links to, and the text-only posts that were missing are now on the site. Not glamorous work, but the kind that matters more than it looks — a portfolio site whose own social proof section is quietly broken undercuts everything else it is trying to demonstrate.</p>

<hr />

<h2>What Is Next</h2>

<p>Paline needs to come out of soft-launch once there has been enough real tester feedback on the booking flow. The auth-system bot filtering will keep getting refined as new scanner patterns show up. And the plan, same as every time this gets said, is to close the gap between posts — weekly, ideally, starting now.</p>

<p>If you are looking for web development, design, or a platform built the way Paline was — from a five-page site to a real production booking system — <a href="https://graveyardjokes.com">Graveyard Jokes Studios</a> is taking on new clients.</p>

<p><em>— Joshua, Graveyard Jokes Studios</em></p>
HTML;

        DB::table('blog_posts')->updateOrInsert(
            ['slug' => $slug],
            [
                'title' => 'September 2026 — Paline Launches, Bot Filtering Gets Serious, and Facebook Actually Works Now',
                'slug' => $slug,
                'content' => $content,
                'excerpt' => $excerpt,
                'author' => 'Joshua',
                'published_at' => '2026-09-07 15:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('blog_posts')->where('slug', 'september-2026-paline-bot-filtering-facebook-fixes')->delete();
    }
};
