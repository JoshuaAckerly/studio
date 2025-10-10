#!/bin/bash

# MINIMAL FORGE DEPLOYMENT SCRIPT - Copy this into your Forge deployment script

cd $FORGE_SITE_PATH

# Force reset to match remote exactly
git config pull.rebase false
git fetch origin main
git reset --hard origin/main

# Standard Laravel deployment
php artisan down --retry=60
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force
php artisan up