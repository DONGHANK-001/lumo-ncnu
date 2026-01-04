// ============================================
// Enums
// ============================================

export const SportType = {
    BASKETBALL: 'BASKETBALL',
    RUNNING: 'RUNNING',
    BADMINTON: 'BADMINTON',
    TABLE_TENNIS: 'TABLE_TENNIS',
    GYM: 'GYM',
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

export const ReportTargetType = {
    USER: 'USER',
    GROUP: 'GROUP',
} as const;

export type ReportTargetType = (typeof ReportTargetType)[keyof typeof ReportTargetType];

// ============================================
// User
// ============================================

export interface UserPreferences {
    sports: SportType[];
    skillLevel: SkillLevel;
    availableTimes: string[];
    usualLocations: string[];
}

export interface User {
    id: string;
    firebaseUid: string;
    email: string;
    nickname: string | null;
    school: string;
    role: 'USER' | 'ADMIN';
    planType: PlanType;
    preferences: UserPreferences | null;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// Group
// ============================================

export interface Group {
    id: string;
    sportType: SportType;
    title: string;
    description: string | null;
    time: Date;
    location: string;
    level: SkillLevel;
    capacity: number;
    currentCount: number;
    createdById: string;
    status: GroupStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface GroupMember {
    id: string;
    groupId: string;
    userId: string;
    status: MemberStatus;
    joinedAt: Date;
}

// ============================================
// Report
// ============================================

export interface Report {
    id: string;
    reporterId: string;
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
    details: string | null;
    createdAt: Date;
}

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
