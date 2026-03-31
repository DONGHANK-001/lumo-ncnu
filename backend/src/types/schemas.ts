import { z } from 'zod';
import { SportType, SkillLevel } from './index.js';

// ============================================
// Zod Schemas (derived from shared enums)
// ============================================

const sportTypeValues = Object.values(SportType) as [string, ...string[]];
const skillLevelValues = Object.values(SkillLevel) as [string, ...string[]];

export const ReportTargetType = {
    USER: 'USER',
    GROUP: 'GROUP',
} as const;

// ============================================
// User Schemas
// ============================================

export const sportTypeSchema = z.enum(sportTypeValues);

export const skillLevelSchema = z.enum(skillLevelValues);

export const userPreferencesSchema = z.object({
    sports: z.array(sportTypeSchema),
    skillLevel: skillLevelSchema,
    availableTimes: z.array(z.string()),
    usualLocations: z.array(z.string()),
    bio: z.string().max(300).optional(),
    hobbies: z.string().max(200).optional(),
    socialPreference: z.enum(['LOW_KEY', 'BALANCED', 'OUTGOING']).optional(),
});

export const genderSchema = z.enum([
    'FEMALE',
    'MALE',
    'NON_BINARY',
    'PREFER_NOT_TO_SAY',
]);

export const updateProfileSchema = z.object({
    nickname: z.string().min(1).max(50).optional(),
    preferences: userPreferencesSchema.optional(),
    department: z.string().min(1).max(100).optional(),
    gender: genderSchema.optional(),
    gradeLabel: z.string().min(1).max(30).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ============================================
// Group Schemas
// ============================================

export const createGroupSchema = z.object({
    sportType: sportTypeSchema,
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    time: z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Invalid datetime string' }),
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

// ============================================
// Feedback Schemas
// ============================================

export const createFeedbackSchema = z.object({
    content: z.string().min(1).max(1000),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
