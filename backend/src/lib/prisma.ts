import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
        db: {
            url: process.env.DIRECT_URL || process.env.DATABASE_URL,
        },
    },
});

console.log(`[Prisma] Initializing...`);
console.log(`[Prisma] Has DIRECT_URL: ${!!process.env.DIRECT_URL}`);
console.log(`[Prisma] Using URL starts with: ${(process.env.DIRECT_URL || process.env.DATABASE_URL)?.substring(0, 15)}...`);

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
