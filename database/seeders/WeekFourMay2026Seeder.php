<?php

namespace Database\Seeders;

use App\Models\BlogPost;
use Illuminate\Database\Seeder;

class WeekFourMay2026Seeder extends Seeder
{
    public function run(): void
    {
        $slug = 'week-four-may-2026';

        $excerpt = 'Noteleks now has a visible spear — the weapon spawns at the character\'s hand '
            .'and tracks the projectile through the air. Hollow Press got an RSS feed. '
            .'And the Graveyard Jokes social dispatcher stopped triple-posting to Facebook.';

        $content = <<<'HTML'
<p>A productive week across several fronts. The headline is Noteleks: the spear is no longer invisible.</p>

<hr />

<h2>Noteleks — The Spear Has a Body</h2>

<p>Last week the spear projectile worked mechanically — it moved, it collided, it did damage. But visually, nothing happened. The invisible physics body was doing its job and leaving no trace. That is fixed now.</p>

<p>The new <code>SpearSprite</code> class is a Phaser <code>Image</code> that spawns at the player's hand position the moment a throw is triggered. Each frame, it reads the position and rotation angle from the physics projectile and moves itself to match — so the sprite and the hitbox are always in sync. When the projectile is destroyed (on collision or timeout), the sprite is destroyed with it.</p>

<p>The more interesting part was the timing. The throw mechanic was triggering the projectile spawn on the frame the spacebar was pressed. That meant the spear appeared while the throw animation was still winding up — before the character's arm had even come down. It looked wrong.</p>

<p>The fix was a <code>scene.time.delayedCall</code> of 266ms — timed to the frame in the Spine animation when Noteleks' hand returns to its resting position after release. The spear does not exist visually until that moment. The result is that the throw looks deliberate: wind up, release, spear in flight.</p>

<p>Six tests were added alongside the new class: creation, facing-direction offsets (the spawn position mirrors when throwing left vs. right), weapon tracking across frames, and double-destroy safety for cases where the sprite outlives its parent.</p>

<hr />

<h2>Hollow Press — RSS Feed</h2>

<p>Hollow Press now has an RSS feed at <code>/feed.rss</code>. It returns the latest 20 blog posts as valid RSS 2.0 — channel metadata, <code>atom:link</code> self-reference, and items with title, link, description, pubDate, and guid. Content fields use CDATA wrapping. The Content-Type header is <code>application/rss+xml</code>.</p>

<p>Autodiscovery is wired into the app layout <code>&lt;head&gt;</code>, so RSS readers that follow the spec will find the feed automatically.</p>

<hr />

<h2>Graveyard Jokes — Facebook Was Triple-Posting</h2>

<p>The social dispatcher on Graveyard Jokes had a race condition. The scheduler runs every minute and fires <code>social:dispatch</code>. If the previous dispatch job had not finished — or if two scheduler ticks overlapped — multiple processes would each query for due posts and find the same ones. The result was Facebook receiving the same post two or three times.</p>

<p>The fix was making the dispatch atomic. The query that fetches due posts now runs inside a <code>DB::transaction</code> with <code>lockForUpdate()</code>, and the first thing it does after claiming a post is transition its status from <code>pending</code> to <code>processing</code>. Any concurrent process that queries for due posts will not see a post already in <code>processing</code> state. The window where a duplicate can slip through is gone.</p>

<p>A secondary command — <code>SocialDispatchResetStuck</code> — handles crash recovery: posts stuck in <code>processing</code> for more than five minutes are reset to <code>pending</code> so they do not silently disappear. It runs on a five-minute schedule.</p>

<p>The sitemap was also repaired in the same session — seven pages were missing, and the file had no priority or changefreq values. Both are set now, and the sitemap regenerates daily via the scheduler.</p>

<hr />

<h2>What Is Next</h2>

<p>Noteleks needs enemy visuals. The enemies spawn and move and deal damage, but they are still rectangles. That is the next art pass. On the Hollow Press side, search and filtering on the blog index has been on the list for a while — that is likely next.</p>

<p>More next week.</p>

<p><em>— Joshua, Graveyard Jokes Studios</em></p>
HTML;

        BlogPost::updateOrCreate(
            ['slug' => $slug],
            [
                'title'        => 'Week Four: Spear, RSS, and a Triple-Post',
                'slug'         => $slug,
                'content'      => $content,
                'excerpt'      => $excerpt,
                'author'       => 'Joshua',
                'published_at' => '2026-05-26 12:00:00',
            ]
        );
    }
}
