<?php

namespace Database\Seeders;

use App\Models\BlogPost;
use Illuminate\Database\Seeder;

class StudioDevlogApril2026Seeder extends Seeder
{
    public function run(): void
    {
        $slug = 'studio-devlog-spring-2026';

        $excerpt = 'Spring 2026 has been a busy season for Studio. '
            . 'We shipped a blog platform, a live video gallery, an illustration showcase, '
            . 'and finished a major refactor of the Noteleks game engine — all while keeping '
            . 'everything compiling clean across seven projects.';

        $content = <<<'HTML'
<p>Spring 2026 has been heads-down and productive. If you've been following along, you know Studio started as a blank canvas — a place to eventually centralize art, music, games, and writing. Over the past several weeks it's become a real, working site. Here's a look at what got built and why.</p>

<hr />

<h2>The Blog You're Reading Right Now</h2>

<p>The most meta thing first: this blog didn't exist a few weeks ago. At the end of March I built the entire publishing system from the ground up — database table, controller, listing page, and this post detail view you're looking at right now.</p>

<p>It's intentionally simple. Posts have a title, a slug, an author, an excerpt, a featured image, and a <code>published_at</code> date that acts as a draft gate. Nothing is published until that date is set and in the past; drafts sit invisible in the database until they're ready. The listing page shows cards sorted newest-first. The detail page renders full HTML content — which is how I can do things like headings, links, and code blocks right in the post.</p>

<p>Starting simple and building on top of a working foundation beats designing the perfect CMS up front. The blog is live. That's the point.</p>

<hr />

<h2>Video Gallery — TikTok + S3</h2>

<p>Studio has a Video Log page now. It pulls from two sources: a database-backed TikTok feed (where I track video IDs, thumbnails, and post types) and a direct S3 bucket scan as a fallback. The page displays a grid of video cards, and clicking one opens a modal viewer with inline playback — TikTok embeds for social content, an HTML5 player for anything hosted directly.</p>

<p>The two-source architecture was a deliberate choice. TikTok embeds are great when your content is on the platform and you want the engagement loop, but if something ever gets pulled or the platform changes its embed policy, the S3 fallback means the gallery keeps working. The database table tracks sort order and an <code>is_active</code> flag so I can hide specific videos without deleting them.</p>

<hr />

<h2>Illustration Gallery — Facebook + S3</h2>

<p>Same idea, different medium. The Illustrations page pulls from a Facebook gallery posts table (synced from posts I've made on the page) and from an S3 prefix scan for direct uploads. Each card shows a title, description, tags, and a date. If the source file is a GIF, hovering the card previews the animation inline before you click. Clicking opens a full-size modal.</p>

<p>The tags system is stored as a JSON array on each row, which keeps the schema simple while giving enough structure to eventually filter by medium, style, or project. For now the gallery is visual and browseable. Filtering comes later when there's enough content to warrant it.</p>

<hr />

<h2>Homepage — The Creative Hub</h2>

<p>The homepage is structured around four creative areas: <strong>Music</strong>, <strong>Visual Art</strong>, <strong>Games</strong>, and <strong>Video Log</strong>. Each section has a brief intro and a link into the relevant part of the site. There's also a "What I'm Working On" block that gives visitors a live sense of what's actively in progress rather than just a static portfolio grid.</p>

<p>The FAQ section at the bottom answers questions I actually get — things like what tools I use, how I approach aesthetics across different projects, and what the philosophy behind Studio is. Writing those out forced me to articulate things I usually just do instinctively, which was useful.</p>

<hr />

<h2>Noteleks — Game Engine Refactor</h2>

<p>The most technically involved work this spring was on <strong>Noteleks</strong>, a 2D action platformer that's been in R&D under Studio. The old asset loading system was fragile — it probed for files by guessing paths, fell back on timeouts, and had race conditions that made animations load inconsistently.</p>

<p>I replaced the whole thing with a <strong>manifest-driven asset loader</strong>. At build time a manifest is generated with every texture, animation, and sprite listed explicitly. At runtime the loader reads the manifest and queues assets in two stages: first the manifest itself, then the assets it describes. The loading screen reflects both stages with a proper progress indicator — you see it move from "Loading manifest..." to "Loading assets..." rather than a fake spinner that jumps to 100%.</p>

<p>Spine animations (skeletal 2D animations for characters) are now created deterministically. The old system occasionally produced different animation states depending on load order. The refactor ensures the same input always produces the same animated output.</p>

<p>I also wrote unit tests for the <code>AssetManager</code> frame queuing logic — these didn't exist before and the lack of coverage was part of why the regressions were hard to catch. The test suite now covers manifest parsing, animation alias creation, and the two-phase preload sequence.</p>

<p>There's a README in the game directory now that explains the runtime asset-loading strategies and how to rebuild sprite manifests if the source art changes. This is the kind of documentation that pays off the moment a future-me (or anyone else) needs to touch the build pipeline and doesn't remember how it works.</p>

<hr />

<h2>Under the Hood — TypeScript + SSR Stability</h2>

<p>Studio is one of seven projects in my portfolio and they all share a TypeScript configuration baseline. Earlier this year there were compilation errors cascading through several of them. By late March, all seven projects compiled with zero TypeScript errors. Studio was part of that cleanup — fixing type issues, aligning the <code>tsconfig</code> inheritance, and stabilizing the Inertia SSR server so React hooks don't throw on the first server-side render.</p>

<p>This is unglamorous work but it matters. A codebase where you can't run <code>npm run types</code> and get a clean exit is a codebase that's accumulating hidden risk. All seven projects are clean now.</p>

<hr />

<h2>What's Next</h2>

<p>The site is functional and the foundations are solid. The next phase is putting more real content into it — uploading art, publishing writing, and expanding the Noteleks game toward something playable. The infrastructure exists to support all of that. Now it's about filling it in.</p>

<p>More soon.</p>

<p><em>— Joshua, Graveyard Jokes Studios</em></p>
HTML;

        BlogPost::updateOrCreate(
            ['slug' => $slug],
            [
                'title'        => "What We've Been Building — Studio Devlog, Spring 2026",
                'slug'         => $slug,
                'content'      => $content,
                'excerpt'      => $excerpt,
                'author'       => 'Joshua',
                'published_at' => now(),
            ]
        );
    }
}
