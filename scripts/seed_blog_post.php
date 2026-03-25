<?php

use App\Models\BlogPost;

$content = '<p>The last few weeks have been heads-down in the best possible way. No single big launch — just a lot of small, deliberate improvements across the whole portfolio, plus some new client-facing work that is starting to take real shape. Here is a full snapshot of what I have been working on.</p>

<h2>Built a Blog (You Are Reading It)</h2>
<p>The most meta thing I can say is that this post would not exist without the work I did to build it. I added a full blog section to Studio — a Laravel controller, a clean index and show page, and the database migration to back it all up. Writing code and writing words are not as different as people think. Both require structure. Both require you to know what you are trying to say before you say it.</p>

<h2>Graveyard Jokes is Now Listed on DesignRush</h2>
<p>Graveyard Jokes Studios — the agency side of this portfolio — is now live on DesignRush, a premier agency directory used by businesses to vet and hire web agencies. The listing covers the full service range: web design and development, eCommerce builds, SEO, digital marketing, and ongoing maintenance. Rate is $15/hr with a sub-$1,000 minimum budget, which keeps it accessible to the small businesses and creatives the agency is built for. All five portfolio clients are listed — Hollow Press, Lunar Blood, The Velvet Pulse, Velvet Radio, and Synth Veil — which adds social proof and backlink authority at the same time. This is a meaningful step toward building a credible, searchable business identity rather than just a collection of projects.</p>

<h2>Portfolio Page Rebuilt From Scratch</h2>
<p>The portfolio page on graveyardjokes.com was a flat list of project cards with short one-liners. I rebuilt it into something that actually sells the work. Each project now has a full paragraph description explaining what was built and why it matters, a tech stack breakdown shown as styled tags (Laravel, React, Stripe, Framer Motion, Web Audio API, and so on), a category label, and a year. The page itself gained a stats bar at the top — 5 Projects Shipped, 100% Custom Built, 2026, $0 Page Builders — and splits into a Featured section for the most active projects and an All Projects grid below. The card design was updated too: image zoom on hover, a visible "Visit site →" CTA, and better hierarchy between the title, short description, and deep description. It reads like a portfolio now instead of a list.</p>

<h2>SEO Service Card Added to the Homepage</h2>
<p>The services section on the homepage already mentioned SEO in passing. I turned it into a proper dedicated card — the seventh service in the grid — explaining what is included on every build by default (semantic markup, fast load times, structured data, mobile-first indexing) and what a dedicated SEO package adds on top (keyword research, meta strategy, monthly reporting). The section tagline was updated from the generic "SEO optimization" to "on-page SEO, structured data markup, and lightning-fast performance — so you rank higher from day one." Small copy changes, but they signal expertise rather than just listing a checkbox.</p>

<h2>Starter Package: Limited-Time Promo with Real Checkout</h2>
<p>The homepage has had a "Limited Time — First 5 Clients Only" promo block for a while, showing the full website build discounted from $199 down to $150. The problem was that the "Grab Your Spot" button went to the contact form — a dead end for anyone ready to actually pay. I wired the whole thing up properly. The button now links directly to the Starter Package page, which shows the promo badge, the crossed-out $199 and bold $150 price, and a note that only five spots are available at this price. The PayPal checkout button — which was already built and gated behind the intake questionnaire — now fires at $150 instead of $199. The intake questionnaire collects project details before payment unlocks, which protects both sides of the transaction. The purchase flow is now end-to-end: homepage promo → package page → questionnaire → PayPal checkout.</p>

<h2>Bug Fix: Let\'s Talk Button</h2>
<p>The large "Let\'s talk" button on the homepage was broken. It was calling <code>router.visit(getProjectUrl(\'graveyardjokes\'))</code>, which resolves to <code>https://graveyardjokes.graveyardjokes.com</code> — a subdomain that does not exist. Nobody would have landed anywhere useful by clicking it. Fixed to <code>router.visit(\'/contact\')</code>. Simple fix, but it was sitting on the most visible CTA on the entire homepage.</p>

<h2>Cross-Site Visit Tracking</h2>
<p>I rolled out a shared analytics layer across every site in the portfolio — GraveYardJokes, HollowPress, Lunar Blood, Velvet Radio, and the rest. Each site now reports visits back to a central auth-system, so I can see traffic patterns across the whole network in one place rather than logging into N dashboards. It is a small architectural win that will pay dividends as the portfolio grows.</p>

<h2>Google AdSense Integration</h2>
<p>Monetisation is not something I talk about much, but it is a real part of running sites. I wired up AdSense across several projects. Nothing intrusive — just a foundation so that when the traffic is there, the infrastructure is ready.</p>

<h2>Messaging System Integration</h2>
<p>I connected a messaging system to GraveYardJokes and HollowPress. Contact forms that actually deliver, a CTA section that invites people to reach out, and a cleaner flow from "interested visitor" to "real conversation." This one matters because the best client relationships I have had started with a single message.</p>

<h2>HollowPress: Related Posts and Mobile Nav</h2>
<p>HollowPress got two quality-of-life upgrades. First, a related posts feature — when you finish reading something, the site now surfaces other posts you might care about rather than leaving you at a dead end. Second, a proper mobile navigation menu with a hamburger toggle. It sounds basic, but getting mobile navigation right is one of those things that separates sites that feel polished from sites that feel like someone stopped halfway.</p>

<h2>Noteleks: Manifest-Driven Asset Loading</h2>
<p>The game project got a meaningful refactor. I replaced a fragile, probe-based asset loader with a clean manifest-driven system. Assets are declared up front, loaded in two stages (manifest first, then assets), and the whole thing is backed by unit tests. Spine animations and per-frame WebP fallbacks are now deterministic — they load the same way every time, on every device. That kind of reliability is what separates a prototype from something you can ship.</p>

<h2>CI and Dependency Hygiene</h2>
<p>Boring work, important work. I added caching, concurrency controls, and <code>npm ci</code> to the CI pipelines across several projects. Patched <code>league/commonmark</code> after a pair of CVEs dropped. Regenerated PHPStan baselines. None of this shows up in a demo, but it is the difference between a codebase that stays healthy and one that slowly rots.</p>

<h2>Deployment Workflow</h2>
<p>Every change across the portfolio now goes through a consistent deploy pipeline: commit locally, push to GitHub, SSH into the EC2 instance, pull the latest code, run <code>composer install</code> and <code>npm ci</code>, build the Vite frontend and SSR bundle, run migrations, cache Laravel config/routes/views, restart PHP-FPM, and restart the PM2 processes for SSR and queue workers. The whole thing takes about 90 seconds and is scripted so nothing gets missed. Twelve PM2 processes running across six projects, all online, all monitored.</p>

<h2>What Is Next</h2>
<p>The Noteleks game still has a lot of ground to cover — a particle system, a sound manager, and a proper spear-throwing mechanic are all on the list. HollowPress keeps growing. The DesignRush listing needs reviews, so if you have worked with me in any capacity, that is the most useful thing you can do right now. And I want to write more here, because the process of explaining what you built forces you to understand why you built it.</p>

<p>If any of this is relevant to something you are working on, you know where to find me.</p>';

$post = \App\Models\BlogPost::where('slug', 'what-i-have-been-building-lately')->first();

if ($post) {
    $post->update([
        'content'      => $content,
        'excerpt'      => 'A full roundup of recent work: DesignRush listing, portfolio page rebuild, SEO service card, starter package promo with real PayPal checkout, a Let\'s Talk bug fix, cross-site analytics, HollowPress upgrades, Noteleks refactoring, and the quieter work of keeping codebases healthy.',
        'published_at' => now(),
    ]);
    echo "Blog post updated.\n";
} else {
    \App\Models\BlogPost::create([
        'title'        => 'What I Have Been Building Lately',
        'slug'         => 'what-i-have-been-building-lately',
        'content'      => $content,
        'excerpt'      => 'A full roundup of recent work: DesignRush listing, portfolio page rebuild, SEO service card, starter package promo with real PayPal checkout, a Let\'s Talk bug fix, cross-site analytics, HollowPress upgrades, Noteleks refactoring, and the quieter work of keeping codebases healthy.',
        'author'       => 'Joshua Ackerly',
        'published_at' => now(),
    ]);
    echo "Blog post created.\n";
}
