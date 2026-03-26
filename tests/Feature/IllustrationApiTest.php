<?php

namespace Tests\Feature;

use App\Models\FacebookGalleryPost;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class IllustrationApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        DB::table('facebook_gallery_posts')->delete();
    }

    protected function tearDown(): void
    {
        DB::table('facebook_gallery_posts')->delete();
        parent::tearDown();
    }

    public function test_api_returns_empty_data_when_no_posts(): void
    {
        $response = $this->getJson('/api/illustrations');

        $response->assertStatus(200)
            ->assertJson(['data' => []]);
    }

    public function test_api_returns_active_posts_only(): void
    {
        FacebookGalleryPost::create([
            'post_url' => 'https://facebook.com/page/posts/1',
            'title' => 'Active Post',
            'is_active' => true,
            'sort_order' => 0,
        ]);

        FacebookGalleryPost::create([
            'post_url' => 'https://facebook.com/page/posts/2',
            'title' => 'Inactive Post',
            'is_active' => false,
            'sort_order' => 0,
        ]);

        $response = $this->getJson('/api/illustrations');

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertCount(1, $data);
        $this->assertSame('Active Post', $data[0]['title']);
    }

    public function test_api_response_shape(): void
    {
        FacebookGalleryPost::create([
            'post_url' => 'https://facebook.com/graveyardjokes/posts/99',
            'title' => 'Fantasy Art',
            'description' => 'A detailed piece',
            'tags' => ['art', 'fantasy'],
            'thumbnail_url' => 'https://cdn.test/thumb.jpg',
            'posted_at' => '2026-03-01',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $response = $this->getJson('/api/illustrations');

        $response->assertStatus(200);
        $item = $response->json('data.0');

        $this->assertArrayHasKey('id', $item);
        $this->assertArrayHasKey('title', $item);
        $this->assertArrayHasKey('description', $item);
        $this->assertArrayHasKey('tags', $item);
        $this->assertArrayHasKey('url', $item);
        $this->assertArrayHasKey('embed_url', $item);
        $this->assertArrayHasKey('thumbnail_url', $item);
        $this->assertArrayHasKey('date', $item);

        $this->assertSame('Fantasy Art', $item['title']);
        $this->assertSame('2026-03-01', $item['date']);
        $this->assertSame(['art', 'fantasy'], $item['tags']);
        $this->assertStringContainsString('plugins/post.php', $item['embed_url']);
    }

    public function test_api_orders_by_sort_order_then_posted_at_desc(): void
    {
        FacebookGalleryPost::create([
            'post_url' => 'https://facebook.com/page/posts/1',
            'title' => 'Second',
            'posted_at' => '2026-01-01',
            'is_active' => true,
            'sort_order' => 2,
        ]);

        FacebookGalleryPost::create([
            'post_url' => 'https://facebook.com/page/posts/2',
            'title' => 'First',
            'posted_at' => '2026-03-01',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $response = $this->getJson('/api/illustrations');
        $data = $response->json('data');

        $this->assertSame('First', $data[0]['title']);
        $this->assertSame('Second', $data[1]['title']);
    }

    public function test_api_date_falls_back_to_created_at_when_posted_at_null(): void
    {
        FacebookGalleryPost::create([
            'post_url' => 'https://facebook.com/page/posts/3',
            'title' => 'No Date',
            'posted_at' => null,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $response = $this->getJson('/api/illustrations');
        $item = $response->json('data.0');

        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}$/', $item['date']);
    }
}
