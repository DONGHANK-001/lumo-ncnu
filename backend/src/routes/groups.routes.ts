import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import {
    firebaseAuthMiddleware,
    requirePlusPlan,
} from '../middleware/firebase-auth.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { createGroupSchema, listGroupsQuerySchema } from '../types/schemas.js';
import { ApiError } from '../middleware/error-handler.js';
import { Prisma } from '@prisma/client';
import { sendJoinGroupEmail } from '../lib/mailer.js';
import { getIO } from '../socket.js';

const router = Router();

/**
 * GET /groups
 * 取得揪團列表（支援篩選）
 */
router.get(
    '/',
    validateQuery(listGroupsQuerySchema),
    async (req: Request, res: Response) => {
        const { sportType, level, dateFrom, dateTo, hasSlot, page, pageSize } = req.query as unknown as {
            sportType?: string;
            level?: string;
            dateFrom?: string;
            dateTo?: string;
            hasSlot?: boolean;
            page: number;
            pageSize: number;
        };

        const where: Prisma.GroupWhereInput = {
            status: { in: ['OPEN', 'FULL'] },
            ...(sportType && { sportType: sportType as Prisma.EnumSportTypeFilter }),
            ...(level && { level: level as Prisma.EnumSkillLevelFilter }),
            ...(dateFrom && { time: { gte: new Date(dateFrom) } }),
        };

        if (dateTo) {
            where.time = {
                ...(where.time as object),
                lte: new Date(dateTo),
            };
        }

        // hasSlot 會在查詢後過濾，因為 Prisma 不支援直接比較兩個欄位
        const [rawItems, rawTotal] = await Promise.all([
            prisma.group.findMany({
                where,
                include: {
                    createdBy: { select: { id: true, nickname: true, email: true } },
                    _count: { select: { members: true } },
                },
                orderBy: { time: 'asc' },
            }),
            prisma.group.count({ where }),
        ]);

        // hasSlot: 過濾出還有空位的揪團
        const filteredItems = hasSlot
            ? rawItems.filter((g) => g.currentCount < g.capacity)
            : rawItems;

        // 手動分頁
        const total = hasSlot ? filteredItems.length : rawTotal;
        const items = filteredItems.slice((page - 1) * pageSize, page * pageSize);

        res.json({
            success: true,
            data: {
                items: items.map((g) => ({
                    ...g,
                    memberCount: g._count.members,
                    _count: undefined,
                })),
                total,
                page,
                pageSize,
                hasMore: page * pageSize < total,
            },
        });
    }
);

/**
 * POST /groups
 * 建立揪團
 */
router.post(
    '/',
    firebaseAuthMiddleware,
    validateBody(createGroupSchema),
    async (req: Request, res: Response) => {
        const user = req.user!;
        const { sportType, title, description, time, location, level, capacity } = req.body;

        const initialStatus = capacity === 1 ? 'FULL' : 'OPEN';

        const group = await prisma.group.create({
            data: {
                sportType,
                title,
                description,
                time: new Date(time),
                location,
                level,
                capacity,
                currentCount: 1, // 建立者自動加入
                status: initialStatus,
                createdById: user.id,
                members: {
                    create: {
                        userId: user.id,
                        status: 'JOINED',
                    },
                },
            },
            include: {
                createdBy: { select: { id: true, nickname: true, email: true } },
            },
        });

        getIO().emit('group_created', group);

        res.status(201).json({
            success: true,
            data: group,
        });
    }
);

/**
 * GET /groups/:id
 * 取得揪團詳情
 */
router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    const group = await prisma.group.findUnique({
        where: { id },
        include: {
            createdBy: { select: { id: true, nickname: true, email: true } },
            members: {
                include: {
                    user: { select: { id: true, nickname: true, email: true } },
                },
                orderBy: { joinedAt: 'asc' },
            },
        },
    });

    if (!group) {
        throw new ApiError(404, 'GROUP_NOT_FOUND', '找不到此揪團');
    }

    res.json({
        success: true,
        data: group,
    });
});

/**
 * POST /groups/:id/join
 * 加入揪團
 */
router.post('/:id/join', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    const user = req.user!;
    const { id } = req.params;

    const group = await prisma.group.findUnique({
        where: { id },
        include: {
            members: true,
            createdBy: { select: { nickname: true, email: true } },
        },
    });

    if (!group) {
        throw new ApiError(404, 'GROUP_NOT_FOUND', '找不到此揪團');
    }

    if (group.status !== 'OPEN') {
        throw new ApiError(400, 'GROUP_NOT_OPEN', '此揪團已關閉');
    }

    // 檢查是否已加入
    const existingMember = group.members.find((m) => m.userId === user.id);
    if (existingMember && existingMember.status === 'JOINED') {
        throw new ApiError(400, 'ALREADY_JOINED', '您已經加入此揪團');
    }

    // 檢查人數
    if (group.currentCount >= group.capacity) {
        throw new ApiError(400, 'GROUP_FULL', '揪團已滿，請使用候補功能');
    }

    // 更新或建立成員
    await prisma.$transaction([
        prisma.groupMember.upsert({
            where: { groupId_userId: { groupId: id, userId: user.id } },
            create: { groupId: id, userId: user.id, status: 'JOINED' },
            update: { status: 'JOINED', joinedAt: new Date() },
        }),
        prisma.group.update({
            where: { id },
            data: {
                currentCount: { increment: 1 },
                status: group.currentCount + 1 >= group.capacity ? 'FULL' : 'OPEN',
            },
        }),
    ]);

    getIO().emit('group_updated', {
        id,
        currentCount: group.currentCount + 1,
        status: group.currentCount + 1 >= group.capacity ? 'FULL' : 'OPEN',
    });

    // 發送 Email 通知給發起人
    if (group.createdBy.email !== user.email) {
        const isFull = group.currentCount + 1 >= group.capacity;
        sendJoinGroupEmail({
            toEmail: group.createdBy.email,
            organizerName: group.createdBy.nickname || '發起人',
            joinerName: user.nickname || '新成員',
            groupTitle: group.title,
            sportType: group.sportType,
            time: group.time.toISOString(),
            isFull: isFull,
        }).catch((err: unknown) => console.error('Email send failed:', err));
    }

    res.json({
        success: true,
        data: { message: '加入成功' },
    });
});

/**
 * POST /groups/:id/leave
 * 退出揪團
 */
router.post('/:id/leave', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    const user = req.user!;
    const { id } = req.params;

    const group = await prisma.group.findUnique({
        where: { id },
        include: { members: true },
    });

    if (!group) {
        throw new ApiError(404, 'GROUP_NOT_FOUND', '找不到此揪團');
    }

    const member = group.members.find((m) => m.userId === user.id && m.status === 'JOINED');
    if (!member) {
        throw new ApiError(400, 'NOT_MEMBER', '您不是此揪團成員');
    }

    // 建立者不能退出
    if (group.createdById === user.id) {
        throw new ApiError(400, 'CREATOR_CANNOT_LEAVE', '揪團發起人無法退出，請取消揪團');
    }

    // 更新成員狀態
    await prisma.$transaction([
        prisma.groupMember.update({
            where: { id: member.id },
            data: { status: 'LEFT' },
        }),
        prisma.group.update({
            where: { id },
            data: {
                currentCount: { decrement: 1 },
                status: 'OPEN', // 有人退出就重新開放
            },
        }),
    ]);

    // 檢查候補名單，自動遞補
    const waitlistMember = group.members.find((m) => m.status === 'WAITLIST');
    let newCount = group.currentCount - 1;
    let newStatus: 'OPEN' | 'FULL' = 'OPEN';

    if (waitlistMember) {
        newCount += 1;
        newStatus = newCount >= group.capacity ? 'FULL' : 'OPEN';
        await prisma.$transaction([
            prisma.groupMember.update({
                where: { id: waitlistMember.id },
                data: { status: 'JOINED', joinedAt: new Date() },
            }),
            prisma.group.update({
                where: { id },
                data: {
                    currentCount: { increment: 1 },
                    status: newStatus
                },
            }),
        ]);
    }

    getIO().emit('group_updated', {
        id,
        currentCount: newCount,
        status: newStatus,
    });

    res.json({
        success: true,
        data: { message: '已退出揪團' },
    });
});

/**
 * POST /groups/:id/waitlist
 * 候補揪團（僅 PLUS）
 */
router.post(
    '/:id/waitlist',
    firebaseAuthMiddleware,
    requirePlusPlan,
    async (req: Request, res: Response) => {
        const user = req.user!;
        const { id } = req.params;

        const group = await prisma.group.findUnique({
            where: { id },
            include: { members: true },
        });

        if (!group) {
            throw new ApiError(404, 'GROUP_NOT_FOUND', '找不到此揪團');
        }

        // 檢查是否已加入
        const existingMember = group.members.find((m) => m.userId === user.id);
        if (existingMember) {
            if (existingMember.status === 'JOINED') {
                throw new ApiError(400, 'ALREADY_JOINED', '您已經加入此揪團');
            }
            if (existingMember.status === 'WAITLIST') {
                throw new ApiError(400, 'ALREADY_WAITLIST', '您已在候補名單中');
            }
        }

        await prisma.groupMember.upsert({
            where: { groupId_userId: { groupId: id, userId: user.id } },
            create: { groupId: id, userId: user.id, status: 'WAITLIST' },
            update: { status: 'WAITLIST', joinedAt: new Date() },
        });

        res.json({
            success: true,
            data: { message: '已加入候補名單' },
        });
    }
);

/**
 * GET /groups/:id/comments
 * 取得指定揪團的留言
 */
router.get('/:id/comments', async (req: Request, res: Response) => {
    const { id } = req.params;

    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) {
        throw new ApiError(404, 'GROUP_NOT_FOUND', '找不到此揪團');
    }

    const comments = await prisma.groupComment.findMany({
        where: { groupId: id },
        include: {
            user: { select: { id: true, nickname: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
    });

    res.json({
        success: true,
        data: comments,
    });
});

/**
 * POST /groups/:id/comments
 * 新增揪團留言
 */
router.post(
    '/:id/comments',
    firebaseAuthMiddleware,
    async (req: Request, res: Response) => {
        const user = req.user!;
        const { id } = req.params;
        const { content } = req.body;

        if (!content || typeof content !== 'string' || content.trim() === '') {
            throw new ApiError(400, 'INVALID_INPUT', '留言內容無效');
        }

        const group = await prisma.group.findUnique({ where: { id } });
        if (!group) {
            throw new ApiError(404, 'GROUP_NOT_FOUND', '找不到此揪團');
        }

        // 可以選擇限制只有成員才能留言，目前先開放只要登入即可留言
        const newComment = await prisma.groupComment.create({
            data: {
                content: content.trim(),
                groupId: id,
                userId: user.id,
            },
            include: {
                user: { select: { id: true, nickname: true, email: true } },
            },
        });

        // 透過 Socket.io 廣播給所有連接的使用者
        getIO().emit('new_comment', newComment);

        res.status(201).json({
            success: true,
            data: newComment,
        });
    }
);

export default router;
