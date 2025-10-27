# Deployment Guide - Nilu Tourism Platform

This guide will walk you through deploying your application to production using Netlify (frontend) and Railway/Render (backend).

## Architecture Overview

```
┌─────────────────┐      HTTPS      ┌─────────────────┐
│   Netlify       │ ────────────────▶│  Railway/Render │
│   (Frontend)    │                  │  (Backend API)  │
│   React + Vite  │                  │  FastAPI + DB   │
└─────────────────┘                  └─────────────────┘
```

---

## Part 1: Deploy Backend (FastAPI + PostgreSQL)

### Option A: Railway (Recommended - Easiest)

Railway provides free PostgreSQL database and easy deployment.

#### Steps:

1. **Sign up at [Railway.app](https://railway.app)**
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your `izman48/nilu` repository
   - Select the repository

3. **Add PostgreSQL Database**
   - In your project, click "+ New"
   - Select "Database" → "PostgreSQL"
   - Railway will provision a database automatically

4. **Configure Backend Service**
   - Click on your backend service
   - Go to "Settings" tab
   - Set **Root Directory**: `backend`
   - Set **Build Command**: `pip install -r requirements.txt`
   - Set **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

5. **Set Environment Variables**
   - Go to "Variables" tab
   - Add the following variables:

   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   SECRET_KEY=<generate-a-secure-random-string>
   ENVIRONMENT=production
   BACKEND_CORS_ORIGINS=https://your-app-name.netlify.app,https://www.your-domain.com
   ```

   **To generate SECRET_KEY**:
   ```bash
   openssl rand -hex 32
   ```

6. **Optional: Add Firebase Storage**
   ```env
   USE_FIREBASE_STORAGE=true
   FIREBASE_CREDENTIALS_PATH=/app/firebase-credentials.json
   FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   ```

   Then upload your Firebase credentials JSON via Railway's file upload feature.

7. **Deploy**
   - Railway will automatically deploy
   - Get your backend URL (e.g., `https://nilu-backend-production.up.railway.app`)
   - Save this URL - you'll need it for the frontend!

8. **Run Database Migrations**
   - In Railway, go to your backend service
   - Click "Deployments" → Latest deployment → "View Logs"
   - Or connect via CLI and run:
   ```bash
   railway run alembic upgrade head
   ```

### Option B: Render

Similar to Railway but with slightly different interface:

1. Sign up at [Render.com](https://render.com)
2. Create "New Web Service"
3. Connect GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add PostgreSQL database from Render dashboard
6. Set environment variables (same as Railway)
7. Deploy

### Option C: Fly.io

More advanced but very powerful:

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Navigate to backend directory
cd backend

# Launch app
fly launch

# Add PostgreSQL
fly postgres create

# Attach database
fly postgres attach <postgres-app-name>

# Set environment variables
fly secrets set SECRET_KEY=<your-secret-key>
fly secrets set ENVIRONMENT=production

# Deploy
fly deploy
```

---

## Part 2: Deploy Frontend (React) to Netlify

### Prerequisites

- Backend must be deployed first (you need the backend URL)
- Your code must be pushed to GitHub

### Steps:

1. **Sign up at [Netlify](https://netlify.com)**
   - Sign in with GitHub

2. **Import Your Project**
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub"
   - Select `izman48/nilu` repository
   - Authorize Netlify to access your repo

3. **Configure Build Settings**

   Netlify will auto-detect the `netlify.toml` file, but verify:

   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

4. **Set Environment Variables**

   Before deploying, set the environment variable:

   - Go to "Site settings" → "Environment variables"
   - Click "Add a variable"
   - Add:
     ```
     Key: VITE_API_URL
     Value: https://your-backend-url.railway.app
     ```

   ⚠️ **Important**: Use your actual backend URL from Step 1!

5. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete (~2-3 minutes)
   - Get your site URL (e.g., `https://random-name-12345.netlify.app`)

6. **Set Custom Domain (Optional)**
   - Go to "Domain settings"
   - Click "Add custom domain"
   - Follow instructions to point your domain to Netlify
   - Netlify provides free SSL certificates automatically

7. **Update Backend CORS**

   Go back to your backend service (Railway/Render) and update CORS:

   ```env
   BACKEND_CORS_ORIGINS=https://your-app-name.netlify.app,https://www.your-domain.com
   ```

---

## Part 3: Post-Deployment Setup

### 1. Initialize Database

Your backend should auto-create tables via Alembic migrations, but to add initial data:

**Option A: Via Railway/Render Console**
```bash
railway run python init_db.py
# or
render run python init_db.py
```

**Option B: Via Database Client**
- Connect to your PostgreSQL database
- Run the SQL commands from `init_db.py` manually

### 2. Create First Admin User

Connect to your database and run:

```sql
-- Create a company
INSERT INTO companies (id, name, email, phone, address, is_active)
VALUES (
  'comp_' || substring(md5(random()::text), 1, 20),
  'Your Company Name',
  'admin@yourcompany.com',
  '+1234567890',
  '123 Business St',
  true
);

-- Create an admin user (replace company_id with the one above)
INSERT INTO users (
  id, email, full_name, hashed_password, is_active, is_admin,
  account_id, can_manage_bookings, can_view_reports
)
VALUES (
  'user_' || substring(md5(random()::text), 1, 20),
  'admin@yourcompany.com',
  'Admin User',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lk7QS.9xJFOu',  -- password: "admin123"
  true,
  true,
  'YOUR_COMPANY_ID_HERE',
  true,
  true
);
```

⚠️ **Change the default password immediately after first login!**

### 3. Test Your Deployment

1. Visit your Netlify URL
2. Log in with the admin credentials
3. Test creating a booking
4. Test uploading images
5. Check that all features work

---

## Part 4: Continuous Deployment

### Automatic Deployments

Both Netlify and Railway support automatic deployments:

**Frontend (Netlify):**
- Every push to `main` branch → auto-deploys frontend
- Pull requests → preview deployments

**Backend (Railway/Render):**
- Every push to `main` branch → auto-deploys backend
- Can configure to deploy specific branches

### Deployment Workflow

```bash
# 1. Make changes locally
git add .
git commit -m "feat: add new feature"

# 2. Push to GitHub
git push origin main

# 3. Automatic deployments trigger
# - Netlify rebuilds frontend
# - Railway rebuilds backend

# 4. Verify deployment
# - Check build logs
# - Test live site
```

---

## Part 5: Monitoring and Maintenance

### Check Logs

**Frontend (Netlify):**
- Go to "Deploys" → Select deployment → "Deploy log"
- Check browser console for errors

**Backend (Railway):**
- Go to your service → "Deployments" → "View Logs"
- Monitor for errors and warnings

### Database Backups

**Railway:**
- Automatic daily backups included
- Can download backups from dashboard

**Render:**
- Automatic backups on paid plans
- Export database manually via `pg_dump`

### Performance Monitoring

Consider adding:
- **Frontend**: Google Analytics, Sentry
- **Backend**: Sentry for error tracking
- **Uptime**: UptimeRobot, Pingdom

---

## Troubleshooting

### Frontend Can't Connect to Backend

**Error**: "Network Error" or CORS issues

**Solution**:
1. Check `VITE_API_URL` is set correctly in Netlify
2. Verify backend CORS settings include your Netlify URL
3. Check backend is running (visit backend URL in browser)
4. Look at browser console for specific error

### Database Connection Failed

**Error**: "Could not connect to database"

**Solution**:
1. Check `DATABASE_URL` is set correctly
2. Verify database is running
3. Check database credentials
4. Ensure IP allowlist includes Railway/Render IPs

### Build Failed on Netlify

**Error**: "Build failed" or "Command failed with exit code 1"

**Solution**:
1. Check build logs in Netlify dashboard
2. Verify `package.json` has all dependencies
3. Test build locally: `cd frontend && npm run build`
4. Check Node version matches (18.x)

### Images Not Loading

**Solution**:
1. Check if using Firebase or local storage
2. For Firebase: verify credentials and bucket settings
3. For local: images won't persist on Railway (use Firebase)
4. Check file upload limits

---

## Cost Estimates

### Free Tier (Suitable for MVP/Testing)

- **Netlify**: 100 GB bandwidth/month, free SSL
- **Railway**: $5 free credit/month (enough for small projects)
- **Render**: Free tier available (apps sleep after inactivity)

### Production (Expected Costs)

**Small Business (< 100 bookings/month):**
- Netlify: $0-19/month
- Railway: $5-20/month
- Total: **$5-39/month**

**Medium Business (< 1000 bookings/month):**
- Netlify: $19/month
- Railway: $20-50/month
- Total: **$39-69/month**

---

## Security Checklist

Before going live:

- [ ] Change default admin password
- [ ] Set strong `SECRET_KEY`
- [ ] Enable HTTPS (automatic with Netlify)
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Review user permissions
- [ ] Enable Firebase security rules
- [ ] Set up error monitoring (Sentry)
- [ ] Configure rate limiting
- [ ] Review sensitive data in logs

---

## Quick Reference

### Environment Variables Needed

**Frontend (Netlify):**
```env
VITE_API_URL=https://your-backend-url.railway.app
```

**Backend (Railway/Render):**
```env
DATABASE_URL=<auto-provided-by-railway>
SECRET_KEY=<generate-random-32-char-string>
ENVIRONMENT=production
BACKEND_CORS_ORIGINS=https://your-app.netlify.app
USE_FIREBASE_STORAGE=true  # optional
FIREBASE_CREDENTIALS_PATH=/app/firebase-credentials.json  # optional
FIREBASE_STORAGE_BUCKET=your-project.appspot.com  # optional
```

### Useful Commands

```bash
# Test frontend build locally
cd frontend && npm run build && npm run preview

# Test backend locally
cd backend && uvicorn app.main:app --reload

# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Check backend health
curl https://your-backend-url.railway.app/health
```

---

## Support

For deployment issues:
- **Netlify**: https://docs.netlify.com
- **Railway**: https://docs.railway.app
- **Render**: https://render.com/docs
- **This Project**: Create an issue on GitHub

---

## Next Steps

After deployment:
1. Test all features thoroughly
2. Set up monitoring and alerts
3. Configure custom domain
4. Set up email notifications (SMTP)
5. Enable SMS notifications (Twilio)
6. Configure Firebase Storage for production images
7. Set up regular database backups
8. Document your deployment-specific configurations

Good luck with your deployment! 🚀
