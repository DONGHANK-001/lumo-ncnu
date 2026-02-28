import { z } from 'zod';

// ============================================
// Enums
// ============================================

export const SportType = {
    BASKETBALL: 'BASKETBALL',
    RUNNING: 'RUNNING',
    BADMINTON: 'BADMINTON',
    TABLE_TENNIS: 'TABLE_TENNIS',
    GYM: 'GYM',
    VOLLEYBALL: 'VOLLEYBALL',
} as const;

export const SkillLevel = {
    BEGINNER: 'BEGINNER',
    INTERMEDIATE: 'INTERMEDIATE',
    ADVANCED: 'ADVANCED',
    ANY: 'ANY',
} as const;

export const ReportTargetType = {
    USER: 'USER',
    GROUP: 'GROUP',
} as const;

// ============================================
// User Schemas
// ============================================

export const sportTypeSchema = z.enum([
    'BASKETBALL',
    'RUNNING',
    'BADMINTON',
    'TABLE_TENNIS',
    'GYM',
    'VOLLEYBALL',
]);

export const skillLevelSchema = z.enum([
    'BEGINNER',
    'INTERMEDIATE',
    'ADVANCED',
    'ANY',
]);

export const userPreferencesSchema = z.object({
    sports: z.array(sportTypeSchema),
    skillLevel: skillLevelSchema,
    availableTimes: z.array(z.string()),
    usualLocations: z.array(z.string()),
});

export const updateProfileSchema = z.object({
    nickname: z.string().min(1).max(50).optional(),
    preferences: userPreferencesSchema.optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ============================================
// Group Schemas
// ============================================

export const createGroupSchema = z.object({
    sportType: sportTypeSchema,
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    time: z.string().datetime(),
    location: z.string().min(1).max(100),
    level: skillLevelSchema,
    capacity: z.number().int().min(2).max(50),
    tags: z.array(z.string()).max(10).optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const listGroupsQuerySchema = z.object({
    sportType: sportTypeSchema.optional(),
    level: skillLevelSchema.optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    hasSlot: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type ListGroupsQuery = z.infer<typeof listGroupsQuerySchema>;

// ============================================
// Report Schemas
// ============================================

export const reportTargetTypeSchema = z.enum(['USER', 'GROUP']);

export const createReportSchema = z.object({
    targetType: reportTargetTypeSchema,
    targetId: z.string().uuid(),
    reason: z.string().min(1).max(100),
    details: z.string().max(1000).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const createFeedbackSchema = z.object({
    content: z.string().min(1).max(1000),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
