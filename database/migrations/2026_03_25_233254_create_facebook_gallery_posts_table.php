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
        Schema::create('facebook_gallery_posts', function (Blueprint $table) {
            $table->id();
            $table->string('post_url')->unique();
            $table->string('title')->nullable();
            $table->string('thumbnail_url')->nullable();
            $table->date('posted_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facebook_gallery_posts');
    }
};
