<?php

namespace Tests\Unit;

use App\Models\FacebookGalleryPost;
use Tests\TestCase;

class FacebookGalleryPostTest extends TestCase
{
    public function test_embed_url_attribute_builds_facebook_plugin_url(): void
    {
        $post = new FacebookGalleryPost([
            'post_url' => 'https://www.facebook.com/graveyardjokes/posts/123456',
        ]);

        $expected = 'https://www.facebook.com/plugins/post.php?href='
            . urlencode('https://www.facebook.com/graveyardjokes/posts/123456')
            . '&width=500&show_text=false';

        $this->assertSame($expected, $post->embed_url);
    }

    public function test_embed_url_encodes_special_characters(): void
    {
        $post = new FacebookGalleryPost([
            'post_url' => 'https://www.facebook.com/page/posts/abc?foo=bar&baz=1',
        ]);

        $this->assertStringContainsString(
            urlencode('https://www.facebook.com/page/posts/abc?foo=bar&baz=1'),
            $post->embed_url
        );
    }

    public function test_tags_cast_to_array(): void
    {
        $post = new FacebookGalleryPost(['tags' => ['art', 'illustration', 'fantasy']]);

        $this->assertIsArray($post->tags);
        $this->assertContains('art', $post->tags);
    }

    public function test_tags_null_by_default(): void
    {
        $post = new FacebookGalleryPost([]);

        $this->assertNull($post->tags);
    }

    public function test_is_active_cast_to_boolean(): void
    {
        $active   = new FacebookGalleryPost(['is_active' => 1]);
        $inactive = new FacebookGalleryPost(['is_active' => 0]);

        $this->assertTrue($active->is_active);
        $this->assertFalse($inactive->is_active);
    }

    public function test_posted_at_cast_to_date(): void
    {
        $post = new FacebookGalleryPost(['posted_at' => '2026-01-15']);

        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $post->posted_at);
        $this->assertSame('2026-01-15', $post->posted_at->format('Y-m-d'));
    }

    public function test_fillable_fields_are_set(): void
    {
        $post = new FacebookGalleryPost([
            'post_url'      => 'https://facebook.com/page/posts/1',
            'title'         => 'My Illustration',
            'description'   => 'Some description',
            'tags'          => ['art'],
            'thumbnail_url' => 'https://cdn.test/thumb.jpg',
            'is_active'     => true,
            'sort_order'    => 5,
        ]);

        $this->assertSame('My Illustration', $post->title);
        $this->assertSame(5, $post->sort_order);
    }
}
