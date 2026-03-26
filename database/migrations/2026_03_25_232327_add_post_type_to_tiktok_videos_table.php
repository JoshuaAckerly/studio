<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tiktok_videos', function (Blueprint $table) {
            $table->string('post_type')->default('video')->after('tiktok_video_id');
        });
    }

    public function down(): void
    {
        Schema::table('tiktok_videos', function (Blueprint $table) {
            $table->dropColumn('post_type');
        });
    }
};
