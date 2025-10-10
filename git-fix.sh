#!/bin/bash

# Simple git fix for deployment systems
# Run this before any git pull operations

echo "Setting git pull strategy..."
git config pull.rebase false

echo "Handling divergent branches..."
git fetch origin

# Use merge strategy to handle divergent branches
git pull --no-rebase origin main

echo "Git synchronization complete!"