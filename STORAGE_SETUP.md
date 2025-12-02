# PDF Storage Setup Guide

This app now supports **two storage options** for PDFs:

## Option 1: Direct Server Storage (Easiest - No Setup Required)

**Pros:**
- ✅ No external service needed
- ✅ Works immediately
- ✅ Free (uses your server's disk space)
- ✅ No access permission issues

**Cons:**
- ❌ Uses server disk space
- ❌ Requires server to be running to serve files

**Setup:**
1. No setup needed! It works by default.
2. Just make sure your server has enough disk space.
3. Files are stored in `app/backend/uploads/` directory.

**Environment Variables (Optional):**
```env
STORAGE_MODE=direct
API_URL=https://your-server-url.com  # For generating public URLs
```

---

## Option 2: Firebase Storage (Recommended for Production)

**Pros:**
- ✅ Scalable (5GB free tier)
- ✅ Fast CDN delivery
- ✅ No server disk usage
- ✅ Reliable and fast

**Cons:**
- ❌ Requires Firebase account setup
- ❌ Slightly more complex setup

**Setup Steps:**

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name and follow the wizard
4. Enable **Google Analytics** (optional)

### 2. Enable Storage
1. In Firebase Console, go to **Storage**
2. Click "Get started"
3. Start in **production mode** (or test mode for development)
4. Choose a location (e.g., `us-central1`)
5. Click "Done"

### 3. Get Service Account Key
1. Go to **Project Settings** (gear icon)
2. Go to **Service Accounts** tab
3. Click **Generate new private key**
4. Download the JSON file

### 4. Set Environment Variable
Add the service account JSON content to your `.env` file:

```env
STORAGE_MODE=firebase
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id",...}'
```

**OR** set it as a single-line JSON string (escape quotes):

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

### 5. Install Dependencies
```bash
cd app/backend
npm install firebase-admin uuid
```

### 6. Configure Storage Rules (Firebase Console)
Go to Storage → Rules and set:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;  // Public read access
      allow write: if false;  // Only server can write (via service account)
    }
  }
}
```

---

## Migration from Cloudinary

The new storage system is **automatically compatible** with existing code. Just update your controllers to use the new storage utility:

**Before (Cloudinary):**
```javascript
const { uploadBuffer } = require('../utils/cloudinary');
```

**After (Unified Storage):**
```javascript
const { uploadBuffer } = require('../utils/storage');
```

The API is the same, so existing code will work without changes!

---

## Testing

1. **Test Direct Storage:**
   - Upload a PDF through the admin panel
   - Check if it's accessible at: `http://your-server/uploads/questions/filename.pdf`

2. **Test Firebase Storage:**
   - Set `STORAGE_MODE=firebase` and configure Firebase
   - Upload a PDF
   - Check Firebase Console → Storage to see the file
   - Verify the URL works in the app

---

## Troubleshooting

### Direct Storage Issues:
- **Files not accessible:** Check that `API_URL` is set correctly
- **Permission errors:** Ensure `uploads/` directory has write permissions
- **404 errors:** Verify the file path matches the URL structure

### Firebase Issues:
- **Initialization error:** Check that `FIREBASE_SERVICE_ACCOUNT` JSON is valid
- **Upload fails:** Verify service account has Storage Admin permissions
- **Files not public:** Check Storage rules allow public read access

---

## Free Tier Limits

### Direct Server Storage:
- Limited by your server's disk space
- No bandwidth limits (but uses your server's bandwidth)

### Firebase Storage:
- **5GB** free storage
- **1GB/day** free downloads
- **20,000** operations/day free

For most apps, the free tier is sufficient!

