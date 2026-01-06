#!/bin/bash

# Build and deploy to Android device
# Usage: ./deploy.sh [dev|prod]

MODE=${1:-dev}

# Set app name and ID based on mode
if [ "$MODE" = "prod" ]; then
  APP_NAME="Budgit"
  APP_ID="com.budgit.app"
else
  APP_NAME="Budgit - Dev"
  APP_ID="com.budgit.app.dev"
fi

echo "Building in $MODE mode with app name: $APP_NAME (ID: $APP_ID)"

# Update capacitor.config.ts
sed -i "s/appId: '.*'/appId: '$APP_ID'/" capacitor.config.ts
sed -i "s/appName: '.*'/appName: '$APP_NAME'/" capacitor.config.ts

# Update Android strings.xml
sed -i "s/<string name=\"app_name\">.*<\/string>/<string name=\"app_name\">$APP_NAME<\/string>/" android/app/src/main/res/values/strings.xml
sed -i "s/<string name=\"title_activity_main\">.*<\/string>/<string name=\"title_activity_main\">$APP_NAME<\/string>/" android/app/src/main/res/values/strings.xml
sed -i "s/<string name=\"package_name\">.*<\/string>/<string name=\"package_name\">$APP_ID<\/string>/" android/app/src/main/res/values/strings.xml
sed -i "s/<string name=\"custom_url_scheme\">.*<\/string>/<string name=\"custom_url_scheme\">$APP_ID<\/string>/" android/app/src/main/res/values/strings.xml

# Update Android build.gradle - only change applicationId, keep namespace as com.budgit.app
sed -i "s/applicationId \".*\"/applicationId \"$APP_ID\"/" android/app/build.gradle

echo "Building app..."
npm run build

echo "Syncing to Android..."
npx cap sync android

echo "Installing to device..."
cd android && ./gradlew installDebug

echo "Done! App installed on device."
