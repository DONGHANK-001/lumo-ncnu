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
import leaderboardRoutes from './routes/leaderboard.routes.js';
import badgesRoutes from './routes/badges.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';
import matchRoutes from './routes/match.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import usersRoutes from './routes/users.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import http from 'http';
import { initSocket } from './socket.js';
import { startCleanupJob } from './lib/cleanup.job.js';
import { startReminderJob } from './lib/notification.job.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// ============================================
// Trust Proxy (Render 等代理環境必需)
// ============================================
app.set('trust proxy', 1);

// ============================================
// CORS (必須放在最前面，Helmet 之前)
// ============================================

const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
const corsOptions = {
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

// 明確處理 preflight OPTIONS 請求 (放在最前面)
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// ============================================
// Security Middleware
// ============================================

// Helmet for security headers (放在 CORS 之後)
app.use(helmet());

// Simple Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} -> ${res.statusCode}`);
    });
    next();
});

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // For ECPay webhook callback

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
app.use('/leaderboard', leaderboardRoutes); // /leaderboard/departments, /leaderboard/users
app.use('/badges', badgesRoutes);           // /badges, /badges/me, /badges/check
app.use('/feedback', feedbackRoutes);       // /feedback
app.use('/match', matchRoutes);             // /match/partners
app.use('/payment', paymentRoutes);         // /payment/checkout, /payment/callback
app.use('/users', usersRoutes);     // /users/:id, /users/me/avatar
app.use('/notifications', notificationsRoutes); // /notifications, /notifications/unread-count

// ============================================
// Error Handling
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// Start Server
// ============================================


// ============================================
// Process Error Handling (Render 偵錯用)
// ============================================
process.on('uncaughtException', (err) => {
    console.error('❌ UNCAUGHT EXCEPTION:', err);
    // 在 Render 環境，如果不結束進程，可能會導致狀態異常，但我們先嘗試記錄
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

server.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);

    // 啟動定時清理任務
    try {
        startCleanupJob();
        startReminderJob();
    } catch (err) {
        console.error('❌ Cleanup job start failed:', err);
    }
}).on('error', (err) => {
    console.error('❌ Server listen error:', err);
});

export default app;
