<?php

namespace App\Console\Commands;

use App\Models\FacebookGalleryPost;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class SyncFacebookPosts extends Command
{
    protected $signature = 'facebook:sync-posts
                            {--limit=50 : Max posts to fetch per endpoint (photos + feed)}
                            {--dry-run : Show what would be imported without saving}';

    protected $description = 'Sync photos and posts from your Facebook page into facebook_gallery_posts';

    private const GRAPH = 'https://graph.facebook.com/v22.0';

    public function handle(): int
    {
        $token = config('services.facebook.page_access_token')
            ?? config('services.facebook.user_access_token');
        $pageId = config('services.facebook.page_id');

        if (empty($token)) {
            $this->error('FACEBOOK_PAGE_ACCESS_TOKEN or FACEBOOK_USER_ACCESS_TOKEN is not set.');
            return self::FAILURE;
        }

        if (empty($pageId)) {
            // Auto-discover the page ID from the user token
            $pageId = $this->discoverPageId($token);
            if (! $pageId) {
                $this->error('FACEBOOK_PAGE_ID is not set and could not be auto-discovered.');
                return self::FAILURE;
            }
            $this->line("Auto-discovered page ID: {$pageId}");

            // Exchange for a page-scoped token for better permissions
            $pageToken = $this->getPageToken($token, $pageId);
            if ($pageToken) {
                $token = $pageToken;
            }
        }

        $limit = (int) $this->option('limit');
        $dryRun = $this->option('dry-run');
        $client = new Client(['timeout' => 20, 'http_errors' => false]);

        $imported = 0;
        $skipped = 0;

        // ── Photos ──────────────────────────────────────────────────────────
        $this->info('Fetching page photos…');
        $photos = $this->fetchPaged($client, "{$pageId}/photos", [
            'fields' => 'id,name,created_time,images,link',
            'type' => 'uploaded',
        ], $token, $limit);

        foreach ($photos as $photo) {
            $url = $photo['link'] ?? "https://www.facebook.com/photo?fbid={$photo['id']}";

            if (! $dryRun && FacebookGalleryPost::where('post_url', $url)->exists()) {
                $skipped++;
                continue;
            }

            // Pick the largest image available
            $images = $photo['images'] ?? [];
            usort($images, fn ($a, $b) => ($b['width'] ?? 0) <=> ($a['width'] ?? 0));
            $thumbnailUrl = $images[0]['source'] ?? null;

            $description = $photo['name'] ?? null;

            if ($dryRun) {
                $this->line("  [dry-run] photo {$photo['id']}: ".($description ? substr($description, 0, 60) : '(no caption)'));
                $imported++;
                continue;
            }

            FacebookGalleryPost::create([
                'post_url' => $url,
                'title' => $description ? \Str::limit($description, 100) : 'Facebook Photo',
                'description' => $description,
                'thumbnail_url' => $thumbnailUrl,
                'posted_at' => isset($photo['created_time']) ? date('Y-m-d', strtotime($photo['created_time'])) : null,
                'is_active' => true,
                'sort_order' => 0,
            ]);
            $imported++;
        }

        $this->info("Photos: imported {$imported}, skipped {$skipped}");

        // ── Feed posts with images ───────────────────────────────────────────
        $this->info('Fetching page feed posts…');
        $feedImported = 0;
        $feedSkipped = 0;

        $posts = $this->fetchPaged($client, "{$pageId}/posts", [
            'fields' => 'id,message,created_time,full_picture,permalink_url',
        ], $token, $limit);

        foreach ($posts as $post) {
            // Skip posts without an image — they don't fit the gallery format
            if (empty($post['full_picture'])) {
                $feedSkipped++;
                continue;
            }

            $url = $post['permalink_url'] ?? "https://www.facebook.com/{$post['id']}";

            if (! $dryRun && FacebookGalleryPost::where('post_url', $url)->exists()) {
                $feedSkipped++;
                continue;
            }

            $message = $post['message'] ?? null;

            if ($dryRun) {
                $this->line("  [dry-run] post {$post['id']}: ".($message ? substr($message, 0, 60) : '(no message)'));
                $feedImported++;
                continue;
            }

            FacebookGalleryPost::create([
                'post_url' => $url,
                'title' => $message ? \Str::limit($message, 100) : 'Facebook Post',
                'description' => $message,
                'thumbnail_url' => $post['full_picture'],
                'posted_at' => isset($post['created_time']) ? date('Y-m-d', strtotime($post['created_time'])) : null,
                'is_active' => true,
                'sort_order' => 0,
            ]);
            $feedImported++;
        }

        $this->info("Feed posts: imported {$feedImported}, skipped {$feedSkipped}");

        if (! $dryRun) {
            Cache::forget('illustrations.api');
        }

        return self::SUCCESS;
    }

    private function fetchPaged(Client $client, string $endpoint, array $params, string $token, int $limit): array
    {
        $results = [];
        $url = self::GRAPH."/{$endpoint}";
        $params['access_token'] = $token;
        $params['limit'] = min($limit, 100);

        while ($url && count($results) < $limit) {
            try {
                $response = $client->get($url, ['query' => $params]);
                $body = json_decode((string) $response->getBody(), true);

                if (isset($body['error'])) {
                    $this->warn("Graph API error: {$body['error']['message']}");
                    break;
                }

                $results = array_merge($results, $body['data'] ?? []);
                $url = $body['paging']['next'] ?? null;
                $params = []; // next page URL already has all params
            } catch (RequestException $e) {
                $this->error("Request failed: ".$e->getMessage());
                break;
            }
        }

        return array_slice($results, 0, $limit);
    }

    private function discoverPageId(string $userToken): ?string
    {
        $client = new Client(['timeout' => 10, 'http_errors' => false]);
        try {
            $response = $client->get(self::GRAPH.'/me/accounts', [
                'query' => ['access_token' => $userToken, 'fields' => 'id,name'],
            ]);
            $body = json_decode((string) $response->getBody(), true);
            return $body['data'][0]['id'] ?? null;
        } catch (\Throwable) {
            return null;
        }
    }

    private function getPageToken(string $userToken, string $pageId): ?string
    {
        $client = new Client(['timeout' => 10, 'http_errors' => false]);
        try {
            $response = $client->get(self::GRAPH.'/me/accounts', [
                'query' => ['access_token' => $userToken, 'fields' => 'id,access_token'],
            ]);
            $body = json_decode((string) $response->getBody(), true);
            foreach ($body['data'] ?? [] as $page) {
                if ($page['id'] === $pageId) {
                    return $page['access_token'] ?? null;
                }
            }
        } catch (\Throwable) {
        }
        return null;
    }
}
