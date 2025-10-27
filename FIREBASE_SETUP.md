# Firebase Storage Setup Guide

This application supports **optional** Firebase Storage for storing uploaded files (car images, booking photos, documents). By default, files are stored locally, but you can enable Firebase Storage for cloud-based storage with better scalability and CDN capabilities.

## Why Use Firebase Storage?

- **Cloud-based**: Files are stored in Google Cloud, not on your server
- **CDN**: Faster image loading worldwide
- **Scalable**: No disk space limitations
- **Reliable**: Automatic backups and redundancy
- **Free tier**: 5 GB storage and 1 GB/day download free

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project" or select an existing project
3. Give your project a name (e.g., "Nilu Tourism")
4. Disable Google Analytics if you don't need it
5. Click "Create Project"

### 2. Enable Firebase Storage

1. In your Firebase project, click "Storage" in the left sidebar
2. Click "Get Started"
3. Choose "Start in test mode" for now (we'll set proper rules later)
4. Select a Cloud Storage location (choose one close to your users)
5. Click "Done"

### 3. Get Service Account Credentials

1. Click the gear icon ⚙️ next to "Project Overview"
2. Select "Project Settings"
3. Go to the "Service Accounts" tab
4. Click "Generate New Private Key"
5. Click "Generate Key" - a JSON file will download
6. **Important**: Keep this file secure! It contains sensitive credentials

### 4. Configure Your Application

#### Option A: Docker Setup (Recommended for Production)

1. Copy the downloaded JSON file to your server
2. Update your `.env` file:

```env
USE_FIREBASE_STORAGE=true
FIREBASE_CREDENTIALS_PATH=/app/firebase-credentials.json
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

3. Mount the credentials file in `docker-compose.yml`:

```yaml
services:
  backend:
    volumes:
      - ./firebase-credentials.json:/app/firebase-credentials.json:ro
      # ... other volumes
```

4. Restart your backend container:

```bash
docker-compose restart backend
```

#### Option B: Local Development

1. Place the JSON file in your backend directory
2. Update your `.env` file:

```env
USE_FIREBASE_STORAGE=true
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

3. Restart your backend server

### 5. Set Storage Security Rules

In Firebase Console > Storage > Rules, update the rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow public read access to all files
    match /{allPaths=**} {
      allow read;
      allow write: if false;  // Only server (via admin SDK) can write
    }
  }
}
```

This ensures:
- Anyone can view uploaded images (public URLs)
- Only your backend can upload files (via service account)

## Verification

### Check if Firebase is Active

1. Upload a car image in your application
2. Check the browser developer tools (Network tab)
3. Look for the image URL:
   - **Firebase**: URL will be like `https://firebasestorage.googleapis.com/...`
   - **Local**: URL will be like `http://localhost:8000/uploads/...`

### Fallback Behavior

If Firebase is misconfigured, the application automatically falls back to local storage. Check backend logs for warnings:

```
WARNING: Firebase storage is enabled but firebase-admin is not installed. Falling back to local storage.
```

or

```
WARNING: Failed to initialize Firebase storage: [error details]. Falling back to local storage.
```

## Disabling Firebase Storage

To switch back to local storage:

1. Update your `.env` file:

```env
USE_FIREBASE_STORAGE=false
```

2. Restart your backend
3. All new uploads will go to local storage
4. Existing Firebase images will still work via their URLs

## Migrating Existing Files

### From Local to Firebase

```python
# Run this script to migrate local files to Firebase
# (Coming soon - create a migration script if needed)
```

### From Firebase to Local

Images stored in Firebase will continue to work via their public URLs. No migration needed.

## Storage Costs

Firebase Storage pricing (as of 2024):

- **Storage**: $0.026 per GB/month
- **Download**: $0.12 per GB
- **Free tier**: 5 GB storage + 1 GB/day download

For most small to medium businesses, you'll stay within the free tier.

## Troubleshooting

### "Permission Denied" Error

**Cause**: Storage security rules are too restrictive

**Solution**: Update rules to allow public read (see step 5 above)

### "File Not Found" Error

**Cause**: FIREBASE_STORAGE_BUCKET is incorrect

**Solution**: Check that the bucket name matches your Firebase project

### Images Not Loading

**Cause**: Firebase URL is not being generated correctly

**Solution**: Check that USE_FIREBASE_STORAGE=true in .env

## Security Best Practices

1. **Never commit** `firebase-credentials.json` to git
2. Add it to `.gitignore`:
   ```
   firebase-credentials.json
   *-firebase-adminsdk-*.json
   ```
3. Use environment variables for sensitive config
4. Rotate service account keys periodically
5. Monitor Firebase usage in the console

## Support

For issues:
1. Check backend logs for Firebase errors
2. Verify credentials file is readable by backend
3. Test Firebase connection with `firebase-admin` directly
4. Contact Firebase support for project-specific issues
