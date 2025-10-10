#!/bin/bash

# Laravel Forge Deployment Hook
# This script handles the git divergent branches issue

cd $FORGE_SITE_PATH

echo "🚀 Starting deployment..."
echo "📍 Current directory: $(pwd)"
echo "📍 Current branch: $(git branch --show-current)"

# Set git configuration to handle divergent branches
echo "⚙️  Setting git configuration..."
git config pull.rebase false
git config --global pull.rebase false

# Fetch latest changes
echo "📥 Fetching latest changes..."
git fetch origin main

# Check if we have divergent branches
if git merge-base --is-ancestor HEAD origin/main; then
    echo "✅ Local branch is behind remote. Fast-forward merge."
    git merge --ff-only origin/main
elif git merge-base --is-ancestor origin/main HEAD; then
    echo "✅ Local branch is ahead of remote. No action needed."
else
    echo "⚠️  Divergent branches detected. Using merge strategy."
    git merge --no-rebase origin/main
fi

# Alternative: Force reset to remote (use if above doesn't work)
# echo "🔄 Force resetting to remote..."
# git reset --hard origin/main

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