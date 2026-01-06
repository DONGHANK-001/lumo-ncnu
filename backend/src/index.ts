import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import authRoutes from './routes/auth.routes.js';
import groupsRoutes from './routes/groups.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import aiRoutes from './routes/ai.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();
const PORT = process.env.PORT || 4000;

// ============================================
// Security Middleware
// ============================================

// Helmet for security headers
app.use(helmet());

// Simple Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} -> ${res.statusCode}`);
    });
    next();
});

// CORS
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// 明確處理 preflight OPTIONS 請求
app.options('*', cors());

// Body parsing
app.use(express.json({ limit: '10kb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分鐘
    max: 100, // 每 IP 最多 100 請求
    message: {
        success: false,
        error: { code: 'RATE_LIMIT', message: '請求過於頻繁，請稍後再試' },
    },
});
app.use(limiter);

// ============================================
// Health Check
// ============================================

app.get('/health', (_req, res) => {
    res.json({
        success: true,
        data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        },
    });
});

// ============================================
// Routes
// ============================================

app.use('/', authRoutes);           // /me, /profile, /plan/upgrade
app.use('/groups', groupsRoutes);   // /groups, /groups/:id, etc.
app.use('/reports', reportsRoutes); // /reports
app.use('/ai', aiRoutes);           // /ai/status
app.use('/admin', adminRoutes);     // /admin/*

// ============================================
// Error Handling
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// Start Server
// ============================================

import { startCleanupJob } from './lib/cleanup.job.js';

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 API Server running on http://0.0.0.0:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Allowed Origins: ${corsOrigins.join(', ')}`);

    // 啟動定時清理任務
    startCleanupJob();
});

export default app;
