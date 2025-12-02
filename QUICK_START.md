# Quick Start: PDF Storage Setup

## ✅ Easiest Option: Direct Server Storage (Works Immediately)

**No setup needed!** The app now uses direct server storage by default. PDFs are stored on your server and served via public URLs.

### What You Need to Do:

1. **Install dependencies:**
   ```bash
   cd app/backend
   npm install
   ```

2. **Set your server URL (optional but recommended):**
   Add to `app/backend/.env`:
   ```env
   API_URL=https://your-server-url.com
   # OR for local development:
   API_URL=http://localhost:5000
   ```

3. **That's it!** Upload PDFs through the admin panel and they'll work immediately.

### How It Works:
- PDFs are stored in `app/backend/uploads/` directory
- They're accessible at: `https://your-server-url.com/uploads/questions/filename.pdf`
- No external services needed
- No access permission issues

---

## 🚀 Better Option: Firebase Storage (For Production)

If you want better performance and scalability, use Firebase Storage:

### Quick Setup:

1. **Create Firebase Project:**
   - Go to https://console.firebase.google.com/
   - Create a new project
   - Enable Storage

2. **Get Service Account:**
   - Project Settings → Service Accounts
   - Generate new private key
   - Download JSON file

3. **Add to `.env`:**
   ```env
   STORAGE_MODE=firebase
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'  # Paste entire JSON here
   ```

4. **Install Firebase:**
   ```bash
   cd app/backend
   npm install firebase-admin uuid
   ```

5. **Set Storage Rules (Firebase Console → Storage → Rules):**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read: if true;
         allow write: if false;
       }
     }
   }
   ```

**Done!** Your PDFs will now be stored in Firebase and accessible without any permission issues.

---

## 📝 What Changed?

- ✅ All PDF uploads now use the new unified storage system
- ✅ No more Cloudinary access permission issues
- ✅ Works with direct storage (default) or Firebase (optional)
- ✅ Same API - no code changes needed in your app

---

## 🧪 Test It:

1. Upload a PDF through the admin panel
2. Check the PDF URL in the database
3. Open the URL in your browser - it should work!
4. Open it in the mobile app - it should work!

---

## ❓ Need Help?

See `STORAGE_SETUP.md` for detailed instructions and troubleshooting.

