# UnityVault Deployment Guide

This guide explains how to deploy UnityVault to Vercel (frontend) and Render (backend).

## Prerequisites

1. **GitHub Repository**: Your code must be pushed to GitHub (already done ✓)
2. **Vercel Account**: Create at [vercel.com](https://vercel.com)
3. **Render Account**: Create at [render.com](https://render.com)
4. **Supabase Project**: Already configured with credentials

## Step 1: Deploy Backend to Render

### 1.1 Connect GitHub to Render
1. Go to [render.com](https://render.com) and sign in with GitHub
2. Click "New +" → Select "Web Service"
3. Select your UnityVault repository
4. Configure the deployment:
   - **Name**: `unityvault-backend`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (upgraded later if needed)

### 1.2 Set Environment Variables on Render

In the "Environment" section of Render dashboard, add:

```
PORT=4000
NODE_ENV=production
DATA_STORE=supabase
JWT_SECRET=[generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
SESSION_SECRET=[generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key-from-supabase]
CORS_ORIGIN=https://unityvault.vercel.app
APP_BASE_URL=https://unityvault.vercel.app
```

To generate secrets, run in terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important**: Copy your Render backend URL (will be something like `https://unityvault-backend.onrender.com`)

### 1.3 Deploy
Click "Create Web Service" and wait for deployment. Check logs for any errors.

## Step 2: Deploy Frontend to Vercel

### 2.1 Connect GitHub to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New..." → Select "Project"
3. Import your UnityVault repository
4. Click "Import"

### 2.2 Configure Project Settings
Vercel should auto-detect:
- **Framework**: Vite
- **Root Directory**: `.` (root)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 2.3 Set Environment Variables
In the "Environment Variables" section, add:

```
VITE_API_URL=https://unityvault-backend.onrender.com/api
```

Replace `unityvault-backend.onrender.com` with your actual Render backend URL.

### 2.4 Deploy
Click "Deploy" and wait for the build to complete. Your frontend will be live at a `.vercel.app` URL.

## Step 3: Test the Connection

1. Visit your Vercel frontend URL
2. Try logging in with test credentials
3. Check browser DevTools Console for any API errors
4. If API calls fail, verify:
   - Render backend is running (check Render dashboard)
   - CORS_ORIGIN in Render env matches your Vercel URL
   - VITE_API_URL in Vercel env matches your Render backend URL

## Step 4: Update Backend CORS (if frontend URL changes)

If you generate a new Vercel deployment URL, update these on Render:
- `CORS_ORIGIN`
- `APP_BASE_URL`

## Troubleshooting

### Backend Not Starting
- Check Render logs for build/start errors
- Verify NODE_ENV is set
- Ensure all environment variables are provided

### API Calls Failing
- Check browser Network tab to see actual request/response
- Verify backend URL is correct in VITE_API_URL
- Check CORS headers in Render backend logs

### Database Connection Issues
- Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct
- Check Supabase project is active
- Review RLS policies if data isn't loading

## Production Checklist

- [ ] Environment variables are NOT hardcoded in code
- [ ] Secrets (JWT_SECRET, SESSION_SECRET) are unique and strong
- [ ] CORS_ORIGIN is set to your Vercel frontend URL only
- [ ] DATABASE=supabase is set in Render
- [ ] Backend passes authentication tests
- [ ] Frontend connects to backend successfully
- [ ] All API endpoints return correct data
- [ ] Error handling shows user-friendly messages

## Local Development

To test locally before deployment:

```bash
# Terminal 1: Backend
cd server
cp .env.example .env
# Edit .env with your local values or Supabase credentials
npm run dev

# Terminal 2: Frontend
npm run dev
```

Visit `http://localhost:5173` and verify login works.

## Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Supabase Docs**: https://supabase.com/docs
