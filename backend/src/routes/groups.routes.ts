import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import {
    firebaseAuthMiddleware,
    requirePlusPlan,
} from '../middleware/firebase-auth.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { createGroupSchema, listGroupsQuerySchema } from '../types/schemas.js';
import { ApiError } from '../middleware/error-handler.js';
import { Prisma, User } from '@prisma/client';
import { sendJoinGroupEmail } from '../lib/mailer.js';
import { getIO } from '../socket.js';
import { createNotification, notifyGroupMembers } from '../lib/notification.service.js';
import { isTrialPeriod } from '../utils/trial-period.js';
import { getUserWeeklyStats, calculateQuotaLimit } from '../utils/quota.js';

const router = Router();

function ensureIdentityComplete(user: Pick<User, 'department' | 'gender' | 'gradeLabel'>): void {
    const hasDepartment = !!user?.department;
    const hasGender = !!user?.gender;
    const hasGrade = !!user?.gradeLabel;

    if (!hasDepartment || !hasGender || !hasGrade) {
        throw new ApiError(403, 'PROFILE_INCOMPLETE', '請先完成性別、系級與系所資料');
    }
}

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

        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

        const where: Prisma.GroupWhereInput = {
            OR: [
                { status: { in: ['OPEN', 'FULL'] }, time: { gte: threeDaysAgo } },
                { status: 'COMPLETED', time: { gte: threeDaysAgo } },
            ],
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
                    createdBy: { select: { id: true, nickname: true, email: true, attendedCount: true, noShowCount: true, planType: true } },
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
 * GET /groups/quota/me
 * 取得使用者的本週揪團額度
 */
router.get('/quota/me', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const { hostedThisWeek, joinedThisWeek, currentStreak } = await getUserWeeklyStats(user.id);

        if (isTrialPeriod()) {
            return res.json({
                success: true,
                data: { hostedThisWeek, joinedThisWeek, currentStreak, limit: 999, remaining: 999 }
            });
        }

        const limit = calculateQuotaLimit(hostedThisWeek, joinedThisWeek, currentStreak);
        const remaining = Math.max(0, limit - hostedThisWeek);

        res.json({
            success: true,
            data: { hostedThisWeek, joinedThisWeek, currentStreak, limit, remaining }
        });
    } catch (error) {
        req.log.error({ err: error }, 'Quota calculation error');
        res.status(500).json({ success: false, error: { message: 'Failed to calculate quota' } });
    }
});

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
        ensureIdentityComplete(user);
        const { sportType, title, description, time, location, level, capacity, tags } = req.body;

        // 計算揪團額度檢查
        const { hostedThisWeek, joinedThisWeek, currentStreak } = await getUserWeeklyStats(user.id);

        if (!isTrialPeriod()) {
            const limit = calculateQuotaLimit(hostedThisWeek, joinedThisWeek, currentStreak);

            if (hostedThisWeek >= limit) {
                return res.status(403).json({
                    success: false,
                    error: { message: `本週發起揪團次數已達上限 (${limit}次)。請參與更多揪團或保持連續活躍來解鎖額度！` }
                });
            }
        }

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
                tags: tags || [],
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

        getIO().to('groups').emit('group_created', group);

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
            createdBy: { select: { id: true, nickname: true, email: true, attendedCount: true, noShowCount: true, planType: true, positiveRatings: true, negativeRatings: true } },
            members: {
                include: {
                    user: { select: { id: true, nickname: true, email: true, attendedCount: true, noShowCount: true, planType: true, positiveRatings: true, negativeRatings: true } },
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
    ensureIdentityComplete(user);
    const { id } = req.params;

    const result = await prisma.$transaction(async (tx) => {
        // FOR UPDATE 鎖住 group row，防止並發超額加入
        const groups = await tx.$queryRaw<
            { id: string; currentCount: number; capacity: number; status: string; createdById: string; title: string; sportType: string; time: Date }[]
        >(Prisma.sql`SELECT "id", "currentCount", "capacity", "status", "createdById", "title", "sportType", "time" FROM groups WHERE "id" = ${id} FOR UPDATE`);

        if (groups.length === 0) {
            throw new ApiError(404, 'GROUP_NOT_FOUND', '找不到此揪團');
        }
        const group = groups[0];

        if (group.status !== 'OPEN') {
            throw new ApiError(400, 'GROUP_NOT_OPEN', '此揪團已關閉');
        }

        // 在鎖內檢查是否已加入
        const existingMember = await tx.groupMember.findUnique({
            where: { groupId_userId: { groupId: id, userId: user.id } },
        });
        if (existingMember?.status === 'JOINED') {
            throw new ApiError(400, 'ALREADY_JOINED', '您已經加入此揪團');
        }

        // 在鎖內檢查人數（此時 currentCount 保證是最新值）
        if (group.currentCount >= group.capacity) {
            throw new ApiError(400, 'GROUP_FULL', '揪團已滿，請使用候補功能');
        }

        // 安全寫入
        const newCount = group.currentCount + 1;
        const newStatus = newCount >= group.capacity ? 'FULL' : 'OPEN';

        await tx.groupMember.upsert({
            where: { groupId_userId: { groupId: id, userId: user.id } },
            create: { groupId: id, userId: user.id, status: 'JOINED' },
            update: { status: 'JOINED', joinedAt: new Date() },
        });

        await tx.group.update({
            where: { id },
            data: { currentCount: newCount, status: newStatus },
        });

        const creator = await tx.user.findUnique({
            where: { id: group.createdById },
            select: { nickname: true, email: true, planType: true },
        });

        return { group, newCount, newStatus, creator };
    });

    // transaction 成功後才發通知（不需要在鎖內）
    const { group, newCount, newStatus, creator } = result;

    getIO().to('groups').to(`group:${id}`).emit('group_updated', {
        id, currentCount: newCount, status: newStatus,
    });

    if (creator && creator.email !== user.email) {
        const isFull = newCount >= group.capacity;
        sendJoinGroupEmail({
            toEmail: creator.email,
            organizerName: creator.nickname || '發起人',
            joinerName: user.nickname || '新成員',
            groupTitle: group.title,
            sportType: group.sportType,
            time: group.time.toISOString(),
            isFull,
        }).catch((err: unknown) => req.log.error({ err }, 'Email send failed'));

        createNotification({
            userId: group.createdById,
            type: 'GROUP_JOIN',
            title: '有人加入了你的揪團！',
            body: `${user.nickname || '新成員'} 加入了「${group.title}」`,
            data: { groupId: id },
        }).catch((err: unknown) => req.log.error({ err }, 'Join notification failed'));
    }

    res.json({ success: true, data: { message: '加入成功' } });
});

/**
 * POST /groups/:id/leave
 * 退出揪團
 */
router.post('/:id/leave', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    const user = req.user!;
    const { id } = req.params;

    const result = await prisma.$transaction(async (tx) => {
        // FOR UPDATE 鎖住 group row，防止併發問題
        const groups = await tx.$queryRaw<
            { id: string; currentCount: number; capacity: number; status: string; createdById: string; title: string }[]
        >(Prisma.sql`SELECT "id", "currentCount", "capacity", "status", "createdById", "title" FROM groups WHERE "id" = ${id} FOR UPDATE`);

        if (groups.length === 0) {
            throw new ApiError(404, 'GROUP_NOT_FOUND', '找不到此揪團');
        }
        const group = groups[0];

        // 檢查是否為成員
        const member = await tx.groupMember.findFirst({
            where: { groupId: id, userId: user.id, status: 'JOINED' },
        });
        if (!member) {
            throw new ApiError(400, 'NOT_MEMBER', '您不是此揪團成員');
        }

        // 建立者不能退出
        if (group.createdById === user.id) {
            throw new ApiError(400, 'CREATOR_CANNOT_LEAVE', '揪團發起人無法退出，請取消揪團');
        }

        // 標記成員退出
        await tx.groupMember.update({
            where: { id: member.id },
            data: { status: 'LEFT' },
        });

        let newCount = group.currentCount - 1;
        let newStatus: 'OPEN' | 'FULL' = 'OPEN';
        let promotedMember: { id: string; userId: string } | null = null;

        // 在同一個 transaction 中檢查候補並遞補
        const waitlistMember = await tx.groupMember.findFirst({
            where: { groupId: id, status: 'WAITLIST' },
            orderBy: { joinedAt: 'asc' },
        });

        if (waitlistMember) {
            await tx.groupMember.update({
                where: { id: waitlistMember.id },
                data: { status: 'JOINED', joinedAt: new Date() },
            });
            newCount += 1;
            newStatus = newCount >= group.capacity ? 'FULL' : 'OPEN';
            promotedMember = waitlistMember;
        }

        // 更新揪團人數（一次性寫入最終值）
        await tx.group.update({
            where: { id },
            data: { currentCount: newCount, status: newStatus },
        });

        return { group, newCount, newStatus, promotedMember };
    });

    const { group, newCount, newStatus, promotedMember } = result;

    // Transaction 成功後才發通知（不在鎖內）
    if (promotedMember) {
        createNotification({
            userId: promotedMember.userId,
            type: 'WAITLIST_PROMOTED',
            title: '候補成功！🎉',
            body: `你已自動遞補加入「${group.title}」`,
            data: { groupId: id },
        }).catch((err: unknown) => req.log.error({ err }, 'Waitlist promotion notification failed'));
    }

    createNotification({
        userId: group.createdById,
        type: 'GROUP_LEAVE',
        title: '有人退出了你的揪團',
        body: `${user.nickname || '成員'} 退出了「${group.title}」`,
        data: { groupId: id },
    }).catch((err: unknown) => req.log.error({ err }, 'Leave notification failed'));

    getIO().to('groups').to(`group:${id}`).emit('group_updated', {
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
 * POST /groups/:id/cancel
 * 取消揪團（僅發起人）
 */
router.post('/:id/cancel', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    const user = req.user!;
    const { id } = req.params;

    const group = await prisma.group.findUnique({
        where: { id },
        include: { members: true },
    });

    if (!group) {
        throw new ApiError(404, 'GROUP_NOT_FOUND', '找不到此揪團');
    }

    if (group.createdById !== user.id) {
        throw new ApiError(403, 'FORBIDDEN', '只有揪團發起人可以取消揪團');
    }

    if (group.status === 'CANCELLED') {
        throw new ApiError(400, 'ALREADY_CANCELLED', '此揪團已被取消');
    }

    await prisma.$transaction([
        prisma.group.update({
            where: { id },
            data: { status: 'CANCELLED' },
        }),
        prisma.groupMember.updateMany({
            where: { groupId: id, status: { in: ['JOINED', 'WAITLIST'] } },
            data: { status: 'LEFT' },
        }),
    ]);

    getIO().to('groups').to(`group:${id}`).emit('group_cancelled', { id });

    // 通知所有成員揪團已取消
    notifyGroupMembers(id, user.id, {
        type: 'GROUP_CANCELLED',
        title: '揪團已取消',
        body: `「${group.title}」已被發起人取消`,
        data: { groupId: id },
    }).catch((err: unknown) => req.log.error({ err }, 'Cancel notification failed'));

    res.json({
        success: true,
        data: { message: '揪團已取消' },
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
        ensureIdentityComplete(user);
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

        // 透過 Socket.io 廣播給正在查看此揪團的使用者
        getIO().to(`group:${id}`).emit('new_comment', { ...newComment, groupId: id });

        // 通知所有團員有新留言（排除留言者自己）
        notifyGroupMembers(id, user.id, {
            type: 'GROUP_COMMENT',
            title: '揪團有新留言 💬',
            body: `${user.nickname || '成員'} 在「${group.title}」留言：${content.trim().slice(0, 50)}`,
            data: { groupId: id },
        }).catch((err: unknown) => req.log.error({ err }, 'Comment notification failed'));

        res.status(201).json({
            success: true,
            data: newComment,
        });
    }
);

/**
 * PUT /groups/:id/attendance
 * 批次更新揪團成員的出缺席狀態 (僅限發起人)
 */
router.put(
    '/:id/attendance',
    firebaseAuthMiddleware,
    async (req: Request, res: Response) => {
        const user = req.user!;
        const { id } = req.params;
        const { records } = req.body as { records: { userId: string, isAttended: boolean | null }[] };

        if (!Array.isArray(records)) {
            throw new ApiError(400, 'INVALID_INPUT', '參數錯誤');
        }

        const group = await prisma.group.findUnique({
            where: { id },
            include: { members: true }
        });

        if (!group) {
            throw new ApiError(404, 'GROUP_NOT_FOUND', '找不到此揪團');
        }

        if (group.createdById !== user.id) {
            throw new ApiError(403, 'FORBIDDEN', '只有揪團發起人可以設定出缺席紀錄');
        }

        // 檢查活動開始 30 分鐘後才能標記出缺席
        const ATTENDANCE_WINDOW_MS = 30 * 60 * 1000;
        if (Date.now() < new Date(group.time).getTime() + ATTENDANCE_WINDOW_MS && group.status !== 'COMPLETED') {
            throw new ApiError(400, 'TOO_EARLY', '活動開始 30 分鐘後才能標記出缺席');
        }

        await prisma.$transaction(async (tx) => {
            for (const record of records) {
                // 找到對應的 member
                const member = group.members.find(m => m.userId === record.userId && m.status === 'JOINED');
                if (!member) continue; // 可能是已退出或候補中

                const oldStatus = member.isAttended;
                const newStatus = record.isAttended;

                // 若狀態沒變則略過
                if (oldStatus === newStatus) continue;

                // 1. 更新 Member 紀錄
                await tx.groupMember.update({
                    where: { id: member.id },
                    data: { isAttended: newStatus }
                });

                // 2. 計算對應 User 的統計變化
                let attendedDelta = 0;
                let noShowDelta = 0;

                // 移除舊狀態對分數的影響
                if (oldStatus === true) attendedDelta -= 1;
                else if (oldStatus === false) noShowDelta -= 1;

                // 加上新狀態對分數的影響
                if (newStatus === true) attendedDelta += 1;
                else if (newStatus === false) noShowDelta += 1;

                // 3. 更新 User 的總計數
                if (attendedDelta !== 0 || noShowDelta !== 0) {
                    await tx.user.update({
                        where: { id: record.userId },
                        data: {
                            attendedCount: { increment: attendedDelta },
                            noShowCount: { increment: noShowDelta }
                        }
                    });
                }
            }
        });

        res.json({
            success: true,
            data: { message: '出缺席紀錄儲存成功' },
        });
    }
);

/**
 * POST /groups/:id/rate
 * 對揪團成員進行 👍/👎 評價（活動結束後，僅參與成員可評）
 */
router.post('/:id/rate', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    const user = req.user!;
    const { id } = req.params;
    const { ratedUserId, isPositive } = req.body;

    if (!ratedUserId || typeof isPositive !== 'boolean') {
        throw new ApiError(400, 'INVALID_INPUT', '缺少 ratedUserId 或 isPositive');
    }

    if (ratedUserId === user.id) {
        throw new ApiError(400, 'CANNOT_RATE_SELF', '不能評價自己');
    }

    const group = await prisma.group.findUnique({
        where: { id },
        include: { members: { where: { status: 'JOINED' } } },
    });

    if (!group) {
        throw new ApiError(404, 'GROUP_NOT_FOUND', '找不到此揪團');
    }

    if (new Date(group.time) >= new Date() && group.status !== 'COMPLETED') {
        throw new ApiError(400, 'TOO_EARLY', '活動結束後才能評價');
    }

    if (!group.members.some(m => m.userId === user.id)) {
        throw new ApiError(403, 'NOT_MEMBER', '只有參與成員可以評價');
    }

    if (!group.members.some(m => m.userId === ratedUserId)) {
        throw new ApiError(400, 'TARGET_NOT_MEMBER', '被評價者不是此揪團成員');
    }

    await prisma.$transaction(async (tx) => {
        const existing = await tx.memberRating.findUnique({
            where: { groupId_raterId_ratedUserId: { groupId: id, raterId: user.id, ratedUserId } },
        });

        if (existing) {
            if (existing.isPositive === isPositive) return;

            await tx.memberRating.update({
                where: { id: existing.id },
                data: { isPositive },
            });
            await tx.user.update({
                where: { id: ratedUserId },
                data: {
                    positiveRatings: { increment: isPositive ? 1 : -1 },
                    negativeRatings: { increment: isPositive ? -1 : 1 },
                },
            });
        } else {
            await tx.memberRating.create({
                data: { groupId: id, raterId: user.id, ratedUserId, isPositive },
            });
            await tx.user.update({
                where: { id: ratedUserId },
                data: {
                    [isPositive ? 'positiveRatings' : 'negativeRatings']: { increment: 1 },
                },
            });
        }
    });

    res.json({ success: true, data: { message: '評價成功' } });
});

/**
 * GET /groups/:id/ratings
 * 取得目前使用者已評過誰
 */
router.get('/:id/ratings', firebaseAuthMiddleware, async (req: Request, res: Response) => {
    const user = req.user!;
    const { id } = req.params;

    const ratings = await prisma.memberRating.findMany({
        where: { groupId: id, raterId: user.id },
        select: { ratedUserId: true, isPositive: true },
    });

    res.json({
        success: true,
        data: Object.fromEntries(ratings.map(r => [r.ratedUserId, r.isPositive])),
    });
});

export default router;
