# Deployment Checklist

**Version:** 1.0
**Date:** 2025-11-12
**Purpose:** Step-by-step checklist for deploying Credit Castor with Firestore sync

---

## 🎯 Overview

This checklist ensures safe, successful deployment of the Credit Castor application with Firestore synchronization to production.

---

## 📋 Pre-Deployment Checklist

### 1. Code Quality & Testing
- [ ] All automated tests pass (`npm run test:run`)
  ```bash
  npm run test:run
  # Expected: 661/661 tests passing
  ```

- [ ] TypeScript compilation successful
  ```bash
  npx tsc --noEmit
  # Expected: No errors
  ```

- [ ] Build succeeds without errors
  ```bash
  npm run build
  # Expected: dist/ folder generated
  ```

- [ ] Manual testing completed (see `phase3-testing-guide.md`)
  - [ ] Test 1-5: Core sync functionality
  - [ ] Test 6-10: Conflict resolution
  - [ ] Test 11-15: Edge cases
  - [ ] Test 16-20: Error handling

### 2. Firebase Project Setup
- [ ] Firebase project created at [console.firebase.google.com](https://console.firebase.google.com)
- [ ] Firestore database enabled
- [ ] Firestore location selected (cannot change later)
- [ ] Web app registered in project

### 3. Environment Configuration
- [ ] Production `.env` file created (do NOT commit to git)
- [ ] All Firebase variables configured:
  ```bash
  VITE_FIREBASE_API_KEY=...
  VITE_FIREBASE_AUTH_DOMAIN=...
  VITE_FIREBASE_PROJECT_ID=...
  VITE_FIREBASE_STORAGE_BUCKET=...
  VITE_FIREBASE_MESSAGING_SENDER_ID=...
  VITE_FIREBASE_APP_ID=...
  ```
- [ ] Admin password configured:
  ```bash
  VITE_ADMIN_PASSWORD=...  # Use strong password
  ```

### 4. Security
- [ ] Firestore security rules reviewed
- [ ] Security rules published to Firebase:
  ```bash
  # Option A: Via CLI
  firebase deploy --only firestore:rules

  # Option B: Via Console
  # Copy firestore.rules to Firebase Console → Firestore → Rules → Publish
  ```
- [ ] Firestore indexes deployed:
  ```bash
  firebase deploy --only firestore:indexes
  ```
- [ ] Test write permissions (should require lastModifiedBy)
- [ ] Test read permissions (should be public for projects)

### 5. Data Backup
- [ ] Export existing localStorage data (if any):
  ```javascript
  // In browser console:
  JSON.stringify(localStorage)
  // Save output to file
  ```
- [ ] Create Firestore backup plan:
  - [ ] Automated daily exports enabled (Firebase Console → Firestore → Import/Export)
  - [ ] Export schedule configured
  - [ ] Storage bucket for backups identified

### 6. Performance & Quotas
- [ ] Reviewed Firebase quotas (Spark plan limits):
  - 50,000 reads/day
  - 20,000 writes/day
  - 1 GB storage
- [ ] Estimated usage acceptable for free tier
- [ ] Billing alerts configured (if using Blaze plan)

---

## 🚀 Deployment Steps

### Step 1: Deploy Security Rules
```bash
# Navigate to project root
cd /path/to/credit-castor

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Verify in Firebase Console
```

**Verification:**
- [ ] Rules published successfully
- [ ] No errors in deployment log
- [ ] Rules visible in Firebase Console → Firestore → Rules

---

### Step 2: Build for Production
```bash
# Clean previous builds
rm -rf dist/

# Build with production env
npm run build

# Verify build output
ls -la dist/
```

**Verification:**
- [ ] `dist/` folder created
- [ ] `dist/index.html` exists
- [ ] `dist/_astro/` contains bundled JS/CSS
- [ ] Build completed without errors

---

### Step 3: Deploy Application

#### Option A: Firebase Hosting (Recommended)
```bash
# Install Firebase CLI (if not already)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting (first time only)
firebase init hosting
# - Select existing project
# - Public directory: dist
# - Configure as SPA: Yes
# - Don't overwrite index.html: No

# Deploy
firebase deploy --only hosting

# Note the hosting URL (e.g., https://credit-castor.web.app)
```

**Verification:**
- [ ] Deployment successful
- [ ] Hosting URL accessible
- [ ] App loads without errors
- [ ] Sync indicator shows "Synchronisé" (green)

#### Option B: Custom Hosting
```bash
# Upload dist/ contents to your hosting provider
# Examples:
# - Netlify: Drag dist/ to Netlify dashboard
# - Vercel: vercel --prod
# - S3: aws s3 sync dist/ s3://your-bucket/
```

**Verification:**
- [ ] Files uploaded successfully
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] App accessible via URL

---

### Step 4: Post-Deployment Testing

#### Functional Tests
- [ ] App loads without errors
- [ ] Unlock button works
- [ ] Can unlock with email
- [ ] Sync indicator shows "Synchronisé"
- [ ] Add participant → syncs to Firestore
- [ ] Verify in Firestore Console → Data tab
- [ ] Open in second browser → receives notification
- [ ] Reload second browser → sees changes
- [ ] Create conflict → conflict dialog appears
- [ ] Resolve conflict → data syncs correctly

#### Cross-Browser Tests
- [ ] Chrome/Edge (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Chrome (mobile)
- [ ] Safari (mobile)

#### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] Sync latency < 2 seconds
- [ ] No console errors
- [ ] No console warnings (except expected)
- [ ] App remains responsive during sync

---

### Step 5: Monitoring Setup

#### Firebase Console Monitoring
- [ ] Navigate to Firebase Console → Firestore → Usage tab
- [ ] Monitor reads/writes/storage
- [ ] Set up usage alerts (if available)

#### Error Tracking (Optional)
```bash
# Install Sentry (optional)
npm install @sentry/browser

# Configure in src/services/firebase.ts
# See: https://docs.sentry.io/platforms/javascript/
```

#### Performance Monitoring (Optional)
```bash
# Enable Firebase Performance Monitoring
firebase init performance
firebase deploy
```

---

## 🧪 Post-Deployment Validation

### Day 1 Checks
- [ ] Monitor Firestore usage (first 24 hours)
- [ ] Check for error spikes in console
- [ ] Verify real-time sync working
- [ ] Collect user feedback

### Week 1 Checks
- [ ] Review Firestore read/write patterns
- [ ] Optimize expensive queries (if any)
- [ ] Verify quotas not exceeded
- [ ] Document any issues

### Month 1 Checks
- [ ] Review security rules effectiveness
- [ ] Consider upgrading to Blaze plan (if needed)
- [ ] Plan for future enhancements
- [ ] Archive old data (if needed)

---

## 🔄 Rollback Plan

If deployment fails or critical issues arise:

### Immediate Rollback
```bash
# Option A: Firebase Hosting
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL SITE_ID:live

# Option B: Custom hosting
# Restore previous build from backup
# Re-deploy old dist/ folder
```

### Data Rollback
```bash
# Restore Firestore from backup
# Firebase Console → Firestore → Import/Export → Import
# Select backup file
# WARNING: This overwrites current data
```

### Revert Security Rules
```bash
# Restore previous rules from git history
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules
```

---

## 📊 Success Criteria

Deployment is considered successful if:

- ✅ All automated tests pass
- ✅ App loads in production
- ✅ Sync indicator shows "Synchronisé"
- ✅ Cross-tab sync works
- ✅ Conflict resolution works
- ✅ No critical errors in 24 hours
- ✅ Firestore usage within quotas
- ✅ User feedback is positive

---

## 🆘 Troubleshooting

### Issue: "Firestore not configured"
**Solution:**
1. Check production `.env` has all variables
2. Verify variables start with `VITE_`
3. Rebuild app after env changes
4. Check build output for env variables

### Issue: "Permission denied" errors
**Solution:**
1. Verify security rules deployed
2. Check rules in Firebase Console
3. Test with simple read/write in console:
   ```javascript
   // Test read
   const db = firebase.firestore();
   db.collection('projects').doc('shared-project').get();

   // Test write
   db.collection('projects').doc('shared-project').set({test: 'data'});
   ```

### Issue: Changes not syncing
**Solution:**
1. Check browser console for errors
2. Verify Firestore Console shows recent writes
3. Check network tab for WebSocket connection
4. Ensure user has unlocked (top-left button)

### Issue: High Firestore usage
**Solution:**
1. Check for unnecessary listeners
2. Optimize query patterns
3. Review real-time listener logic
4. Consider caching strategies

---

## 📝 Deployment Log Template

After deployment, fill out this log:

```markdown
# Deployment Log

**Date:** YYYY-MM-DD
**Deployed By:** Your Name
**Environment:** Production
**Version:** v1.12.1 (or current version)

## Pre-Deployment Checks
- [x] All tests passing: Yes/No
- [x] Build successful: Yes/No
- [x] Security rules deployed: Yes/No
- [x] .env configured: Yes/No

## Deployment
- **Method:** Firebase Hosting / Custom
- **URL:** https://...
- **Deployment Time:** HH:MM
- **Duration:** X minutes

## Post-Deployment Validation
- [x] App loads: Yes/No
- [x] Sync working: Yes/No
- [x] Cross-browser tested: Yes/No
- [x] Errors found: None / List

## Issues Found
1. Issue description
   - Severity: Critical/High/Medium/Low
   - Resolution: ...

## Metrics (After 24 Hours)
- Firestore reads: X/day
- Firestore writes: X/day
- Storage used: X MB
- Active users: X

## Sign-Off
**Status:** Success / Failed / Partial
**Confidence:** High / Medium / Low
**Notes:** Additional comments...

**Signature:** _____________
```

---

## 🎉 Conclusion

Following this checklist ensures:
- ✅ Safe deployment
- ✅ All features working
- ✅ Security rules active
- ✅ Monitoring in place
- ✅ Rollback plan ready

**After successful deployment:**
1. Notify team of new URL
2. Provide quick start guide
3. Monitor for first 48 hours
4. Collect user feedback
5. Plan next iteration

---

**Last Updated:** 2025-11-12
**Maintained By:** Credit Castor Development Team
