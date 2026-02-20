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
    const [totalGroups, activeGroups, totalUsers, expiredGroups] = await Promise.all([
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

export default router;
