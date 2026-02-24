# UnityVault

Smart Savings & Loans Management System.

## Project info

UnityVault is a full-stack savings and loans management system built with:
- **Frontend**: Vite + React + TypeScript with shadcn-ui and Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase (PostgreSQL)

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**

```sh
# Frontend
npm install

# Backend
cd server
npm install
```

2. **Set up environment variables:**

```sh
# Frontend - create .env from template
cp .env.example .env

# Backend - create .env from template
cd server
cp .env.example .env
# Edit server/.env with your configuration
```

3. **Start development servers:**

```sh
# Terminal 1 - Frontend (from root)
npm run dev

# Terminal 2 - Backend (from root)
cd server
npm run dev
```

4. **Access the application:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:4000

## 🌐 Deployment

Deploy UnityVault to production using Render (backend) and Vercel (frontend):

**Quick Start:** See [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md) (~25 minutes)

**Full Guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions

**Checklist:** Use [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) to track progress

### Deployment Stack
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: Supabase
- **Cost**: Free tier available for all services

## 📦 Build for Production

### Frontend
```sh
npm run build
```

### Backend
```sh
cd server
npm run build
```

## Tech stack

### Frontend
- Vite
- React
- TypeScript
- shadcn-ui
- Tailwind CSS
- TanStack Query
- React Router

### Backend
- Node.js
- Express
- TypeScript
- Supabase
- JWT Authentication
- bcrypt
- nodemailer

## 📚 Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md) - Quick deployment reference
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Deployment checklist
- [CONTRIBUTION_PAYMENT_SYSTEM.md](./CONTRIBUTION_PAYMENT_SYSTEM.md) - Payment system docs
- [PAYCHANGU_INTEGRATION.md](./PAYCHANGU_INTEGRATION.md) - Payment integration guide
- [MOBILE_FEATURES.md](./MOBILE_FEATURES.md) - Mobile features docs

## 🔐 Environment Variables

### Frontend
- `VITE_API_URL` - Backend API URL

### Backend
- `PORT` - Server port
- `JWT_SECRET` - JWT signing secret
- `SESSION_SECRET` - Session secret
- `CORS_ORIGIN` - Allowed CORS origins
- `APP_BASE_URL` - Frontend URL
- `DATA_STORE` - Data store type (memory/supabase)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `GMAIL_USER` - Gmail address for notifications
- `GMAIL_PASS` - Gmail app password
- `PAYCHANGU_MOCK_MODE` - PayChangu mock mode
- `PAYCHANGU_API_TOKEN` - PayChangu API token

See `.env.example` and `server/.env.example` for templates.

## 🧪 Testing

```sh
npm run test
```

## 📄 License

This project is licensed under the MIT License.
