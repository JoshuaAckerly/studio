<?php

namespace Database\Seeders;

use App\Models\BlogPost;
use Illuminate\Database\Seeder;

class WeekTwoMay2026Seeder extends Seeder
{
    public function run(): void
    {
        $slug = 'velvet-radio-live-may-2026';

        $excerpt = 'This week Velvet Radio shipped a working audio player and real radio streaming infrastructure — '
            .'Icecast, Liquidsoap, a live stream deployed to EC2 and verified in production. '
            .'Lunar Blood got a proper mail system and full test coverage to match.';

        $content = <<<'HTML'
<p>Two projects shipped real features this week. The kind that change what the sites actually do, not just how they look. That felt good.</p>

<hr />

<h2>Velvet Radio — Going Live</h2>

<p>Velvet Radio now has a working audio player. I built it as a native HTML5 component in React — play and pause, a seek bar, current time and total duration, volume control and mute. It sits as a fixed bar at the bottom of the page so it stays visible while browsing. The episodes page was wired up at the same time: each episode now carries an <code>audio_url</code>, and clicking Play loads it directly into the player. If an episode has no audio file attached, the Play button is disabled rather than broken.</p>

<p>That was the frontend half. The infrastructure side was more involved.</p>

<p>I set up <strong>Icecast</strong> as the streaming server — configured with a <code>/live</code> mount point, environment-substituted passwords, and a listener cap. Behind it, <strong>Liquidsoap</strong> handles what actually gets streamed: a fallback playlist that pulls <code>.mp3</code> files from <code>storage/audio/fallback/</code> when nothing is live, and a live input on port 8001 that takes over when a source connects. Liquidsoap runs as a systemd service with auto-restart on failure. The whole thing sits behind an nginx reverse proxy.</p>

<p>The AudioPlayer component got a <code>streamUrl</code> prop added — when it is set, a LIVE badge appears and the player streams from that URL instead of a file. The new <code>listen.tsx</code> page uses this to point directly at <code>/stream</code>.</p>

<p>All of it is deployed to EC2. The <code>/stream</code> endpoint returns 200. The Icecast admin shows both <code>/live</code> and <code>/fallback</code> active. Velvet Radio is a working internet radio station now.</p>

<hr />

<h2>Lunar Blood — Mail and Tests</h2>

<p>Lunar Blood had a few rough edges in its error handling. The shows delete action and the checkout page were both managing error state inline — local component state that would get out of sync or silently fail. Both are now wired into the toast system: errors surface as dismissible notifications instead of state that has to be manually cleared.</p>

<p>The bigger addition was the mail system. Two new Mailables: <code>ContactFormMail</code>, which captures sender name, email address, and message body from the contact form, and <code>OrderConfirmationMail</code>, which goes out after a successful payment with customer name, order ID, product name, and total. Both have Blade text templates. The API routes on <code>/api/contact</code> and <code>/api/process-payment</code> now dispatch the appropriate Mailable after processing.</p>

<p>Four new mail tests were added to cover the send paths and template rendering. The full test suite is at 63/63.</p>

<hr />

<h2>What Is Next</h2>

<p>Hollow Press has an RSS feed queued — it is the next feature up. On the Noteleks side, the spear now fires a projectile; the visual sprite attachment is what comes next.</p>

<p>More next week.</p>

<p><em>— Joshua, Graveyard Jokes Studios</em></p>
HTML;

        BlogPost::updateOrCreate(
            ['slug' => $slug],
            [
                'title' => 'Velvet Radio Is Live',
                'slug' => $slug,
                'content' => $content,
                'excerpt' => $excerpt,
                'author' => 'Joshua',
                'published_at' => '2026-05-20 12:00:00',
            ]
        );
    }
}
