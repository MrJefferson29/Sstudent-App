# Render Deployment Guide for Firebase Storage

This is a quick reference for deploying your backend with Firebase Storage on Render.

## 🚀 Quick Setup Steps

### 1. Firebase Setup (5 minutes)
- Create Firebase project at https://console.firebase.google.com/
- Enable Storage
- Set Storage Rules: `allow read: if true; allow write: if false;`
- Generate Service Account key (Project Settings → Service Accounts)

### 2. Prepare Service Account JSON
- Download the JSON file
- Convert to single-line escaped string:
  - Use: https://www.freeformatter.com/json-escape.html
  - Or manually: remove line breaks, escape quotes with `\"`

### 3. Render Configuration
Add these environment variables in Render:

```
STORAGE_MODE=firebase
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

### 4. Deploy
- Push code to Git (Render auto-deploys)
- Or manually trigger deployment
- Check logs for: `[Firebase] Initialized successfully`

## 📋 Environment Variables Checklist

- [ ] `STORAGE_MODE=firebase`
- [ ] `FIREBASE_SERVICE_ACCOUNT` (escaped JSON string)
- [ ] `FIREBASE_STORAGE_BUCKET` (optional but recommended)
- [ ] `MONGODB_URI` (your database connection)
- [ ] `JWT_SECRET` (for authentication)
- [ ] `API_URL` (your Render service URL)

## 🔍 Verify Setup

After deployment, check Render logs for:
```
[Firebase] Initialized successfully
[Storage] Using Firebase Storage for file uploads
```

## 📖 Full Guide

See `FIREBASE_SETUP_GUIDE.md` for detailed step-by-step instructions.

## ❓ Common Issues

**"Firebase Storage not initialized"**
→ Check FIREBASE_SERVICE_ACCOUNT is set correctly

**"Permission denied"**
→ Check Firebase Storage Rules allow public read

**"Service account key invalid"**
→ Re-download and properly escape the JSON

