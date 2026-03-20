import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { firebaseAuthMiddleware } from '../middleware/firebase-auth.js';
import { requireAdmin } from '../middleware/admin-auth.js';
import { ApiError } from '../middleware/error-handler.js';

const router = Router();

// 所有管理員路由都需要登入 + 管理員權限
router.use(firebaseAuthMiddleware, requireAdmin);

/**
 * GET /admin/groups
 * 列出所有揪團（含過期、已完成）
 */
router.get('/groups', async (req: Request, res: Response) => {
    const { page = 1, pageSize = 20, status, sportType } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (sportType) where.sportType = sportType;

    const [items, total] = await Promise.all([
        prisma.group.findMany({
            where,
            include: {
                createdBy: { select: { id: true, nickname: true, email: true } },
                _count: { select: { members: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (Number(page) - 1) * Number(pageSize),
            take: Number(pageSize),
        }),
        prisma.group.count({ where }),
    ]);

    res.json({
        success: true,
        data: {
            items: items.map((g) => ({
                ...g,
                memberCount: g._count.members,
                _count: undefined,
            })),
            total,
            page: Number(page),
            pageSize: Number(pageSize),
        },
    });
});

/**
 * DELETE /admin/groups/:id
 * 刪除揪團
 */
router.delete('/groups/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) {
        throw new ApiError(404, 'GROUP_NOT_FOUND', '找不到此揪團');
    }

    await prisma.group.delete({ where: { id } });

    res.json({
        success: true,
        data: { message: '揪團已刪除' },
    });
});

/**
 * PATCH /admin/groups/:id
 * 編輯揪團
 */
router.patch('/groups/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, time, location, capacity, status } = req.body;

    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) {
        throw new ApiError(404, 'GROUP_NOT_FOUND', '找不到此揪團');
    }

    const updated = await prisma.group.update({
        where: { id },
        data: {
            ...(title && { title }),
            ...(description !== undefined && { description }),
            ...(time && { time: new Date(time) }),
            ...(location && { location }),
            ...(capacity && { capacity: Number(capacity) }),
            ...(status && { status }),
        },
    });

    res.json({
        success: true,
        data: updated,
    });
});

/**
 * POST /admin/groups/cleanup
 * 手動清理過期揪團
 */
router.post('/groups/cleanup', async (_req: Request, res: Response) => {
    const now = new Date();

    const result = await prisma.group.updateMany({
        where: {
            time: { lt: now },
            status: { in: ['OPEN', 'FULL'] },
        },
        data: { status: 'COMPLETED' },
    });

    res.json({
        success: true,
        data: {
            message: `已將 ${result.count} 個過期揪團標記為完成`,
            count: result.count,
        },
    });
});

/**
 * GET /admin/stats
 * 管理員儀表板統計
 */
router.get('/stats', async (_req: Request, res: Response) => {
    // 基數 44：2026-03-17 資料庫重置前的歷史用戶數
    const HISTORICAL_USER_BASE = 44;

    const [totalGroups, activeGroups, dbUserCount, expiredGroups] = await Promise.all([
        prisma.group.count(),
        prisma.group.count({ where: { status: { in: ['OPEN', 'FULL'] } } }),
        prisma.user.count(),
        prisma.group.count({
            where: {
                time: { lt: new Date() },
                status: { in: ['OPEN', 'FULL'] },
            },
        }),
    ]);

    const totalUsers = HISTORICAL_USER_BASE + dbUserCount;

    res.json({
        success: true,
        data: {
            totalGroups,
            activeGroups,
            totalUsers,
            expiredGroups,
        },
    });
});

/**
 * GET /admin/reports
 * 取得檢舉列表
 */
router.get('/reports', async (req: Request, res: Response) => {
    const { page = 1, pageSize = 20 } = req.query;

    const [items, total] = await Promise.all([
        prisma.report.findMany({
            include: {
                reporter: { select: { id: true, nickname: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (Number(page) - 1) * Number(pageSize),
            take: Number(pageSize),
        }),
        prisma.report.count(),
    ]);

    // 取得被檢舉目標的詳細資訊
    const enrichedItems = await Promise.all(
        items.map(async (report) => {
            let targetDetails = null;
            if (report.targetType === 'USER') {
                const user = await prisma.user.findUnique({
                    where: { id: report.targetId },
                    select: { nickname: true, email: true },
                });
                targetDetails = user;
            } else if (report.targetType === 'GROUP') {
                const group = await prisma.group.findUnique({
                    where: { id: report.targetId },
                    select: { title: true, sportType: true },
                });
                targetDetails = group;
            }
            return {
                ...report,
                targetDetails,
            };
        })
    );

    res.json({
        success: true,
        data: {
            items: enrichedItems,
            total,
            page: Number(page),
            pageSize: Number(pageSize),
        },
    });
});

/**
 * DELETE /admin/reports/:id
 * 刪除檢舉 (標記處理完成)
 */
router.delete('/reports/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
        throw new ApiError(404, 'REPORT_NOT_FOUND', '找不到此檢舉');
    }

    await prisma.report.delete({ where: { id } });

    res.json({
        success: true,
        data: { message: '檢舉已刪除' },
    });
});

// ============================================
// 使用者管理
// ============================================

/**
 * GET /admin/users
 * 使用者列表（支援搜尋、篩選）
 */
router.get('/users', async (req: Request, res: Response) => {
    const { page = 1, pageSize = 20, search, role, banned } = req.query;

    const where: any = {};
    if (search) {
        where.OR = [
            { nickname: { contains: String(search), mode: 'insensitive' } },
            { email: { contains: String(search), mode: 'insensitive' } },
            { studentId: { contains: String(search) } },
        ];
    }
    if (role) where.role = String(role);
    if (banned === 'true') where.isBanned = true;
    if (banned === 'false') where.isBanned = false;

    const [items, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                nickname: true,
                department: true,
                studentId: true,
                role: true,
                planType: true,
                isBanned: true,
                banReason: true,
                attendedCount: true,
                noShowCount: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            skip: (Number(page) - 1) * Number(pageSize),
            take: Number(pageSize),
        }),
        prisma.user.count({ where }),
    ]);

    res.json({
        success: true,
        data: { items, total, page: Number(page), pageSize: Number(pageSize) },
    });
});

/**
 * PATCH /admin/users/:id/ban
 * 封鎖/解封使用者
 */
router.patch('/users/:id/ban', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isBanned, banReason } = req.body;

    if (typeof isBanned !== 'boolean') {
        throw new ApiError(400, 'INVALID_INPUT', '請提供 isBanned 布林值');
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new ApiError(404, 'USER_NOT_FOUND', '找不到此使用者');
    if (target.role === 'ADMIN') throw new ApiError(403, 'FORBIDDEN', '無法封鎖管理員帳號');

    const updated = await prisma.user.update({
        where: { id },
        data: {
            isBanned,
            banReason: isBanned ? (banReason || null) : null,
        },
        select: { id: true, email: true, nickname: true, isBanned: true, banReason: true },
    });

    res.json({ success: true, data: updated });
});

/**
 * PATCH /admin/users/:id/role
 * 變更使用者角色
 */
router.patch('/users/:id/role', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
        throw new ApiError(400, 'INVALID_ROLE', '角色必須是 USER 或 ADMIN');
    }

    if (id === req.user!.id) {
        throw new ApiError(403, 'FORBIDDEN', '無法修改自己的角色');
    }

    const updated = await prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, email: true, nickname: true, role: true },
    });

    res.json({ success: true, data: updated });
});

export default router;
