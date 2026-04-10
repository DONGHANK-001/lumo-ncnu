import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import authRoutes from './routes/auth.routes.js';
import groupsRoutes from './routes/groups.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import aiRoutes from './routes/ai.routes.js';
import adminRoutes from './routes/admin.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import badgesRoutes from './routes/badges.routes.js';
import matchRoutes from './routes/match.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import usersRoutes from './routes/users.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import http from 'http';
import { initSocket } from './socket.js';
import { startCleanupJob } from './lib/cleanup.job.js';
import { logger } from './lib/logger.js';

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

// Structured Request Logger (pino-http)
app.use(pinoHttp({
    logger,
    autoLogging: { ignore: (req) => (req.url === '/health') },
    customProps: (req) => ({
        userId: (req as express.Request).user?.id,
    }),
}));

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
app.use('/leaderboard', leaderboardRoutes); // /leaderboard/departments, /leaderboard/by-activity
app.use('/badges', badgesRoutes);           // /badges, /badges/me, /badges/check
app.use('/match', matchRoutes);             // /match/partners
app.use('/payment', paymentRoutes);         // /payment/checkout, /payment/callback
app.use('/users', usersRoutes);     // /users/:id, /users/me/avatar
app.use('/notifications', notificationRoutes); // /notifications, /notifications/unread-count

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
    logger.fatal({ err }, 'Uncaught exception');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.fatal({ reason, promise }, 'Unhandled rejection');
});

server.listen(PORT, () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'API Server started');

    // 啟動定時清理任務
    try {
        startCleanupJob();
    } catch (err) {
        logger.error({ err }, 'Cleanup job start failed');
    }
}).on('error', (err) => {
    logger.fatal({ err }, 'Server listen error');
});

export default app;
