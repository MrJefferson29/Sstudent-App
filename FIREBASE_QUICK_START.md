# 🚀 Firebase Storage Quick Start for Render

## Step-by-Step Setup (15 minutes)

### Step 1: Create Firebase Project (3 min)
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Enter project name → Continue → Create project

### Step 2: Enable Billing (Required) (3 min)
**Note:** Firebase requires Blaze plan for Storage, but you get free tier limits (5GB storage, 1GB/day downloads) and won't be charged if you stay within them.

1. Click "Upgrade" → Select "Blaze (Pay as you go)"
2. Add payment method (won't be charged if within free tier)
3. Verify free tier limits are shown

### Step 3: Enable Storage (2 min)
1. Click "Storage" in sidebar
2. Click "Get started"
3. Choose "Production mode"
4. Select location (e.g., `us-central1`)
5. Click "Done"

### Step 4: Set Storage Rules (1 min)
1. Go to Storage → Rules tab
2. Replace with:
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
3. Click "Publish"

### Step 5: Get Service Account Key (2 min)
1. Click ⚙️ → Project settings
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file

### Step 6: Convert JSON for Render (2 min)
1. Open the JSON file
2. Go to https://www.freeformatter.com/json-escape.html
3. Paste JSON → Click "Escape JSON"
4. Copy the escaped result (single-line string)

### Step 7: Configure Render (3 min)
1. Go to https://dashboard.render.com/
2. Select your backend service
3. Go to Environment → Add variables:

   **Variable 1:**
   - Key: `STORAGE_MODE`
   - Value: `firebase`

   **Variable 2:**
   - Key: `FIREBASE_SERVICE_ACCOUNT`
   - Value: (paste escaped JSON from Step 5)

   **Variable 3:**
   - Key: `FIREBASE_STORAGE_BUCKET`
   - Value: `your-project-id.appspot.com`
   - (Find `project_id` in the JSON file)

4. Click "Save Changes"

### Step 8: Deploy (2 min)
1. Render will auto-deploy (or click "Manual Deploy")
2. Check logs for: `[Firebase] Initialized successfully`
3. Done! ✅

## ✅ Verification

After deployment, check Render logs:
```
[Firebase] Initialized successfully
[Storage] Using Firebase Storage for file uploads
```

Upload a test PDF and check Firebase Console → Storage to see it.

## 📚 Full Documentation

- **Detailed Guide:** `FIREBASE_SETUP_GUIDE.md`
- **Render Specific:** `RENDER_DEPLOYMENT.md`

## ❓ Need Help?

Check the troubleshooting section in `FIREBASE_SETUP_GUIDE.md`

