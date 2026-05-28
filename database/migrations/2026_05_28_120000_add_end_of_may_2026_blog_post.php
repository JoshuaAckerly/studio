<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $slug = 'end-of-may-2026';

        $excerpt = 'A clean close to May: Hollow Press got a full Projects section with search and filtering, '
            .'three projects got their Ziggy routing fixed, the Graveyard Jokes social batch '
            .'for the rest of the month is seeded, and SynthVeil\'s admin tests are passing.';

        $content = <<<'HTML'
<p>Four weeks of consistent updates. That is what May ended up being. After "Still Here" — which was less an update and more an honest acknowledgment that things had gone quiet — the rhythm came back and held. This is the close of that run.</p>

<hr />

<h2>Hollow Press — Projects Section</h2>

<p>Hollow Press now has a Projects section at <code>/projects</code>. It is a proper portfolio listing — not a static page, but a queryable index backed by a new <code>projects</code> table.</p>

<p>The schema covers what a portfolio entry needs: title, slug, a <code>summary</code> capped at 500 characters for listing cards, a longer <code>description</code> for the detail page, a <code>status</code> enum (<code>active</code>, <code>completed</code>, <code>archived</code>), a <code>year</code>, a JSON <code>tags</code> column, <code>cover_image</code>, <code>project_url</code>, and an <code>is_featured</code> flag. Featured projects sort before everything else.</p>

<p>The index controller handles search and filtering. The search runs a case-insensitive <code>LIKE</code> across title, summary, and description simultaneously — so a search for "Laravel" will surface anything relevant regardless of where the word appears. Status, tag, and year can be combined freely. Results paginate at 12 per page with query strings preserved, so filters survive pagination clicks.</p>

<p>Filter options — the unique tag list and available years — are computed once and cached for ten minutes. On a small-to-medium portfolio they would barely need caching, but the pattern is right: the controller does not re-query the database on every request for data that changes infrequently.</p>

<p>Two React pages were built alongside the controller. The index shows cards with cover images, status badges, and tag chips that act as filter shortcuts — clicking a tag reloads the page with that tag applied. The show page has a sidebar with structured metadata (status, year, tags, external URL) next to the main content area.</p>

<hr />

<h2>Cross-Project — Ziggy Routing</h2>

<p>Ziggy is the package that serialises Laravel's named routes into a JavaScript object so that Inertia's <code>route()</code> helper works on the frontend. Without it, any <code>route('some.route')</code> call in a React component either errors or silently returns an empty string.</p>

<p>Three projects — Lunar Blood, The Velvet Pulse, and Velvet Radio — were missing <code>ziggy-js</code> from their npm dependencies. The PHP side (the Ziggy composer package and the <code>@routes</code> Blade directive) was in place, but the npm package was absent. The fix was straightforward: added <code>ziggy-js</code> to each project's <code>package.json</code>, updated the relevant TypeScript configs, and verified the builds. All three compile clean.</p>

<hr />

<h2>Graveyard Jokes — Social Media Batch</h2>

<p>The scheduler fix from Week Four — the one that stopped Facebook from receiving the same post two or three times — set the stage for this. With the dispatch logic correct, it was worth seeding a proper content batch.</p>

<p>Twenty posts were seeded covering May 26 through 30: four per day across Facebook, Discord, Twitter/X, and Instagram. The content themes step through the week deliberately. The first day promotes the Week Four blog content. The middle days shift to the services pitch — web development, digital marketing, portfolio work. The end of the week closes with pricing and a direct call to action. All posts are set to <code>pending</code> and will be picked up by the scheduler as their scheduled times arrive.</p>

<hr />

<h2>SynthVeil — Admin Test Fix</h2>

<p>A PHPUnit feature test covering the SynthVeil admin dashboard was failing on every run. The test was hitting an auth-protected route without establishing an authenticated session first. The route correctly returned a redirect, the test saw something other than 200, and it failed.</p>

<p>The fix was adding <code>actingAs()</code> with an admin-role user before the request. The test now passes, and the suite is clean.</p>

<hr />

<h2>The Month as a Whole</h2>

<p>May started slowly. "Still Here" was about naming that honestly and committing to a different pace from that point. What followed was four consecutive weeks of output — Velvet Radio live, Lunar Blood's mail system, Noteleks' spear animation, the RSS feed, the social dispatch fix, and now these. That is a decent run.</p>

<p>The goal next month is the same: weekly, no gaps.</p>

<p>If you are looking for web development, design, or digital marketing — <a href="https://graveyardjokes.com">Graveyard Jokes Studios</a> has the services and the portfolio. Reach out.</p>

<p><em>— Joshua, Graveyard Jokes Studios</em></p>
HTML;

        DB::table('blog_posts')->updateOrInsert(
            ['slug' => $slug],
            [
                'title'        => 'End of May — Projects, Routing, and the Batch',
                'slug'         => $slug,
                'content'      => $content,
                'excerpt'      => $excerpt,
                'author'       => 'Joshua',
                'published_at' => '2026-05-28 12:00:00',
                'created_at'   => now(),
                'updated_at'   => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('blog_posts')->where('slug', 'end-of-may-2026')->delete();
    }
};
