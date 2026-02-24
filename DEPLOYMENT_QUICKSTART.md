# Quick Deployment Reference

## 🚀 Deployment Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Vercel    │────────▶│    Render    │────────▶│  Supabase   │
│  (Frontend) │         │   (Backend)  │         │  (Database) │
└─────────────┘         └──────────────┘         └─────────────┘
```

---

## 📋 Quick Steps

### 1. Supabase (5 min)
1. Create project at [supabase.com](https://supabase.com)
2. SQL Editor → Run `server/supabase/schema.sql`
3. Copy URL and service_role key

### 2. Render (10 min)
1. New Web Service at [render.com](https://render.com)
2. Root directory: `server`
3. Build: `npm install && npm run build`
4. Start: `npm start`
5. Add env vars (see below)

### 3. Vercel (5 min)
1. New Project at [vercel.com](https://vercel.com)
2. Framework: Vite
3. Add env var: `VITE_API_URL=https://your-render-url.onrender.com/api`
4. Deploy

### 4. Connect (2 min)
1. Update Render `CORS_ORIGIN` with Vercel URL
2. Update Render `APP_BASE_URL` with Vercel URL

---

## 🔐 Environment Variables

### Render (Backend)
```bash
NODE_ENV=production
PORT=10000
DATA_STORE=supabase
JWT_SECRET=<random-32-chars>
SESSION_SECRET=<random-32-chars>
SUPABASE_URL=<from-supabase>
SUPABASE_SERVICE_ROLE_KEY=<from-supabase>
CORS_ORIGIN=<your-vercel-url>
APP_BASE_URL=<your-vercel-url>
PAYCHANGU_MOCK_MODE=true
```

### Vercel (Frontend)
```bash
VITE_API_URL=<your-render-url>/api
```

---

## 🔑 Generate Secrets

### PowerShell
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Linux/Mac
```bash
openssl rand -base64 32
```

### Online
https://generate-secret.vercel.app/32

---

## ✅ Testing

### Backend Health
```bash
curl https://your-backend.onrender.com/health
```

### Frontend
Visit your Vercel URL and try to register/login

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `render.yaml` | Render deployment config |
| `vercel.json` | Vercel deployment config |
| `server/.env.example` | Backend env template |
| `.env.example` | Frontend env template |

---

## 🆘 Common Issues

### CORS Error
- ✓ Check `CORS_ORIGIN` matches Vercel URL exactly
- ✓ No trailing slash in URLs

### Database Connection Failed
- ✓ Use `service_role` key, not `anon` key
- ✓ Verify migrations ran successfully

### API Not Found
- ✓ Check `VITE_API_URL` includes `/api` suffix
- ✓ Verify Render service is running

### Build Failed
- ✓ Test build locally first
- ✓ Check build logs in dashboard

---

## 📚 Full Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete step-by-step guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Deployment checklist

---

## ⏱️ Timeline

- Database: 5 min
- Backend: 10 min
- Frontend: 5 min
- Testing: 5 min
- **Total: ~25 minutes**

---

## 💰 Cost (Free Tier)

| Service | Free Tier |
|---------|-----------|
| Supabase | 500MB DB, 1GB storage |
| Render | 750 hrs/month (sleeps after 15min) |
| Vercel | 100GB bandwidth |

**Total Monthly Cost: $0** 🎉

---

## 🔗 Quick Links

- [Render Dashboard](https://dashboard.render.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://supabase.com/dashboard)

---

*For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)*
