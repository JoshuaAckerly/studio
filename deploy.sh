#!/bin/bash

# Deployment script to handle git divergent branches issue
# This script should be run by the deployment system

echo "Setting git configuration for deployment..."
git config pull.rebase false
git config --global pull.rebase false

echo "Fetching latest changes..."
git fetch origin

echo "Resetting to match remote exactly..."
git reset --hard origin/main

echo "Deployment preparation complete!"
echo "Current commit: $(git rev-parse HEAD)"
echo "Branch status: $(git status --porcelain)"