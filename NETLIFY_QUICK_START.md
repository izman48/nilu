# Netlify Quick Start Guide

Deploy your Nilu Tourism Platform to Netlify in **under 10 minutes**.

## Prerequisites

- [x] Backend deployed (Railway, Render, or Fly.io)
- [x] Backend URL ready (e.g., `https://your-backend.railway.app`)
- [x] Code pushed to GitHub

## Step-by-Step Deployment

### 1. Sign Up / Log In to Netlify

Go to [netlify.com](https://netlify.com) and sign in with GitHub.

### 2. Import Project

1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"GitHub"**
3. Select **`izman48/nilu`** repository
4. Authorize Netlify if prompted

### 3. Configure Build Settings

Netlify will auto-detect settings from `netlify.toml`, but verify:

```
Base directory:     frontend
Build command:      npm run build
Publish directory:  frontend/dist
```

### 4. Add Environment Variable

**CRITICAL**: Add your backend URL

1. Click **"Add environment variables"**
2. Add variable:
   ```
   Key:    VITE_API_URL
   Value:  https://your-backend-url.railway.app
   ```

   ⚠️ Replace with your actual backend URL!

### 5. Deploy

Click **"Deploy"** and wait ~2 minutes.

### 6. Update Backend CORS

Your backend needs to allow requests from Netlify:

1. Go to your backend hosting (Railway/Render)
2. Update environment variable:
   ```
   BACKEND_CORS_ORIGINS=https://your-site.netlify.app
   ```
3. Replace `your-site.netlify.app` with your actual Netlify URL

### 7. Test

Visit your Netlify URL and test:
- [ ] Login works
- [ ] Can create bookings
- [ ] Can upload images
- [ ] All pages load correctly

## Common Issues

### "Network Error" when logging in

**Cause**: Backend URL not set or incorrect

**Fix**:
1. Go to Netlify → Site settings → Environment variables
2. Check `VITE_API_URL` is correct
3. Redeploy site

### CORS Error

**Cause**: Backend not allowing requests from Netlify

**Fix**:
1. Add your Netlify URL to backend `BACKEND_CORS_ORIGINS`
2. Format: `https://your-site.netlify.app` (no trailing slash)

### Images Not Loading

**Cause**: Using local storage (doesn't persist on backend)

**Fix**: Enable Firebase Storage (see `FIREBASE_SETUP.md`)

## Custom Domain

Want to use your own domain? (e.g., `bookings.yourcompany.com`)

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain
4. Update DNS records (Netlify provides instructions)
5. SSL certificate is automatic and free!

## Automatic Deployments

Every time you push to GitHub `main` branch:
- ✅ Netlify automatically rebuilds and deploys
- ✅ Takes ~2-3 minutes
- ✅ Zero downtime

## Next Steps

- [ ] Set up custom domain
- [ ] Configure Firebase Storage for images
- [ ] Test all features thoroughly
- [ ] Change admin password
- [ ] Set up monitoring (optional)

## Need Help?

- 📖 Full guide: See `DEPLOYMENT.md`
- 🔥 Firebase setup: See `FIREBASE_SETUP.md`
- 📧 Netlify support: https://docs.netlify.com

---

**Your site is live! 🎉**

Share the URL with your team and start using it!
