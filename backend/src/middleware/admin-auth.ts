import { Request, Response, NextFunction } from 'express';
import { ApiError } from './error-handler.js';

/**
 * 管理員權限檢查中介層
 * 必須在 firebaseAuthMiddleware 之後使用
 */
export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, 'UNAUTHORIZED', '請先登入');
    }

    if (user.role !== 'ADMIN') {
        throw new ApiError(403, 'FORBIDDEN', '需要管理員權限');
    }

    next();
};
