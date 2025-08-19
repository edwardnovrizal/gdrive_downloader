#!/bin/bash

# Test Production Configuration Locally
echo "🧪 Testing Production Configuration Locally"
echo "=========================================="

# Set environment to production
export NODE_ENV=production

echo "📋 Environment: $NODE_ENV"
echo "🖥️  Testing headless mode..."

# Test with a single URL (you can modify this)
echo "⚠️  Make sure you have at least one URL in urls.txt"

# Run in test mode (will exit after showing configuration)
echo "🚀 Starting scraper in production mode..."
echo "   (Press Ctrl+C to stop after seeing the configuration)"

node app.js
