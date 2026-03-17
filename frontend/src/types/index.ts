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

export type SportType = (typeof SportType)[keyof typeof SportType];

export const SkillLevel = {
    BEGINNER: 'BEGINNER',
    INTERMEDIATE: 'INTERMEDIATE',
    ADVANCED: 'ADVANCED',
    ANY: 'ANY',
} as const;

export type SkillLevel = (typeof SkillLevel)[keyof typeof SkillLevel];

export const PlanType = {
    FREE: 'FREE',
    PLUS: 'PLUS',
} as const;

export type PlanType = (typeof PlanType)[keyof typeof PlanType];

export const GroupStatus = {
    OPEN: 'OPEN',
    FULL: 'FULL',
    CANCELLED: 'CANCELLED',
    COMPLETED: 'COMPLETED',
} as const;

export type GroupStatus = (typeof GroupStatus)[keyof typeof GroupStatus];

export const MemberStatus = {
    JOINED: 'JOINED',
    WAITLIST: 'WAITLIST',
    LEFT: 'LEFT',
} as const;

export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus];

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}
