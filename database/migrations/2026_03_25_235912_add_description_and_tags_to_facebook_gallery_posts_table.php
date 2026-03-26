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
        Schema::table('facebook_gallery_posts', function (Blueprint $table) {
            $table->text('description')->nullable()->after('title');
            $table->json('tags')->nullable()->after('description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('facebook_gallery_posts', function (Blueprint $table) {
            $table->dropColumn(['description', 'tags']);
        });
    }
};
