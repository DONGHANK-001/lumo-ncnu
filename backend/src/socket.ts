import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { socketLogger } from './lib/logger.js';

let io: Server;

export const initSocket = (server: HttpServer) => {
    const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'];
    io = new Server(server, {
        cors: {
            origin: corsOrigins,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        socketLogger.debug({ socketId: socket.id }, 'Client connected');

        // 使用者登入後加入專屬 room，用於接收個人通知
        socket.on('join_user_room', (userId: string) => {
            if (userId && typeof userId === 'string') {
                socket.join(`user:${userId}`);
                socketLogger.debug({ userId }, 'User joined room');
            }
        });

        // 加入/離開頻道（groups 列表、group:xxx 詳情頁）
        socket.on('join_room', (room: string) => {
            if (room && typeof room === 'string' && (room === 'groups' || room.startsWith('group:'))) {
                socket.join(room);
            }
        });

        socket.on('leave_room', (room: string) => {
            if (room && typeof room === 'string' && (room === 'groups' || room.startsWith('group:'))) {
                socket.leave(room);
            }
        });

        socket.on('disconnect', () => {
            socketLogger.debug({ socketId: socket.id }, 'Client disconnected');
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io has not been initialized. Please call initSocket first.');
    }
    return io;
};
