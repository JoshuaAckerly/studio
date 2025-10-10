@echo off
echo Setting git configuration for deployment...
git config pull.rebase false
git config --global pull.rebase false

echo Fetching latest changes...
git fetch origin

echo Resetting to match remote exactly...
git reset --hard origin/main

echo Deployment preparation complete!
git rev-parse HEAD
git status --porcelain