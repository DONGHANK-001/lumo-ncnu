import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

/**
 * Zod Validation Middleware Factory
 */
export function validateBody<T>(schema: ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: '輸入驗證失敗',
                        details: error.errors.map((e) => ({
                            path: e.path.join('.'),
                            message: e.message,
                        })),
                    },
                });
                return;
            }
            next(error);
        }
    };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.query = schema.parse(req.query) as typeof req.query;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: '查詢參數驗證失敗',
                        details: error.errors.map((e) => ({
                            path: e.path.join('.'),
                            message: e.message,
                        })),
                    },
                });
                return;
            }
            next(error);
        }
    };
}
