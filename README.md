# Lumo NCNU - 校園運動配對平台

暨南大學專屬運動揪團 PWA，支援籃球、跑步、羽球、桌球、健身。

## 專案結構

```
lumo/
├── backend/      # Express API (部署到 Render)
└── frontend/     # Next.js 14 (部署到 Vercel)
```

## 快速開始

### 1. 安裝依賴

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. 設定環境變數

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

### 3. 資料庫 Migration

```bash
cd backend
npx prisma migrate dev
```

### 4. 啟動開發伺服器

```bash
# Terminal 1 - Backend (http://localhost:4000)
cd backend && npm run dev

# Terminal 2 - Frontend (http://localhost:3000)
cd frontend && npm run dev
```

---

## 部署

### Backend (Render)
- Build: `npm install && npx prisma generate && npm run build`
- Start: `npm start`
- Health Check: `/health`
- 環境變數：`DATABASE_URL`, `FIREBASE_*`, `ALLOWED_EMAIL_DOMAIN`, `CORS_ORIGINS`

### Frontend (Vercel)
- Root Directory: `frontend`
- 環境變數：`NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_FIREBASE_*`

### Database (Supabase)
- 取得 PostgreSQL 連線字串設為 `DATABASE_URL`
- 執行：`cd backend && npx prisma migrate deploy`

---

## 功能

- ✅ Google 登入（校內限定 @ncnu.edu.tw）
- ✅ 揪團 CRUD
- ✅ 加入/退出/候補
- ✅ PLUS 升級（模擬）
- ✅ 檢舉功能
- ✅ PWA 支援
