'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { SportType, SkillLevel } from '@/types';

interface Group {
    id: string;
    sportType: string;
    title: string;
    description: string | null;
    time: string;
    location: string;
    level: string;
    capacity: number;
    currentCount: number;
    status: string;
    createdBy: { nickname: string | null; email: string };
}

const SPORT_ICONS: Record<string, string> = {
    BASKETBALL: '🏀',
    RUNNING: '🏃',
    BADMINTON: '🏸',
    TABLE_TENNIS: '🏓',
    GYM: '💪',
};

const SPORT_NAMES: Record<string, string> = {
    BASKETBALL: '籃球',
    RUNNING: '跑步',
    BADMINTON: '羽球',
    TABLE_TENNIS: '桌球',
    GYM: '健身',
};

const LEVEL_NAMES: Record<string, string> = {
    BEGINNER: '初學者',
    INTERMEDIATE: '中級',
    ADVANCED: '進階',
    ANY: '不限',
};

export default function GroupsPage() {
    const { user } = useAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        sportType: '',
        level: '',
        hasSlot: false,
    });

    useEffect(() => {
        fetchGroups();
    }, [filters]);

    const fetchGroups = async () => {
        setLoading(true);
        const query: Record<string, string> = {};
        if (filters.sportType) query.sportType = filters.sportType;
        if (filters.level) query.level = filters.level;
        if (filters.hasSlot) query.hasSlot = 'true';

        const response = await api.getGroups(query);
        if (response.success && response.data) {
            setGroups(response.data.items as Group[]);
        }
        setLoading(false);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-TW', {
            month: 'short',
            day: 'numeric',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen pt-20 pb-10 px-4">
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Link href="/" className="text-gray-400 hover:text-white text-sm mb-2 inline-block">
                            ← 返回首頁
                        </Link>
                        <h1 className="text-3xl font-bold">揪團列表</h1>
                    </div>
                    {user && (
                        <Link href="/create" className="btn-primary">
                            ✨ 發起揪團
                        </Link>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-5xl mx-auto mb-6">
                <div className="glass-card p-4 flex flex-wrap gap-4">
                    <select
                        value={filters.sportType}
                        onChange={(e) => setFilters({ ...filters, sportType: e.target.value })}
                        className="input-field w-auto min-w-32"
                    >
                        <option value="">全部運動</option>
                        {Object.entries(SportType).map(([key, value]) => (
                            <option key={key} value={value}>
                                {SPORT_ICONS[value]} {SPORT_NAMES[value]}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.level}
                        onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                        className="input-field w-auto min-w-32"
                    >
                        <option value="">全部程度</option>
                        {Object.entries(SkillLevel).map(([key, value]) => (
                            <option key={key} value={value}>
                                {LEVEL_NAMES[value]}
                            </option>
                        ))}
                    </select>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.hasSlot}
                            onChange={(e) => setFilters({ ...filters, hasSlot: e.target.checked })}
                            className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">只顯示有空位</span>
                    </label>
                </div>
            </div>

            {/* Groups Grid */}
            <div className="max-w-5xl mx-auto">
                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="glass-card p-6 animate-pulse">
                                <div className="h-6 bg-white/10 rounded mb-4 w-3/4" />
                                <div className="h-4 bg-white/10 rounded mb-2 w-1/2" />
                                <div className="h-4 bg-white/10 rounded w-2/3" />
                            </div>
                        ))}
                    </div>
                ) : groups.length === 0 ? (
                    <div className="glass-card p-10 text-center">
                        <div className="text-4xl mb-4">🏃</div>
                        <p className="text-gray-400 mb-4">目前沒有符合條件的揪團</p>
                        {user && (
                            <Link href="/create" className="btn-primary">
                                成為第一個發起揪團的人！
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groups.map((group) => (
                            <Link
                                key={group.id}
                                href={`/groups/${group.id}`}
                                className="glass-card p-6 block group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <span className="sport-tag">
                                        {SPORT_ICONS[group.sportType]} {SPORT_NAMES[group.sportType]}
                                    </span>
                                    <span
                                        className={`level-tag ${group.level === 'BEGINNER'
                                            ? 'level-beginner'
                                            : group.level === 'INTERMEDIATE'
                                                ? 'level-intermediate'
                                                : 'level-advanced'
                                            }`}
                                    >
                                        {LEVEL_NAMES[group.level]}
                                    </span>
                                </div>

                                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary-400 transition">
                                    {group.title}
                                </h3>

                                <div className="text-sm text-gray-400 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span>📅</span>
                                        <span>{formatDate(group.time)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>📍</span>
                                        <span>{group.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>👥</span>
                                        <span>
                                            {group.currentCount}/{group.capacity} 人
                                            {group.currentCount >= group.capacity && (
                                                <span className="text-red-400 ml-2">已滿</span>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500">
                                    發起人：{group.createdBy.nickname || group.createdBy.email.split('@')[0]}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
