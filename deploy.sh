#!/bin/bash

# Ensure the script exits if any command fails
set -e

# Install the Vite plugin first to prevent configuration loading errors
echo "Installing Vite plugin..."
npm install @vitejs/plugin-react

# Install all dependencies
echo "Installing all dependencies..."
npm install

# Create a special build script that works around the Vite plugin issue
echo "Creating build script workaround..."
cat > build-workaround.js << 'EOL'
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Copy the plugin directly to where it's needed
try {
  // Create a temporary directory to ensure module is found
  const tempDir = path.join(__dirname, 'temp_modules');
  const pluginDir = path.join(tempDir, '@vitejs', 'plugin-react');
  
  // Create the directories recursively
  fs.mkdirSync(path.join(tempDir, '@vitejs'), { recursive: true });
  
  // Copy the plugin from node_modules to the temporary directory
  console.log('Copying plugin to temporary location...');
  const sourceDir = path.join(__dirname, 'node_modules', '@vitejs', 'plugin-react');
  fs.cpSync(sourceDir, pluginDir, { recursive: true });
  
  // Set the NODE_PATH environment variable to include our temp directory
  console.log('Setting NODE_PATH to include temporary directory...');
  process.env.NODE_PATH = `${tempDir}:${process.env.NODE_PATH || ''}`;
  
  // Run the build command with the updated NODE_PATH
  console.log('Running build command...');
  execSync('npm run build', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build workaround failed:', error);
  process.exit(1);
}
EOL

# Run the workaround
echo "Running build workaround..."
node build-workaround.js

# Run database migrations
echo "Running database migrations..."
npm run db:push

echo "Deployment preparation completed successfully!"