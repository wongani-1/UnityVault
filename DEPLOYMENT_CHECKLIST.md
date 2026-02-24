# Deployment Checklist

## Pre-Deployment

### Database (Supabase)
- [ ] Create Supabase project
- [ ] Run `server/supabase/schema.sql` migration
- [ ] Run `server/supabase/name_columns_migration.sql` migration
- [ ] Run `server/supabase/distribution_migration.sql` migration
- [ ] Copy SUPABASE_URL
- [ ] Copy SUPABASE_SERVICE_ROLE_KEY

### Security
- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Generate strong SESSION_SECRET (32+ characters)
- [ ] Set up Gmail App Password (if using email features)
- [ ] Review CORS settings

## Backend Deployment (Render)

- [ ] Create new Web Service on Render
- [ ] Connect Git repository
- [ ] Set root directory to `server`
- [ ] Configure build command: `npm install && npm run build`
- [ ] Configure start command: `npm start`
- [ ] Add all required environment variables:
  - [ ] NODE_ENV=production
  - [ ] PORT=10000
  - [ ] JWT_SECRET
  - [ ] SESSION_SECRET
  - [ ] DATA_STORE=supabase
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] CORS_ORIGIN (add after frontend deployed)
  - [ ] APP_BASE_URL (add after frontend deployed)
  - [ ] GMAIL_USER (optional)
  - [ ] GMAIL_PASS (optional)
  - [ ] PAYCHANGU_MOCK_MODE=true
- [ ] Deploy service
- [ ] Test health endpoint: `curl https://your-service.onrender.com/health`
- [ ] Copy Render service URL

## Frontend Deployment (Vercel)

- [ ] Create new project on Vercel
- [ ] Connect Git repository
- [ ] Set framework to Vite
- [ ] Add environment variable:
  - [ ] VITE_API_URL=https://your-render-service.onrender.com/api
- [ ] Deploy project
- [ ] Copy Vercel deployment URL

## Post-Deployment

### Update Backend CORS
- [ ] Go to Render dashboard
- [ ] Update CORS_ORIGIN with Vercel URL
- [ ] Update APP_BASE_URL with Vercel URL
- [ ] Wait for automatic redeployment

### Test Application
- [ ] Visit Vercel URL
- [ ] Test user registration
- [ ] Test user login
- [ ] Test dashboard loading
- [ ] Check browser console for errors
- [ ] Test API connectivity
- [ ] Verify database operations work

### Custom Domains (Optional)
- [ ] Add custom domain to Vercel
- [ ] Configure DNS for frontend
- [ ] Add custom domain to Render
- [ ] Configure DNS for backend
- [ ] Update CORS_ORIGIN in Render
- [ ] Update VITE_API_URL in Vercel

## Monitoring

- [ ] Set up error monitoring
- [ ] Configure log retention
- [ ] Enable auto-deploy on git push
- [ ] Set up uptime monitoring
- [ ] Review security headers

## Documentation

- [ ] Update README with production URLs
- [ ] Document environment variables
- [ ] Create admin user guide
- [ ] Create user manual

---

## Quick Commands

### Generate Secrets (PowerShell)
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Test Backend Health
```bash
curl https://your-service.onrender.com/health
```

### Test CORS
```bash
curl -H "Origin: https://your-frontend.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://your-backend.onrender.com/api/auth/me
```

---

## Estimated Time
- Database setup: 10-15 minutes
- Backend deployment: 10-15 minutes
- Frontend deployment: 5-10 minutes
- Testing & verification: 10-15 minutes
- **Total: ~40-60 minutes**

---

## Support

If you encounter issues, refer to:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
