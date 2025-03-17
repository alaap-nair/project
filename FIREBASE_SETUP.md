# Firebase Setup Instructions

This document provides step-by-step instructions on how to set up Firebase for your Expo mobile app.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click on "Add project"
3. Enter a project name (e.g., "Study App")
4. Choose whether to enable Google Analytics (recommended)
5. Accept the terms and click "Create project"

## Step 2: Register Your App with Firebase

### For iOS

1. In the Firebase console, click on the project you just created
2. Click on the iOS icon (🍎) to add an iOS app
3. Enter your iOS Bundle ID (from your app.json: `com.gillianhu.studyapp`)
4. Enter a nickname for your app (optional)
5. Enter the App Store ID (optional, can be added later)
6. Click "Register app"
7. Download the `GoogleService-Info.plist` file (you'll need this later)

### For Android

1. In the Firebase console, click on your project
2. Click on the Android icon to add an Android app
3. Enter your Android package name (typically the same as your iOS Bundle ID)
4. Enter a nickname for your app (optional)
5. Enter the Debug signing certificate SHA-1 (optional for now)
6. Click "Register app"
7. Download the `google-services.json` file (you'll need this later)

## Step 3: Update Your Firebase Configuration

Since Expo uses the Firebase Web SDK under the hood, you'll still use the web configuration:

1. In the Firebase console, click on your project
2. Click on the web icon (</>) to add a web app (even though you're building a mobile app)
3. Register your app with a nickname (e.g., "Study App Mobile")
4. Click "Register app"
5. Firebase will provide you with configuration details
6. Open the `firebase.config.js` file in your project
7. Replace the placeholder values with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

## Step 4: Enable Authentication Methods

1. In the Firebase console, go to "Authentication" in the left sidebar
2. Click on "Get started"
3. Enable the authentication methods you want to use (Email/Password is a good start)
4. For each method, click "Enable" and configure as needed
5. Click "Save"

## Step 5: Set Up Firestore Database

1. In the Firebase console, go to "Firestore Database" in the left sidebar
2. Click on "Create database"
3. Choose either "Start in production mode" or "Start in test mode" (test mode is easier for development)
4. Select a location for your database
5. Click "Enable"

## Step 6: Set Up Firebase Storage

1. In the Firebase console, go to "Storage" in the left sidebar
2. Click on "Get started"
3. Read through the security rules information
4. Click "Next"
5. Choose a location for your storage bucket
6. Click "Done"

## Step 7: Update Security Rules

### Firestore Rules

1. In the Firebase console, go to "Firestore Database"
2. Click on the "Rules" tab
3. Update the rules as needed. For development, you can use:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Note:** These rules allow anyone to read and write to your database. For production, you should implement proper security rules.

### Storage Rules

1. In the Firebase console, go to "Storage"
2. Click on the "Rules" tab
3. Update the rules as needed. For development, you can use:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

**Note:** These rules allow anyone to read and write to your storage. For production, you should implement proper security rules.

## Step 8: Configure Expo for Native Firebase Features (Optional)

If you need native Firebase features like Push Notifications, you'll need to:

1. Install the Expo dev client: `npx expo install expo-dev-client`
2. Create a development build: `eas build --profile development --platform ios` (or android)
3. Follow the [Expo Firebase documentation](https://docs.expo.dev/guides/using-firebase/) for additional setup

## Step 9: Test Your Firebase Integration

1. Start your Expo app with `npx expo start`
2. Test authentication by creating a user account
3. Test Firestore by adding and retrieving data
4. Test Storage by uploading and downloading files

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Expo with Firebase Guide](https://docs.expo.dev/guides/using-firebase/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [Firebase Storage](https://firebase.google.com/docs/storage) 