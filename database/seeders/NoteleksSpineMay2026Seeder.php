<?php

namespace Database\Seeders;

use App\Models\BlogPost;
use Illuminate\Database\Seeder;

class NoteleksSpineMay2026Seeder extends Seeder
{
    public function run(): void
    {
        $slug = 'noteleks-spine-live-may-2026';

        $excerpt = 'Noteleks now runs the Spine animated skeleton character in production — on desktop and mobile. '
            .'Getting there required fixing three separate bugs that had been stacked on top of each other, '
            .'and then fixing a fourth one on mobile that nobody mentioned until the character was finally visible.';

        $content = <<<'HTML'
<p>Noteleks has been live for a few weeks. The core game loop worked — enemies spawn, platforms hold, the physics feel right. But the player character was invisible. Not "we need better art" invisible. Genuinely not there. A red box in the corner of the screen and controls that appeared broken because you could not see what you were controlling.</p>

<p>This week I fixed it. All of it. The character is now visible, animated with actual Spine skeletal animation, and working correctly on both desktop and mobile. Here is how that actually happened.</p>

<hr />

<h2>Why the Player Was Invisible</h2>

<p>The root cause was a method called <code>_ensurePlayerAnimatedFallback()</code>. Its job was to create a visible stand-in for the player if Spine failed to load. Reasonable intent. Broken execution.</p>

<p>The method checked whether a <code>player-idle</code> animation existed in Phaser's animation registry. If it did, it assumed Spine had failed and created a static fallback sprite at a fixed world position — then called <code>setVisible(false)</code> on the actual physics sprite to hide it.</p>

<p>The problem: the game creates <code>player-idle</code> as a placeholder animation using a red rectangle texture during initialization. So the check always returned true. The fallback always ran. The physics sprite was always hidden. The fallback sprite sat at coordinates (200, 400) and did not move, because it had no physics body. The camera followed the invisible physics sprite. The visible fallback was left behind.</p>

<p>The fix was a guard at the top of that method: if <code>spineObject</code> is null, just make sure the physics sprite is visible and return. No fallback creation. The physics sprite is already the visual. Let it be that.</p>

<hr />

<h2>Why Spine Was Not Loading</h2>

<p>With that fixed, the player was visible — but as a red box, not an animated skeleton. Spine still was not loading.</p>

<p>The Spine plugin is bundled as a dynamic import chunk by Vite. The game loads Phaser from a CDN as a classic <code>&lt;script&gt;</code> tag, which sets <code>window.Phaser</code> as a global. The Vite config marked <code>phaser</code> as an external dependency with a globals mapping — the intention being that references to the <code>phaser</code> package inside the Spine chunk would resolve to <code>window.Phaser</code> at runtime.</p>

<p>That only works for IIFE and UMD output formats. Vite's default output is ES modules. In ESM, Rollup ignores the <code>globals</code> option entirely and emits the external import as a bare specifier: <code>import * as Phaser from 'phaser'</code>. Browsers cannot resolve bare specifiers without an import map. So the Spine chunk threw an error on every load: <em>Failed to resolve module specifier "phaser".</em> The error was caught silently and Spine was marked as failed.</p>

<p>The fix was to stop marking <code>phaser</code> as external and instead alias it to a small shim file. The shim reads <code>globalThis.Phaser</code> — which is available by the time the Spine chunk is dynamically imported, since the bootstrap code waits for <code>window.Phaser</code> before importing anything — and re-exports every Phaser namespace as a named export. Spine imports <code>* as Phaser from 'phaser'</code>, gets the shim's namespace object, and <code>Phaser.GameObjects</code>, <code>Phaser.Plugins</code>, and everything else it needs are all there.</p>

<p>After that change, the Spine plugin loaded. The animated skeleton appeared. The game looked like a game.</p>

<hr />

<h2>Why Mobile Still Showed a Red Box</h2>

<p>The desktop fix worked. On mobile, still a red box.</p>

<p>The game has a low-quality mode that skips the Spine plugin to save resources on weaker devices. The detection logic checked three things: available RAM, CPU core count, and screen width. The screen width condition flagged any iPhone or Android device with a viewport narrower than 420 CSS pixels.</p>

<p>Every modern iPhone has a CSS pixel width between 375 and 430 pixels. Every Android phone is in the same range. So every phone was being detected as a low-end device, regardless of whether it actually was one. The Spine plugin was skipped. The red box appeared.</p>

<p>Removing that condition was a one-line fix. Low-quality mode now only activates on devices with confirmed hardware limits — under 2 GB of RAM or two or fewer CPU cores. Screen width tells you nothing about whether a device can handle skeletal animation.</p>

<hr />

<h2>Why the Attack Button Did Not Work on Mobile</h2>

<p>Once Spine was working and the character was visible, a fourth issue surfaced: the attack button on the mobile touch controls did nothing.</p>

<p>The touch controls create a DOM button that sets <code>touchState.attack = true</code> on press and <code>false</code> on release. The input system merges keyboard and touch state into a unified <code>inputState</code> object. <code>inputState.attack</code> was being computed correctly.</p>

<p>But the spear-throw mechanic — the actual attack logic — never reads <code>inputState.attack</code>. It reads <code>this.keys.SPACE.isDown</code> directly. The keyboard spacebar was hardcoded in. The touch state was merged but ignored.</p>

<p>The fix was a single additional line before the attack logic runs: read the touch attack state from the input manager and OR it with the spacebar state. Now tapping the attack button on mobile triggers a quick throw. Holding it charges the throw before releasing — the same behavior as holding and releasing spacebar on desktop.</p>

<hr />

<h2>Where Noteleks Stands Now</h2>

<p>The game is running correctly in production. The Spine skeleton character is visible, animated, and moving with physics. The mobile controls work — movement, jump, and attack. The fallback red box still appears if Spine genuinely fails to load on a weak device, but it is now a visible fallback that responds to controls rather than an invisible physics body that looks like the game is broken.</p>

<p>Next up: enemy visuals, more animation states, and the first pass at a scoring system.</p>

<p>More next week.</p>

<p><em>— Joshua, Graveyard Jokes Studios</em></p>
HTML;

        BlogPost::updateOrCreate(
            ['slug' => $slug],
            [
                'title'        => 'Noteleks: Getting the Skeleton Visible',
                'slug'         => $slug,
                'content'      => $content,
                'excerpt'      => $excerpt,
                'author'       => 'Joshua',
                'published_at' => '2026-05-21 12:00:00',
            ]
        );
    }
}
