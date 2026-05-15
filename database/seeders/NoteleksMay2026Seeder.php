<?php

namespace Database\Seeders;

use App\Models\BlogPost;
use Illuminate\Database\Seeder;

class NoteleksMay2026Seeder extends Seeder
{
    public function run(): void
    {
        $slug = 'noteleks-week-one';

        $excerpt = 'This week I finally started building Noteleks — a browser game I have had in mind for a while. '
            .'Most of the work was not adding features. It was tearing down the ones that were holding everything back.';

        $content = <<<'HTML'
<p>My sister and I have been making music together. We set up practice days this week — actual scheduled time, not just "we should do this sometime." We are building a setlist. It is early, but having a structure around it changes how it feels. Something is starting to take shape there.</p>

<p>On the development side, this week belonged entirely to Noteleks.</p>

<hr />

<h2>What Noteleks Is</h2>

<p>Noteleks is a browser-based game I have been planning to build for a while. The stack is Laravel 12 on the backend and Phaser.js for the game engine — everything runs in the browser, with Laravel handling routing, templating, and eventually game state persistence. The name is "skeleton" spelled backwards. That tells you most of what you need to know about the aesthetic.</p>

<p>The basic idea: you control a skeleton character navigating rooms, fighting enemies, surviving rounds. Think dungeon crawler, browser-native, built from scratch.</p>

<p>I pushed the initial commit today. But most of the week was not adding new things — it was cleaning up the mess that had accumulated during early prototyping.</p>

<hr />

<h2>The Refactoring</h2>

<p>The Player class was the problem. It had grown to over a thousand lines: debug overlays baked into movement logic, a Spine animation system that added manifest dependencies the project did not actually need, watchdog timers, fallback systems layered on top of other fallback systems. It worked, barely, but adding anything new meant digging through all of that first.</p>

<p>I cut it down to around three hundred lines. Removed the Spine system entirely and replaced it with WebP frame-based animations — idle, run, jump, attack, jump attack. Each animation has its own FPS setting. The whole thing is simpler and easier to reason about.</p>

<p>The bigger change was extraction. Instead of one class doing everything, I pulled each concern into its own manager:</p>

<ul>
  <li><strong>AnimationManager</strong> — handles animation state transitions</li>
  <li><strong>InputHandler</strong> — centralized keyboard input (WASD, arrows, space)</li>
  <li><strong>PhysicsManager</strong> — collision detection and knockback forces</li>
  <li><strong>EntityFactory</strong> — template-based entity creation so spawning enemies is not copy-paste</li>
  <li><strong>EnemyManager</strong> — enemy lifecycle, round-based spawning</li>
</ul>

<p>The architecture is component-based now — a proper ECS pattern with a <code>GameObject</code> base class, reusable <code>Component</code> behaviors, and a <code>SystemManager</code> coordinating everything. It is the kind of foundation you want before the game gets complicated, not after.</p>

<hr />

<h2>Where the Game Stands</h2>

<p>After the cleanup, here is what is actually working:</p>

<ul>
  <li>Player movement and jumping — direct keyboard controls, no input lag</li>
  <li>WebP frame animations synced to movement state</li>
  <li>Melee attack with a proper hitbox and a 500ms cooldown</li>
  <li>Enemy spawning — zombie, skeleton, ghost, and boss types</li>
  <li>Knockback physics when enemies are hit</li>
  <li>Round-based wave system that escalates difficulty</li>
  <li>Score tracking and HUD display</li>
  <li>Debug mode with visible collision boundaries</li>
</ul>

<p>The weapon system has a framework in place — spear, dagger, fireball, arrow, magic bolt are all stubbed — but none of them fire projectiles yet. That is the next real feature push.</p>

<hr />

<h2>What Is Next</h2>

<p>Room generation. Right now the game runs on a flat stage. The next step is procedural room layouts — floor tiles, walls, and platforms that are different every session. That is what turns this from a tech demo into something that has replayability.</p>

<p>More next week.</p>

<p><em>— Joshua, Graveyard Jokes Studios</em></p>
HTML;

        BlogPost::updateOrCreate(
            ['slug' => $slug],
            [
                'title'        => 'Noteleks — Week One',
                'slug'         => $slug,
                'content'      => $content,
                'excerpt'      => $excerpt,
                'author'       => 'Joshua',
                'published_at' => '2026-05-15 12:00:00',
            ]
        );
    }
}
