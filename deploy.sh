#!/bin/bash

# Build and deploy to Android device

echo "Building app..."
npm run build

echo "Syncing to Android..."
npx cap sync android

echo "Installing to device..."
cd android && ./gradlew installDebug

echo "Done! App installed on device."
