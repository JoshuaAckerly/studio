#!/bin/bash

# Laravel Forge Deployment Hook
# FORCE RESET VERSION - Handles git divergent branches issue

cd $FORGE_SITE_PATH

echo "🚀 Starting deployment with FORCE RESET..."
echo "📍 Current directory: $(pwd)"
echo "📍 Current branch: $(git branch --show-current)"

# Set git configuration to handle divergent branches
echo "⚙️  Setting git configuration..."
git config pull.rebase false
git config --global pull.rebase false

# Fetch latest changes
echo "📥 Fetching latest changes..."
git fetch origin main

# FORCE RESET - This will override any local changes and divergent branches
echo "🔄 FORCE RESETTING to match remote exactly..."
echo "⚠️  This will discard any local changes on the server."
git reset --hard origin/main

# Verify the reset worked
echo "✅ Reset complete! Current HEAD:"
git log --oneline -1
echo "� Working directory status:"
git status --porcelain

echo "📊 Current status:"
git log --oneline -3
git status --porcelain

echo "🎯 Deployment preparation complete!"
echo "✨ Mobile touch input system is ready!"

# Continue with standard Laravel deployment...
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "🎉 Deployment completed successfully!"