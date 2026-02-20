import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

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
        console.log(`[Socket.io] Client connected: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`[Socket.io] Client disconnected: ${socket.id}`);
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
