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
            $table->text('thumbnail_url')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('facebook_gallery_posts', function (Blueprint $table) {
            $table->string('thumbnail_url')->nullable()->change();
        });
    }
};
