#!/bin/bash

# FORGE EMERGENCY RESET SCRIPT
# Use this in your Forge deployment script to force clean state

echo "🚨 EMERGENCY RESET - FORCING CLEAN DEPLOYMENT STATE"

# Set working directory (Forge usually sets this)
cd $FORGE_SITE_PATH

# Configure git to prevent future issues
git config pull.rebase false
git config --global pull.rebase false

# Clean any local changes or conflicts
echo "🧹 Cleaning working directory..."
git clean -fd
git reset --hard HEAD

# Fetch everything fresh
echo "📥 Fetching fresh remote data..."
git fetch --all --prune

# NUCLEAR OPTION: Force reset to exactly match remote
echo "💥 FORCE RESET to origin/main..."
git reset --hard origin/main

# Verify success
echo "✅ RESET COMPLETE!"
echo "Current commit: $(git rev-parse HEAD)"
echo "Remote commit:  $(git rev-parse origin/main)"

if [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ]; then
    echo "🎉 SUCCESS: Local and remote are now identical!"
else
    echo "❌ ERROR: Reset may have failed!"
    exit 1
fi

echo "🚀 Proceeding with deployment..."

# Continue with Laravel deployment
php artisan down --retry=60
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache  
php artisan view:cache
php artisan migrate --force
php artisan up

echo "🎉 DEPLOYMENT COMPLETE! Mobile touch system is live!"