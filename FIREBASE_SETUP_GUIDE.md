# Firebase Storage Setup Guide for Render Deployment

This guide will walk you through setting up Firebase Storage for your backend deployed on Render.

## 📋 Prerequisites

- A Google account
- Access to your Render dashboard
- Your backend code ready to deploy

---

## Step 1: Create Firebase Project

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Create a New Project:**
   - Click **"Add project"** or **"Create a project"**
   - Enter project name (e.g., "studentapp-storage")
   - Click **Continue**

3. **Configure Google Analytics (Optional):**
   - You can enable or disable Google Analytics
   - Click **Continue** → **Create project**
   - Wait for project creation (30-60 seconds)
   - Click **Continue**

---

## Step 2: Enable Billing (Required for Storage)

**Important:** Firebase Storage requires the Blaze (pay-as-you-go) plan, BUT you get generous free tier limits and won't be charged if you stay within them.

1. **Upgrade to Blaze Plan:**
   - In Firebase Console, click **"Upgrade"** button (or go to Project Settings → Usage and billing)
   - Click **"Select plan"** → Choose **"Blaze (Pay as you go)"**
   - Click **"Continue"**

2. **Add Payment Method:**
   - You'll be asked to add a payment method (credit card)
   - **Don't worry** - you won't be charged unless you exceed free limits:
     - 5GB free storage
     - 1GB/day free downloads
     - 20,000 operations/day free
   - Enter your payment details and click **"Complete"**

3. **Verify Free Tier:**
   - You'll see your free tier limits displayed
   - For a student app, you'll likely never exceed these limits

## Step 3: Enable Firebase Storage

1. **Navigate to Storage:**
   - In Firebase Console, click **Storage** in the left sidebar
   - If you see "Get started", click it

2. **Set Up Storage:**
   - Click **"Get started"**
   - Choose **"Start in production mode"** (recommended)
   - Select a **location** (choose closest to your users, e.g., `us-central1`)
   - Click **"Done"**

3. **Wait for Storage to Initialize:**
   - This takes about 1-2 minutes
   - You'll see "Cloud Storage for Firebase is ready"

---

## Step 4: Configure Storage Rules

1. **Go to Storage Rules:**
   - In Storage section, click **"Rules"** tab

2. **Set Public Read Access:**
   - Replace the default rules with:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         // Allow public read access (anyone can view PDFs)
         allow read: if true;
         // Only server can write (via service account)
         allow write: if false;
       }
     }
   }
   ```

3. **Publish Rules:**
   - Click **"Publish"**
   - Confirm the changes

---

## Step 5: Create Service Account

1. **Go to Project Settings:**
   - Click the **gear icon** (⚙️) next to "Project Overview"
   - Select **"Project settings"**

2. **Navigate to Service Accounts:**
   - Click **"Service accounts"** tab
   - You'll see "Firebase Admin SDK"

3. **Generate Private Key:**
   - Click **"Generate new private key"**
   - A dialog will appear warning about keeping the key secure
   - Click **"Generate key"**
   - A JSON file will download automatically

4. **Save the JSON File:**
   - Keep this file safe! It contains sensitive credentials
   - **DO NOT** commit this file to Git
   - The file looks like:
   ```json
   {
     "type": "service_account",
     "project_id": "your-project-id",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
     "client_id": "...",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "..."
   }
   ```

---

## Step 6: Prepare Service Account for Render

You need to convert the JSON file to a single-line string for Render's environment variables.

### Option A: Using Online Tool (Easiest)

1. **Open the JSON file** in a text editor
2. **Copy the entire content**
3. **Go to:** https://www.freeformatter.com/json-escape.html
4. **Paste the JSON** in the input box
5. **Click "Escape JSON"**
6. **Copy the escaped result** (single-line string)

### Option B: Using Command Line

**On Windows (PowerShell):**
```powershell
$json = Get-Content "path\to\serviceAccountKey.json" -Raw
$json -replace "`n", "" -replace "`r", "" -replace '"', '\"'
```

**On Mac/Linux:**
```bash
cat serviceAccountKey.json | jq -c . | sed 's/"/\\"/g'
```

### Option C: Manual (Simple)

1. Open the JSON file
2. Remove all line breaks (make it one line)
3. Escape all double quotes by adding backslash: `"` → `\"`
4. Example:
   ```json
   {"type":"service_account","project_id":"my-project",...}
   ```
   Becomes:
   ```
   {\"type\":\"service_account\",\"project_id\":\"my-project\",...}
   ```

---

## Step 7: Configure Render Environment Variables

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com/
   - Sign in to your account

2. **Select Your Backend Service:**
   - Click on your backend service (or create a new one)

3. **Go to Environment:**
   - Click **"Environment"** in the left sidebar
   - Or click **"Environment Variables"** tab

4. **Add Environment Variables:**

   **Variable 1: Storage Mode**
   - **Key:** `STORAGE_MODE`
   - **Value:** `firebase`
   - Click **"Save Changes"**

   **Variable 2: Firebase Service Account**
   - **Key:** `FIREBASE_SERVICE_ACCOUNT`
   - **Value:** Paste the escaped JSON string from Step 5
   - **Important:** Make sure it's all on one line with escaped quotes
   - Click **"Save Changes"**

   **Variable 3: Storage Bucket (Optional but Recommended)**
   - **Key:** `FIREBASE_STORAGE_BUCKET`
   - **Value:** `your-project-id.appspot.com`
   - (Replace `your-project-id` with your actual Firebase project ID)
   - You can find this in the service account JSON as `project_id`
   - Click **"Save Changes"**

5. **Verify Variables:**
   - You should see all three variables listed
   - Make sure `FIREBASE_SERVICE_ACCOUNT` is not truncated (Render shows full value)

---

## Step 8: Update Backend Dependencies

Make sure your `package.json` includes Firebase:

1. **Check `app/backend/package.json`:**
   ```json
   {
     "dependencies": {
       "firebase-admin": "^12.7.0",
       "uuid": "^9.0.1",
       ...
     }
   }
   ```

2. **If missing, add them:**
   ```bash
   cd app/backend
   npm install firebase-admin uuid
   ```

3. **Commit and push:**
   ```bash
   git add package.json package-lock.json
   git commit -m "Add Firebase Storage dependencies"
   git push
   ```

---

## Step 9: Deploy to Render

1. **Trigger Deployment:**
   - Render will auto-deploy if connected to Git
   - Or manually click **"Manual Deploy"** → **"Deploy latest commit"**

2. **Monitor Build Logs:**
   - Watch the build process
   - Look for: `[Firebase] Initialized successfully`
   - If you see errors, check the logs

3. **Check Runtime Logs:**
   - After deployment, check **"Logs"** tab
   - You should see: `[Storage] Using Firebase Storage for file uploads`

---

## Step 10: Test Firebase Storage

1. **Upload a Test PDF:**
   - Go to your admin panel
   - Upload a PDF (question, concours, or library book)

2. **Check Firebase Console:**
   - Go to Firebase Console → Storage
   - You should see the uploaded file in the `questions/`, `concours/`, or `library/` folder

3. **Verify URL:**
   - Check the PDF URL in your database
   - It should be: `https://storage.googleapis.com/your-project-id.appspot.com/questions/filename.pdf`
   - Open the URL in a browser - it should work!

4. **Test in Mobile App:**
   - Open the PDF in your mobile app
   - It should load without any permission errors

---

## 🔍 Troubleshooting

### Issue: "Firebase Storage not initialized"

**Solution:**
- Check that `FIREBASE_SERVICE_ACCOUNT` is set correctly in Render
- Verify the JSON is properly escaped (single line, escaped quotes)
- Check build logs for initialization errors

### Issue: "Permission denied" when accessing PDFs

**Solution:**
- Go to Firebase Console → Storage → Rules
- Make sure rules allow `read: if true`
- Click "Publish" to save changes

### Issue: "Service account key invalid"

**Solution:**
- Re-download the service account key from Firebase
- Make sure you copied the entire JSON (including all fields)
- Re-escape it properly

### Issue: Files not appearing in Firebase Storage

**Solution:**
- Check Render logs for upload errors
- Verify `STORAGE_MODE=firebase` is set
- Check that Firebase Storage is enabled in Firebase Console

### Issue: Build fails on Render

**Solution:**
- Check that `firebase-admin` and `uuid` are in `package.json`
- Verify all dependencies are listed
- Check build logs for specific error messages

---

## ✅ Verification Checklist

- [ ] Firebase project created
- [ ] Storage enabled and initialized
- [ ] Storage rules set to allow public read
- [ ] Service account key downloaded
- [ ] Service account JSON escaped and added to Render
- [ ] `STORAGE_MODE=firebase` set in Render
- [ ] `FIREBASE_STORAGE_BUCKET` set in Render (optional)
- [ ] Backend dependencies installed (`firebase-admin`, `uuid`)
- [ ] Code committed and pushed
- [ ] Render deployment successful
- [ ] Test PDF uploaded successfully
- [ ] PDF accessible via URL
- [ ] PDF opens in mobile app

---

## 📝 Quick Reference

**Firebase Console:** https://console.firebase.google.com/

**Render Dashboard:** https://dashboard.render.com/

**Environment Variables Needed:**
```env
STORAGE_MODE=firebase
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

**Storage Rules:**
```javascript
allow read: if true;
allow write: if false;
```

---

## 🎉 You're Done!

Once all steps are complete, your PDFs will be stored in Firebase Storage and accessible without any permission issues. The system will automatically use Firebase for all new uploads.

If you encounter any issues, check the troubleshooting section or review the Render logs for specific error messages.

