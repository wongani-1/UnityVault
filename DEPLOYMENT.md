# Deployment Guide - Render & Vercel

This guide walks through deploying the UnityVault application with:
- **Backend API** on Render
- **Frontend** on Vercel
- **Database** on Supabase

## Prerequisites

1. **Git Repository**: Push your code to GitHub/GitLab/Bitbucket
2. **Supabase Account**: Sign up at https://supabase.com
3. **Render Account**: Sign up at https://render.com
4. **Vercel Account**: Sign up at https://vercel.com

---

## Part 1: Database Setup (Supabase)

### 1.1 Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in project details (name, database password, region)
4. Wait for project to be created (~2 minutes)

### 1.2 Run Database Migrations
1. In your Supabase project dashboard, go to **SQL Editor**
2. Run the schema migration:
   - Click "New Query"
   - Copy content from `server/supabase/schema.sql`
   - Paste and click "Run"
3. Run additional migrations if any:
   - `server/supabase/name_columns_migration.sql`
   - `server/supabase/distribution_migration.sql`

### 1.3 Get Supabase Credentials
1. Go to **Project Settings** > **API**
2. Copy the following:
   - **Project URL** (SUPABASE_URL)
   - **service_role key** (SUPABASE_SERVICE_ROLE_KEY) - Important: Use service_role, not anon key

---

## Part 2: Backend Deployment (Render)

### 2.1 Create Web Service
1. Go to https://dashboard.render.com
2. Click "New +" > "Web Service"
3. Connect your Git repository
4. Configure the service:
   - **Name**: `unityvault-api`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or paid for production)

### 2.2 Configure Environment Variables
In the Render dashboard, add these environment variables:

**Required Variables:**
```
NODE_ENV=production
PORT=10000
DATA_STORE=supabase
JWT_SECRET=<generate-random-string-32-chars>
SESSION_SECRET=<generate-random-string-32-chars>
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
```

**Important Variables (set before frontend deployment):**
```
CORS_ORIGIN=<your-vercel-frontend-url>
APP_BASE_URL=<your-vercel-frontend-url>
```
*Note: Update these after deploying the frontend in Part 3*

**Optional Variables:**
```
GMAIL_USER=<your-gmail-address>
GMAIL_PASS=<your-gmail-app-password>
PAYCHANGU_MOCK_MODE=true
PAYCHANGU_API_TOKEN=
PAYCHANGU_API_URL=https://api.paychangu.com
```

**To generate secure secrets:**
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Or use online tool: https://generate-secret.vercel.app/32
```

### 2.3 Deploy
1. Click "Create Web Service"
2. Render will automatically deploy
3. Wait for deployment to complete (~3-5 minutes)
4. Note your backend URL: `https://unityvault-api-xxxx.onrender.com`

### 2.4 Test Backend
```bash
curl https://unityvault-api-xxxx.onrender.com/health
# Should return: {"status":"ok"}
```

---

## Part 3: Frontend Deployment (Vercel)

### 3.1 Create Project
1. Go to https://vercel.com/dashboard
2. Click "Add New" > "Project"
3. Import your Git repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./ ` (leave as root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3.2 Configure Environment Variables
Add this environment variable in Vercel:

```
VITE_API_URL=https://unityvault-api-xxxx.onrender.com/api
```

*Replace with your actual Render backend URL from Part 2. Note: Include the `/api` suffix*

### 3.3 Deploy
1. Click "Deploy"
2. Wait for deployment (~2-3 minutes)
3. Note your frontend URL: `https://unityvault-xyz.vercel.app`

---

## Part 4: Update Backend CORS

After frontend deployment, update your backend CORS settings:

### 4.1 Update Render Environment Variables
1. Go to Render dashboard > Your web service
2. Go to "Environment" tab
3. Update these variables:
   ```
   CORS_ORIGIN=https://unityvault-xyz.vercel.app
   APP_BASE_URL=https://unityvault-xyz.vercel.app
   ```
4. Click "Save Changes"
5. Render will automatically redeploy

---

## Part 5: Configure Frontend API URL

### 5.1 Update API Configuration
Check if your frontend has an API configuration file. If it uses environment variables:

1. In Vercel dashboard, go to your project
2. Go to "Settings" > "Environment Variables"
3. Ensure `VITE_API_URL` is set to your Render backend URL
4. If you made changes, redeploy:
   - Go to "Deployments" tab
   - Click "..." on latest deployment
   - Click "Redeploy"

### 5.2 Check src/lib/api.ts
The API client should use the environment variable:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
```

---

## Part 6: Verify Deployment

### 6.1 Test Backend
```bash
# Health check
curl https://unityvault-api-xxxx.onrender.com/health

# Test CORS
curl -H "Origin: https://unityvault-xyz.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://unityvault-api-xxxx.onrender.com/api/auth/me
```

### 6.2 Test Frontend
1. Visit your Vercel URL: `https://unityvault-xyz.vercel.app`
2. Try to register/login
3. Check browser console for any errors
4. Test API connectivity

---

## Part 7: Custom Domain (Optional)

### 7.1 Add Domain to Vercel
1. In Vercel project settings > "Domains"
2. Add your domain (e.g., `app.unityvault.com`)
3. Follow DNS configuration instructions

### 7.2 Add Domain to Render
1. In Render service settings > "Custom Domain"
2. Add your API domain (e.g., `api.unityvault.com`)
3. Follow DNS configuration instructions

### 7.3 Update Environment Variables
After adding custom domains, update:

**In Render:**
```
CORS_ORIGIN=https://app.unityvault.com
APP_BASE_URL=https://app.unityvault.com
```

**In Vercel:**
```
VITE_API_URL=https://api.unityvault.com/api
```

---

## Troubleshooting

### Backend Issues

**Build fails on Render:**
- Check build logs in Render dashboard
- Verify `server/package.json` has correct scripts
- Ensure TypeScript compiles: `npm run build` locally

**Health check fails:**
- Check application logs
- Verify PORT environment variable is set
- Ensure app listens on `0.0.0.0` not `localhost`

**Database connection fails:**
- Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- Check Supabase project is active
- Verify migrations ran successfully

**CORS errors:**
- Verify CORS_ORIGIN includes your Vercel URL
- Check for trailing slashes in URLs
- Review CORS configuration in `server/src/app.ts`

### Frontend Issues

**Build fails on Vercel:**
- Check build logs in Vercel dashboard
- Test build locally: `npm run build`
- Check for environment variable issues

**API calls fail:**
- Open browser DevTools > Network tab
- Check if requests go to correct backend URL
- Verify VITE_API_URL is set correctly
- Check CORS headers in response

**Page not found on reload:**
- Verify `vercel.json` has rewrite rules
- Should redirect all routes to `index.html`

---

## Monitoring & Maintenance

### Logs
- **Render**: Dashboard > Your service > Logs
- **Vercel**: Dashboard > Your project > Deployments > View Function Logs
- **Supabase**: Dashboard > Logs section

### Auto-Deploy
Both Render and Vercel support auto-deploy:
- Push to `main` branch triggers automatic deployment
- Configure in service/project settings

### Scaling
- **Render Free Tier**: Spins down after 15 minutes of inactivity
- **Paid Tiers**: Always-on, auto-scaling
- Monitor usage in respective dashboards

---

## Security Checklist

- [ ] JWT_SECRET and SESSION_SECRET are strong random strings
- [ ] SUPABASE_SERVICE_ROLE_KEY is kept secret (never in frontend)
- [ ] CORS_ORIGIN is set to only your frontend domain(s)
- [ ] Gmail credentials use App Password (not account password)
- [ ] Environment variables are set in dashboard (not in code)
- [ ] HTTPS is enabled on all domains
- [ ] Database Row Level Security (RLS) is configured in Supabase

---

## Quick Reference

### Render Commands
```bash
# View logs
# (Use Render dashboard)

# Manual deploy
# Push to your git branch connected to Render
```

### Vercel Commands
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from terminal
vercel --prod

# View logs
vercel logs
```

### Environment Variables Summary

**Backend (Render):**
- NODE_ENV=production
- PORT=10000
- JWT_SECRET
- SESSION_SECRET
- DATA_STORE=supabase
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- CORS_ORIGIN
- APP_BASE_URL
- GMAIL_USER (optional)
- GMAIL_PASS (optional)
- PAYCHANGU_MOCK_MODE
- PAYCHANGU_API_TOKEN (optional)

**Frontend (Vercel):**
- VITE_API_URL

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs

---

## Estimated Costs

### Free Tier
- **Render**: 750 hours/month (Free tier, spins down after inactivity)
- **Vercel**: 100 GB bandwidth, unlimited deployments
- **Supabase**: 500 MB database, 1 GB file storage

### Paid Options
- **Render Starter**: $7/month (always-on)
- **Vercel Pro**: $20/month (team features, more bandwidth)
- **Supabase Pro**: $25/month (8 GB database, 100 GB storage)

---

*Last updated: February 2026*
