# Firebase Setup Guide

## 1. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project", name it "hiredfast"
3. Disable Google Analytics (not needed), click "Create project"

## 2. Enable Authentication
1. In Firebase console → Build → Authentication
2. Click "Get started"
3. Sign-in method tab → Enable "Google"
   - Set project support email
   - Save
4. Sign-in method tab → Enable "Facebook"
   - You need Facebook App ID and App Secret from
     https://developers.facebook.com
   - Create app → Consumer type → Add Facebook Login product
   - Copy the OAuth redirect URI from Firebase and add it to
     Facebook app's Valid OAuth Redirect URIs
   - Save

## 3. Create Firestore Database
1. Build → Firestore Database → Create database
2. Choose "Start in production mode"
3. Select your nearest region
4. After creation, go to Rules tab and replace with:

   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null 
           && request.auth.uid == userId;
       }
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null 
           && request.auth.uid == userId;
       }
     }
   }

5. Click Publish

## 4. Get Client Config (for frontend)
1. Project Settings (gear icon) → General
2. Under "Your apps" → click web icon (</>)
3. Register app with nickname "hiredfast-web"
4. Copy the firebaseConfig object values into .env.local:

   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=

## 5. Get Service Account (for server-side / Admin SDK)
1. Project Settings → Service accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Copy values into .env.local:

   FIREBASE_PROJECT_ID=
   FIREBASE_CLIENT_EMAIL=
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

Note: Wrap FIREBASE_PRIVATE_KEY in double quotes and keep the \n 
characters as literal \n in the .env.local file.
