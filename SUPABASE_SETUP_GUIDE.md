# Supabase Storage Setup Guide (100% Free, No Credit Card Required)

Supabase offers **1GB free storage** and **2GB/month bandwidth** with **no credit card required** - perfect for your student app!

---

## 🎯 Why Supabase?

- ✅ **1GB free storage** (enough for hundreds of PDFs)
- ✅ **2GB/month free bandwidth**
- ✅ **No credit card required**
- ✅ **No billing setup needed**
- ✅ **Fast CDN delivery**
- ✅ **Easy setup** (5 minutes)

---

## 📋 Step-by-Step Setup

### Step 1: Create Supabase Account (2 min)

1. **Go to Supabase:**
   - Visit: https://supabase.com/
   - Click **"Start your project"** or **"Sign in"**

2. **Sign Up:**
   - Sign up with GitHub, Google, or email
   - Verify your email if needed

3. **Create New Project:**
   - Click **"New Project"**
   - Enter project name (e.g., "studentapp-storage")
   - Enter database password (save this securely)
   - Select a region (choose closest to your users)
   - Click **"Create new project"**
   - Wait 2-3 minutes for project to initialize

---

### Step 2: Create Storage Bucket (2 min)

1. **Navigate to Storage:**
   - In your Supabase project, click **"Storage"** in the left sidebar
   - You'll see the Storage dashboard

2. **Create Bucket:**
   - Click **"New bucket"**
   - **Bucket name:** `pdfs` (must be exactly this - the code expects this name)
   - **Public bucket:** ✅ **Check this box** (important for public PDF access)
   - Click **"Create bucket"**

3. **Verify Bucket:**
   - You should see `pdfs` bucket in the list
   - Make sure it shows as **"Public"**

---

### Step 3: Get API Credentials (1 min)

1. **Go to Project Settings:**
   - Click the **gear icon** (⚙️) in the left sidebar
   - Select **"API"**

2. **Copy Credentials:**
   - **Project URL:** Copy the "Project URL" (looks like: `https://xxxxx.supabase.co`)
   - **service_role key:** Copy the "service_role" key (starts with `eyJ...`)
     - ⚠️ **Important:** Use the **service_role** key, NOT the anon key
     - The service_role key bypasses Row-Level Security (RLS) for server-side uploads
     - Scroll down to find it - it's in the "Project API keys" section
     - It's longer than the anon key

3. **Save These:**
   - You'll need both for Render environment variables
   - **Keep the service_role key secret** - it has admin privileges!

---

### Step 4: Configure Render Environment Variables (2 min)

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com/
   - Select your backend service

2. **Add Environment Variables:**
   - Go to **"Environment"** tab
   - Click **"Add Environment Variable"**

   **Variable 1:**
   - **Key:** `STORAGE_MODE`
   - **Value:** `supabase`
   - Click **"Save Changes"**

   **Variable 2:**
   - **Key:** `SUPABASE_URL`
   - **Value:** (paste your Project URL from Step 3)
   - Click **"Save Changes"**

   **Variable 3:**
   - **Key:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** (paste your service_role key from Step 3)
   - ⚠️ **Important:** Use the **service_role** key, NOT the anon key
   - Click **"Save Changes"**

   **Optional Variable 4 (if you want to use anon key as fallback):**
   - **Key:** `SUPABASE_ANON_KEY`
   - **Value:** (paste your anon public key - optional, only if service_role not available)
   - Click **"Save Changes"**

3. **Verify:**
   - You should see all three variables listed

---

### Step 5: Install Dependencies

Make sure your `package.json` includes Supabase:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    ...
  }
}
```

If missing, add it:
```bash
cd app/backend
npm install @supabase/supabase-js
```

---

### Step 6: Deploy to Render

1. **Commit and Push:**
   ```bash
   git add .
   git commit -m "Add Supabase Storage support"
   git push
   ```

2. **Monitor Deployment:**
   - Render will auto-deploy
   - Check logs for: `[Supabase] Initialized successfully`
   - Check logs for: `[Storage] Using Supabase Storage for file uploads`

---

### Step 7: Test It!

1. **Upload a Test PDF:**
   - Go to your admin panel
   - Upload a PDF (question, concours, or library book)

2. **Check Supabase:**
   - Go to Supabase Console → Storage → `pdfs` bucket
   - You should see your uploaded file in a folder (e.g., `questions/`, `concours/`, `library/`)

3. **Verify URL:**
   - Check the PDF URL in your database
   - It should be: `https://xxxxx.supabase.co/storage/v1/object/public/pdfs/questions/filename.pdf`
   - Open the URL in a browser - it should work!

4. **Test in Mobile App:**
   - Open the PDF in your mobile app
   - It should load without any permission errors!

---

## ✅ Verification Checklist

- [ ] Supabase account created
- [ ] Project created and initialized
- [ ] `pdfs` bucket created (public)
- [ ] API credentials copied (URL and anon key)
- [ ] Environment variables set in Render:
  - [ ] `STORAGE_MODE=supabase`
  - [ ] `SUPABASE_URL` (your project URL)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (your service_role key - required for uploads)
- [ ] Dependencies installed (`@supabase/supabase-js`)
- [ ] Code committed and pushed
- [ ] Render deployment successful
- [ ] Test PDF uploaded successfully
- [ ] PDF accessible via URL
- [ ] PDF opens in mobile app

---

## 🔍 Troubleshooting

### Issue: "Supabase Storage not initialized"

**Solution:**
- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set correctly in Render
- Verify the values match what's in Supabase Console → API
- Make sure you're using the **service_role** key, not the anon key
- Check Render logs for initialization errors

### Issue: "new row violates row-level security policy"

**Solution:**
- This means you're using the anon key instead of the service_role key
- Go to Supabase Console → Settings → API
- Copy the **service_role** key (not the anon key)
- Update `SUPABASE_SERVICE_ROLE_KEY` in Render with the service_role key
- Redeploy your backend

### Issue: "Bucket not found" or "Bucket does not exist"

**Solution:**
- Make sure the bucket is named exactly `pdfs` (lowercase)
- Verify the bucket exists in Supabase Console → Storage
- Check that the bucket is set to **Public**

### Issue: "Permission denied" when accessing PDFs

**Solution:**
- Go to Supabase Console → Storage → `pdfs` bucket
- Click **"Edit bucket"**
- Make sure **"Public bucket"** is checked
- Click **"Update"**

### Issue: Files not appearing in Supabase Storage

**Solution:**
- Check Render logs for upload errors
- Verify `STORAGE_MODE=supabase` is set
- Check that the bucket name is `pdfs` (exactly)

### Issue: Build fails on Render

**Solution:**
- Check that `@supabase/supabase-js` is in `package.json`
- Verify all dependencies are listed
- Check build logs for specific error messages

---

## 📊 Free Tier Limits

**Storage:**
- **1GB** free storage
- Additional: $0.021/GB/month

**Bandwidth:**
- **2GB/month** free
- Additional: $0.09/GB

**For a student app:**
- 1GB = ~500-1000 PDFs (depending on size)
- 2GB/month = ~2000 PDF views/month
- You'll likely stay within free limits!

---

## 🎉 You're Done!

Once all steps are complete, your PDFs will be stored in Supabase Storage and accessible without any permission issues. The system will automatically use Supabase for all new uploads.

**No credit card required, completely free!** 🎊

---

## 📝 Quick Reference

**Supabase Console:** https://app.supabase.com/

**Render Dashboard:** https://dashboard.render.com/

**Environment Variables:**
```env
STORAGE_MODE=supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Use service_role key, not anon key!
```

**Bucket Name:** `pdfs` (must be exactly this)

**Bucket Settings:** Public ✅

---

If you encounter any issues, check the troubleshooting section or review the Render logs for specific error messages.

