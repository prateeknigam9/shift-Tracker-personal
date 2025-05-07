#!/bin/bash

# Ensure the script exits if any command fails
set -e

# Install the Vite plugin first to prevent configuration loading errors
echo "Installing Vite plugin..."
npm install @vitejs/plugin-react

# Install all dependencies
echo "Installing all dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

# Run database migrations
echo "Running database migrations..."
npm run db:push

echo "Deployment preparation completed successfully!"