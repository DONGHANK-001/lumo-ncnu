import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
    ...(isDev && {
        transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:yyyy-mm-dd HH:MM:ss' },
        },
    }),
});

/** 預建子 logger，避免每次呼叫都建立 */
export const socketLogger = logger.child({ module: 'socket' });
export const cleanupLogger = logger.child({ module: 'cleanup' });
export const attendanceLogger = logger.child({ module: 'attendance' });
export const reminderLogger = logger.child({ module: 'reminder' });
export const mailerLogger = logger.child({ module: 'mailer' });
export const notificationLogger = logger.child({ module: 'notification' });
