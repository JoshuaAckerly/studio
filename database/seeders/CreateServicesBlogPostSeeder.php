<?php

namespace Database\Seeders;

use App\Models\BlogPost;
use Illuminate\Database\Seeder;

class CreateServicesBlogPostSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        BlogPost::create([
            'title' => 'Expanding Our Services: Introducing Website Design & Modernization Packages',
            'slug' => 'expanding-services-design-modernization',
            'excerpt' => 'We\'ve been busy! Graveyard Jokes Studios is now offering specialized Website Design and Website Modernization services alongside our core web development packages. Here\'s what\'s new and what we\'ve been working on.',
            'author' => 'Joshua Ackerly',
            'content' => '<h2>It\'s been a whirlwind of development!</h2>

<p>I\'m excited to announce that Graveyard Jokes Studios has officially expanded its service offerings. After listening to feedback from our creative community and analyzing market needs, we\'ve launched two new service categories to complement our original web development packages.</p>

<h3>What\'s New</h3>

<h4>Website Design Services</h4>
<p>For creatives who need design expertise <strong>before</strong> development begins, we\'re now offering dedicated design packages:</p>
<ul>
  <li><strong>Design Starter ($199)</strong> — Wireframes, mockups, and brand identity foundation</li>
  <li><strong>Design Professional ($349)</strong> — Complete UI design system with interactive prototypes and full brand guidelines</li>
  <li><strong>Design Premium ($499)</strong> — Premium brand identity with custom illustrations, accessibility audits, and ongoing design consultation</li>
</ul>

<h4>Website Modernization Services</h4>
<p>For creators with existing websites that need updating, we\'ve built modernization packages to breathe new life into your online presence:</p>
<ul>
  <li><strong>Modernization Starter ($249)</strong> — Visual refresh, responsiveness updates, and performance optimization basics</li>
  <li><strong>Modernization Professional ($399)</strong> — Complete design & code refresh with modern framework updates and accessibility compliance</li>
  <li><strong>Modernization Premium ($599)</strong> — Full tech stack migration, advanced security, analytics setup, and strategic partnership</li>
</ul>

<p>Of course, our original <strong>Website Development</strong> packages (Starter, Professional, Premium) are still available and remain our core offering.</p>

<h3>Behind the Scenes</h3>

<p>This expansion didn\'t happen overnight. Over the past month, I\'ve been:</p>

<ul>
  <li>🎨 <strong>Researching the market</strong> — Understanding what creative professionals actually need when they\'re building or updating their online presence</li>
  <li>💻 <strong>Architecting the infrastructure</strong> — Building out the backend systems to support multiple service types with seamless intake forms and payment processing</li>
  <li>🎯 <strong>Refining the pricing</strong> — Creating tiered packages that represent real value at every price point</li>
  <li>📱 <strong>Redesigning the services page</strong> — Organizing nine distinct packages in a way that\'s easy to navigate and understand</li>
  <li>🔧 <strong>Expanding the intake system</strong> — Each service type now has its own questionnaire to capture the right information upfront</li>
</ul>

<h3>The Strategy</h3>

<p>Every service tier (Starter, Professional, Premium) now appears across three categories:</p>

<ul>
  <li><strong>Website Development</strong> — For building new sites from scratch</li>
  <li><strong>Website Design</strong> — For design-first projects where visuals come before code</li>
  <li><strong>Website Modernization</strong> — For breathing new life into existing websites</li>
</ul>

<p>This gives creators flexibility. Whether you\'re launching your first site, completely redesigning your online presence, or updating legacy technology, there\'s a package that fits your needs.</p>

<h3>What This Means for You</h3>

<p>If you\'ve been thinking about your online presence — whether that\'s a brand-new website, a design overhaul, or modernizing outdated code — now is a great time to reach out. Each new service comes with the same commitment to quality, responsiveness, and supporting the creative community that Graveyard Jokes Studios was built on.</p>

<p>All services include a comprehensive pre-payment intake form to ensure we understand your vision before we begin. Payment is handled securely through PayPal, with support included every step of the way.</p>

<h3>What\'s Next</h3>

<p>I\'m constantly evolving the studio based on feedback and market trends. Whether it\'s adding new integrations, expanding into video production, or creating tools specifically for musicians and visual artists, the mission remains the same: <strong>help creative professionals succeed online without the corporate nonsense.</strong></p>

<p>Have an idea for a service we should offer? Want to collaborate? <a href="https://graveyardjokes.com/contact">Reach out</a> — I read every message.</p>

<p>— Joshua Ackerly<br>
Graveyard Jokes Studios</p>',
            'published_at' => now(),
        ]);
    }
}
