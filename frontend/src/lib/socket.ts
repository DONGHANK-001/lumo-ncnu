import { io, Socket } from 'socket.io-client';

// Use standard REST API URL as the Socket.io server
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            withCredentials: true,
        });

        socket.on('connect', () => {
            console.log('[Socket.io] Connected:', socket?.id);
        });

        socket.on('disconnect', () => {
            console.log('[Socket.io] Disconnected');
        });
    }

    return socket;
};
