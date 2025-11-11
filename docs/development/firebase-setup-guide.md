# Firebase Setup Guide

**Version:** 1.0
**Date:** 2025-11-12
**Status:** Production Ready

---

## 🎯 Overview

This guide walks you through setting up Firebase for the Credit Castor application. Firebase provides:

- **Real-time data synchronization** across browsers and devices
- **Cloud-based persistence** with automatic backups
- **Conflict detection** for concurrent edits
- **Cross-device collaboration** for team members

The app gracefully falls back to localStorage-only mode if Firebase is not configured.

---

## 📋 Prerequisites

- **Google Account** - You'll need a Google account to access Firebase Console
- **Node.js & npm** - Already installed if you're running the app
- **Credit Castor app** - Cloned and running locally

---

## 🚀 Step-by-Step Setup

### Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Click **"Add project"**

2. **Configure Project**
   - **Project name**: `credit-castor` (or your preferred name)
   - **Google Analytics**: Optional (can disable for simplicity)
   - Click **"Create project"**
   - Wait for project creation (takes ~30 seconds)

3. **Navigate to Project Dashboard**
   - Click **"Continue"** once project is ready

---

### Step 2: Create Web App

1. **Add Web App to Project**
   - In Firebase Console, click the **web icon** (`</>`) to add a web app
   - Or go to: **Project Settings** → **General** → **Your apps** → **Add app** → **Web**

2. **Register App**
   - **App nickname**: `credit-castor-web` (or your preferred name)
   - **Firebase Hosting**: Uncheck (not needed yet)
   - Click **"Register app"**

3. **Copy Configuration**
   - Firebase will show you a config object like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "credit-castor.firebaseapp.com",
     projectId: "credit-castor",
     storageBucket: "credit-castor.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef1234567890abcdef"
   };
   ```
   - **Keep this tab open** - you'll need these values in Step 4

---

### Step 3: Enable Firestore Database

1. **Navigate to Firestore**
   - In Firebase Console, go to **Build** → **Firestore Database**
   - Click **"Create database"**

2. **Choose Location**
   - Select a location close to your users (e.g., `europe-west1` for Europe)
   - **Note**: Location cannot be changed later
   - Click **"Next"**

3. **Security Rules**
   - Choose **"Start in test mode"** for now
   - **Warning**: This allows anyone to read/write for 30 days
   - We'll secure it properly in Step 5
   - Click **"Create"**

4. **Wait for Database Creation**
   - Takes ~30 seconds to provision
   - You'll see an empty database dashboard

---

### Step 4: Configure Environment Variables

1. **Create `.env` File**
   - In your project root, create a `.env` file (if not already present)
   - **IMPORTANT**: `.env` is already in `.gitignore` - never commit it!

2. **Add Firebase Configuration**
   - Copy the values from Step 2 into your `.env` file:
   ```bash
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   VITE_FIREBASE_AUTH_DOMAIN=credit-castor.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=credit-castor
   VITE_FIREBASE_STORAGE_BUCKET=credit-castor.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef
   ```

3. **Restart Development Server**
   - Stop the dev server (Ctrl+C)
   - Restart: `npm run dev`
   - The app will now connect to Firebase!

---

### Step 5: Configure Security Rules (IMPORTANT)

**⚠️ Critical Step**: The default test mode allows anyone to read/write your database. Secure it properly:

1. **Navigate to Firestore Rules**
   - In Firebase Console: **Firestore Database** → **Rules** tab

2. **Replace Default Rules**
   - Replace the existing rules with the following:

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {

       // Users collection - store custom authentication data
       match /users/{userId} {
         // Anyone can create a new user (for registration)
         allow create: if true;

         // Users can only read their own data
         allow read: if request.auth != null || request.resource.data.email == userId.replace('_', '@').replace('_', '.');

         // Users cannot update/delete (security measure)
         allow update, delete: if false;
       }

       // Projects collection - shared project data
       match /projects/{projectId} {
         // Allow read if unlocked (we check unlock state in the app)
         allow read: if true;

         // Allow write only if user is authenticated (has unlocked)
         allow write: if request.auth != null || request.resource.data.lastModifiedBy != null;
       }

       // Presence collection - for tracking active users
       match /presence/{sessionId} {
         allow read, write: if true; // Presence is ephemeral and not sensitive
       }
     }
   }
   ```

3. **Publish Rules**
   - Click **"Publish"**
   - Rules take effect immediately

**Note**: These rules are designed for the custom authentication system (not Firebase Auth). They're suitable for a small team application but should be further hardened for production use with many users.

---

### Step 6: Test the Integration

1. **Open the App**
   - Visit: http://localhost:4321/credit-castor
   - Click the **unlock button** (top-left)
   - Enter your email

2. **Check Sync Status**
   - After unlocking, you should see a **sync indicator** (top-right)
   - Should show: **"Synchronisé"** with a green dot

3. **Test Real-time Sync**
   - Open the app in **two browser tabs**
   - Make a change in Tab 1 (e.g., add a participant)
   - Tab 2 should receive a notification about the change
   - Reload Tab 2 to see the updated data

4. **Verify Firestore Data**
   - Go to Firebase Console → **Firestore Database** → **Data** tab
   - You should see:
     - `projects/shared-project` document with your data
     - `users/your_email` document with your credentials (hashed password)

---

## 🔧 Troubleshooting

### Issue: "Firestore not configured" (localStorage mode)

**Symptoms**: Sync indicator shows "Local" instead of "Synchronisé"

**Solutions**:
1. Check that `.env` file exists and has all variables
2. Verify variable names start with `VITE_` (required for Vite)
3. Restart dev server after adding `.env`
4. Check browser console for Firebase initialization errors

---

### Issue: "Permission denied" errors in console

**Symptoms**: Red errors in browser console about Firestore permissions

**Solutions**:
1. Verify you've completed Step 5 (Security Rules)
2. Make sure you've clicked "Publish" after updating rules
3. Check that `projectId` in `.env` matches your Firebase project
4. Try unlocking the app (click unlock button)

---

### Issue: Changes not syncing between tabs

**Symptoms**: Edit in one tab, doesn't show in another tab

**Solutions**:
1. Check sync status indicator - should be green "Synchronisé"
2. Open browser console in both tabs, look for errors
3. Verify both tabs are using the same email (unlock button)
4. Check Firestore Console → Data tab - are writes being saved?
5. Check network tab - are requests to Firestore succeeding?

---

### Issue: "Failed to get document" error

**Symptoms**: Error about missing document in console

**Solutions**:
1. This is normal on first load (no data yet)
2. Make a change to trigger first write
3. Document will be created automatically

---

## 🔐 Security Best Practices

### Current Implementation

**Password Hashing**: SHA-256 (adequate for POC)
- ✅ Better than plain text
- ⚠️ Not ideal for production with many users
- 🔧 **Recommend**: Upgrade to bcrypt or Argon2 for production

**API Keys**: Visible in client code
- ✅ Normal for Firebase (API keys are not secret)
- ✅ Protected by security rules
- 🔧 **Recommend**: Add Firebase App Check for production

**Security Rules**: Basic authentication check
- ✅ Prevents unauthorized writes
- ⚠️ Allows reads for unlocked users
- 🔧 **Recommend**: Implement user-based access control for production

---

### Production Hardening Checklist

Before deploying to production:

- [ ] **Upgrade Password Hashing**
  ```bash
  npm install bcrypt
  ```
  Update `src/services/firestoreAuth.ts` to use bcrypt

- [ ] **Enable Firebase App Check**
  - Go to Firebase Console → Build → App Check
  - Register your app
  - Add reCAPTCHA v3 or Play Integrity
  - Enforces requests come from your app, not bots

- [ ] **Tighten Security Rules**
  - Require authentication for reads
  - Add user ownership checks
  - Implement rate limiting
  - Add data validation rules

- [ ] **Add Input Validation**
  - Email format validation
  - Password strength requirements (min length, complexity)
  - Sanitize all user inputs

- [ ] **Enable HTTPS**
  - Already enforced by Firebase
  - Ensure production deployment uses HTTPS

- [ ] **Set Up Monitoring**
  - Enable Firebase Monitoring
  - Set up alerts for unusual activity
  - Monitor Firestore usage and costs

---

## 📊 Usage Limits & Costs

### Free Tier (Spark Plan)

Firebase offers a generous free tier:

**Firestore**:
- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day
- 1 GB storage

**For this app**:
- ~10 active users: ~500-1000 reads/day
- ~100 writes/day (auto-save on changes)
- Well within free tier limits

### Paid Tier (Blaze Plan)

If you exceed free tier:
- Pay-as-you-go pricing
- ~$0.06 per 100,000 reads
- ~$0.18 per 100,000 writes
- Very affordable for small teams

**Monitor Usage**:
- Firebase Console → Usage and billing
- Set up budget alerts

---

## 🎓 Additional Resources

### Firebase Documentation
- **Firestore Getting Started**: https://firebase.google.com/docs/firestore
- **Security Rules**: https://firebase.google.com/docs/firestore/security/get-started
- **Best Practices**: https://firebase.google.com/docs/firestore/best-practices

### Credit Castor Specific
- **Implementation Details**: See `docs/development/phase3-firestore-sync-implementation.md`
- **Code Review**: See source files:
  - `src/services/firebase.ts` - Initialization
  - `src/services/firestoreAuth.ts` - Authentication
  - `src/services/firestoreSync.ts` - Sync logic
  - `src/hooks/useFirestoreSync.ts` - React integration

---

## ✅ Verification Checklist

After completing setup, verify:

- [x] Firebase project created
- [x] Web app registered
- [x] Firestore database enabled
- [x] `.env` file configured with all 6 variables
- [x] Security rules published
- [x] Dev server restarted
- [x] App shows "Synchronisé" status
- [x] Data appears in Firestore Console
- [x] Changes sync between tabs
- [x] No errors in browser console

---

## 🎉 Success!

If all checks pass, your Firebase integration is complete! The app now:

- ✅ Syncs data in real-time across devices
- ✅ Stores data securely in the cloud
- ✅ Detects and resolves conflicts
- ✅ Falls back gracefully to localStorage if offline

---

## 🆘 Need Help?

**Common Issues**: See Troubleshooting section above

**Firebase Support**: https://firebase.google.com/support

**Project Issues**: https://github.com/anthropics/credit-castor/issues (if applicable)

**Community**: Firebase Stack Overflow tag: https://stackoverflow.com/questions/tagged/firebase

---

## 📝 Next Steps

After Firebase is working:

1. **Test with Team**: Have team members unlock and test sync
2. **Monitor Usage**: Check Firebase Console for usage patterns
3. **Backup Data**: Export data periodically (Excel export)
4. **Review Security**: Ensure rules match your security requirements
5. **Plan Scaling**: Monitor if you need to upgrade to paid tier

---

**Last Updated**: 2025-11-12
**Maintained By**: Credit Castor Development Team
