import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../lib/firebase-admin.js';
import { prisma } from '../lib/prisma.js';
import type { User } from '@prisma/client';
import type { DecodedIdToken } from 'firebase-admin/auth';

// 擴展 Express Request
declare global {
    namespace Express {
        interface Request {
            firebaseUser?: DecodedIdToken;
            user?: User;
        }
    }
}



/**
 * Firebase Auth Middleware
 * - 驗證 ID Token
 * - 檢查 email domain (校內限定)
 * - 自動建立/取得 DB User
 */
export async function firebaseAuthMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: '缺少認證 Token' },
            });
            return;
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await firebaseAuth.verifyIdToken(idToken);

        // 檢查 email domain
        const email = decodedToken.email;
        if (!email) {
            res.status(403).json({
                success: false,
                error: { code: 'EMAIL_REQUIRED', message: '需要有效的 Email' },
            });
            return;
        }

        const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAIN || 'mail1.ncnu.edu.tw,ncnu.edu.tw').split(',').map(d => d.trim());
        const emailDomain = email.split('@')[1];

        if (!allowedDomains.includes(emailDomain)) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'DOMAIN_NOT_ALLOWED',
                    message: `請使用暨南學生帳號登入 (允許: ${allowedDomains.join(', ')})`,
                },
            });
            return;
        }

        req.firebaseUser = decodedToken;

        // 取得或建立 DB User
        let user = await prisma.user.findUnique({
            where: { firebaseUid: decodedToken.uid },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    firebaseUid: decodedToken.uid,
                    email: email,
                    nickname: decodedToken.name || email.split('@')[0],
                },
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({
            success: false,
            error: { code: 'INVALID_TOKEN', message: 'Token 無效或已過期' },
        });
    }
}

/**
 * Optional Auth Middleware
 * 嘗試驗證但不強制要求
 */
export async function optionalAuthMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        next();
        return;
    }

    try {
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await firebaseAuth.verifyIdToken(idToken);
        req.firebaseUser = decodedToken;

        const user = await prisma.user.findUnique({
            where: { firebaseUid: decodedToken.uid },
        });

        if (user) {
            req.user = user;
        }
    } catch (err) {
        // 靜默失敗，繼續請求
        console.warn('Optional Auth Failed:', err);
    }

    next();
}

/**
 * PLUS Plan Guard
 * 需要 PLUS 方案的 endpoints
 */
export function requirePlusPlan(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (req.user?.planType !== 'PLUS') {
        res.status(403).json({
            success: false,
            error: {
                code: 'PLUS_REQUIRED',
                message: '此功能需要 PLUS 方案',
            },
        });
        return;
    }
    next();
}
