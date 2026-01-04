import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Global Error Handler
 */
export function errorHandler(
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    console.error('Error:', err);

    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';
    const message = err.message || '伺服器內部錯誤';

    res.status(statusCode).json({
        success: false,
        error: { code, message },
    });
}

/**
 * Not Found Handler
 */
export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `路由 ${req.method} ${req.path} 不存在`,
        },
    });
}

/**
 * Custom AppError class
 */
export class ApiError extends Error {
    statusCode: number;
    code: string;

    constructor(statusCode: number, code: string, message: string) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'ApiError';
    }
}
