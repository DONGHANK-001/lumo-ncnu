---
description: how to develop and deploy changes using the staging environment
---

# Staging Environment Workflow

// turbo-all

## Overview
- **Production**: `main` branch → Vercel + Render (production) + Supabase (`jyxtalnwopbihyytivth`)
- **Staging**: `staging` branch → Vercel Preview + Render (staging) + Supabase (`dxoccfvgpnxsbvtlagol`)

## Development Flow

### 1. Start working on a new feature
```bash
git checkout staging
git pull origin staging
```

### 2. Make your changes
Edit code as needed.

### 3. Test locally (optional)
```bash
# Backend (uses .env which points to production DB by default)
# To use staging DB locally, copy .env.staging to .env temporarily
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

### 4. Push to staging
```bash
git add .
git commit -m "feat: description of changes"
git push origin staging
```
This will:
- Trigger Vercel Preview deployment (auto-generates a test URL)
- Trigger Render staging backend redeploy (if configured)

### 5. Test on staging
- Open the Vercel Preview URL to test frontend
- Backend staging API: `https://lumo-ncnu-api-staging.onrender.com` (once configured)

### 6. Merge to production
Once testing passes:
```bash
git checkout main
git pull origin main
git merge staging
git push origin main
```
This will trigger production deployment on Vercel and Render.

### 7. Sync staging with main (after merge)
```bash
git checkout staging
git merge main
git push origin staging
```

## Environment Details

### Supabase Staging
- Project: `lumo-staging`
- Project ID: `dxoccfvgpnxsbvtlagol`
- Region: Southeast Asia (Singapore)
- DATABASE_URL: `postgresql://postgres.dxoccfvgpnxsbvtlagol:PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- DIRECT_URL: `postgresql://postgres.dxoccfvgpnxsbvtlagol:PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres`

### Render Staging (TBD)
- Service Name: `lumo-ncnu-api-staging`
- Branch: `staging`
- Build: `cd backend && npm install && npx prisma generate && npm run build`
- Start: `cd backend && npm start`

### Vercel Preview
- Env var `NEXT_PUBLIC_API_BASE_URL` for Preview → staging backend URL
