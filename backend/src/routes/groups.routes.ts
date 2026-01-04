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

        // hasSlot: 只顯示還有空位的揪團
        if (hasSlot) {
            where.currentCount = { lt: prisma.group.fields.capacity };
        }

        const [items, total] = await Promise.all([
            prisma.group.findMany({
                where,
                include: {
                    createdBy: { select: { id: true, nickname: true, email: true } },
                    _count: { select: { members: true } },
                },
                orderBy: { time: 'asc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
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
        include: { members: true },
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
    if (waitlistMember) {
        await prisma.$transaction([
            prisma.groupMember.update({
                where: { id: waitlistMember.id },
                data: { status: 'JOINED', joinedAt: new Date() },
            }),
            prisma.group.update({
                where: { id },
                data: { currentCount: { increment: 1 } },
            }),
        ]);
    }

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

export default router;
