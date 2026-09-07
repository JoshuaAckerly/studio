<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {
            $table->timestamp('newsletter_sent_at')->nullable()->after('published_at');
        });

        // Backfill existing posts as already-notified so the new automatic sender
        // doesn't blast every subscriber with the entire back catalog at once.
        // The September post is deliberately excluded — it just went up and
        // subscribers haven't been notified about it yet.
        DB::table('blog_posts')
            ->whereNotNull('published_at')
            ->where('slug', '!=', 'september-2026-paline-bot-filtering-facebook-fixes')
            ->update(['newsletter_sent_at' => DB::raw('published_at')]);
    }

    public function down(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {
            $table->dropColumn('newsletter_sent_at');
        });
    }
};
