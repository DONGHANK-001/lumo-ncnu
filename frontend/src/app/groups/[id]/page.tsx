'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

interface GroupDetail {
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
    createdBy: { id: string; nickname: string | null; email: string };
    members: Array<{
        user: { id: string; nickname: string | null; email: string };
        status: string;
        joinedAt: string;
    }>;
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

export default function GroupDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { user, getToken } = useAuth();

    const [group, setGroup] = useState<GroupDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchGroup();
    }, [id]);

    const fetchGroup = async () => {
        setLoading(true);
        const token = await getToken();
        const response = await api.getGroup(id, token || undefined);

        if (response.success && response.data) {
            setGroup(response.data as GroupDetail);
        } else {
            setError(response.error?.message || '無法載入揪團');
        }
        setLoading(false);
    };

    const handleJoin = async () => {
        if (!user) {
            setError('請先登入');
            return;
        }

        setActionLoading(true);
        setError(null);

        const token = await getToken();
        const response = await api.joinGroup(token!, id);

        if (response.success) {
            await fetchGroup();
        } else {
            setError(response.error?.message || '加入失敗');
        }
        setActionLoading(false);
    };

    const handleLeave = async () => {
        if (!user) return;

        setActionLoading(true);
        setError(null);

        const token = await getToken();
        const response = await api.leaveGroup(token!, id);

        if (response.success) {
            await fetchGroup();
        } else {
            setError(response.error?.message || '退出失敗');
        }
        setActionLoading(false);
    };

    const handleWaitlist = async () => {
        if (!user) {
            setError('請先登入');
            return;
        }

        if (user.planType !== 'PLUS') {
            router.push('/pricing');
            return;
        }

        setActionLoading(true);
        setError(null);

        const token = await getToken();
        const response = await api.waitlistGroup(token!, id);

        if (response.success) {
            await fetchGroup();
        } else {
            setError(response.error?.message || '候補失敗');
        }
        setActionLoading(false);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // 計算使用者狀態
    const userMember = group?.members.find((m) => m.user.id === user?.id);
    const isJoined = userMember?.status === 'JOINED';
    const isWaitlist = userMember?.status === 'WAITLIST';
    const isCreator = group?.createdBy.id === user?.id;
    const isFull = group ? group.currentCount >= group.capacity : false;
    const joinedMembers = group?.members.filter((m) => m.status === 'JOINED') || [];
    const waitlistMembers = group?.members.filter((m) => m.status === 'WAITLIST') || [];

    if (loading) {
        return (
            <div className="min-h-screen pt-20 pb-10 px-4">
                <div className="max-w-3xl mx-auto glass-card p-8 animate-pulse">
                    <div className="h-8 bg-white/10 rounded w-3/4 mb-4" />
                    <div className="h-4 bg-white/10 rounded w-1/2 mb-8" />
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-4 bg-white/10 rounded w-full" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="min-h-screen pt-20 pb-10 px-4">
                <div className="max-w-3xl mx-auto glass-card p-10 text-center">
                    <div className="text-4xl mb-4">😕</div>
                    <p className="text-gray-400 mb-4">{error || '找不到此揪團'}</p>
                    <Link href="/groups" className="btn-primary">
                        返回列表
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 pb-10 px-4">
            <div className="max-w-3xl mx-auto">
                <Link href="/groups" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
                    ← 返回列表
                </Link>

                <div className="glass-card p-8 mb-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <span className="sport-tag text-lg">
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

                    <h1 className="text-2xl font-bold mb-4">{group.title}</h1>

                    {group.description && (
                        <p className="text-gray-300 mb-6">{group.description}</p>
                    )}

                    {/* Info */}
                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5">
                            <span className="text-2xl">📅</span>
                            <div>
                                <div className="text-sm text-gray-400">時間</div>
                                <div className="font-medium">{formatDate(group.time)}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5">
                            <span className="text-2xl">📍</span>
                            <div>
                                <div className="text-sm text-gray-400">地點</div>
                                <div className="font-medium">{group.location}</div>
                            </div>
                        </div>
                    </div>

                    {/* Capacity */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-400">參與人數</span>
                            <span className="font-medium">
                                {group.currentCount}/{group.capacity} 人
                            </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all"
                                style={{ width: `${(group.currentCount / group.capacity) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                        {!user && (
                            <Link href="/" className="btn-primary">
                                登入後加入揪團
                            </Link>
                        )}

                        {user && !isJoined && !isWaitlist && !isFull && (
                            <button
                                onClick={handleJoin}
                                disabled={actionLoading}
                                className="btn-primary disabled:opacity-50"
                            >
                                {actionLoading ? '處理中...' : '加入揪團'}
                            </button>
                        )}

                        {user && !isJoined && !isWaitlist && isFull && (
                            <button
                                onClick={handleWaitlist}
                                disabled={actionLoading}
                                className="btn-secondary disabled:opacity-50"
                            >
                                {user.planType === 'PLUS' ? (
                                    actionLoading ? '處理中...' : '加入候補'
                                ) : (
                                    '🔓 升級 PLUS 可候補'
                                )}
                            </button>
                        )}

                        {user && isJoined && !isCreator && (
                            <button
                                onClick={handleLeave}
                                disabled={actionLoading}
                                className="btn-secondary disabled:opacity-50"
                            >
                                {actionLoading ? '處理中...' : '退出揪團'}
                            </button>
                        )}

                        {user && isWaitlist && (
                            <div className="px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
                                您在候補名單中
                            </div>
                        )}

                        {isCreator && (
                            <div className="px-4 py-2 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-300">
                                您是揪團發起人
                            </div>
                        )}

                        <Link href="/safety" className="btn-secondary">
                            🛡️ 安全提醒
                        </Link>
                    </div>
                </div>

                {/* Members */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4">
                        參與成員 ({joinedMembers.length})
                    </h2>
                    <div className="space-y-3">
                        {joinedMembers.map((member, index) => (
                            <div
                                key={member.user.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center font-bold">
                                        {(member.user.nickname || member.user.email)[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-medium">
                                            {member.user.nickname || member.user.email.split('@')[0]}
                                            {member.user.id === group.createdBy.id && (
                                                <span className="ml-2 text-xs text-primary-400">發起人</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {index === 0 ? '第一位' : `第 ${index + 1} 位`}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {waitlistMembers.length > 0 && (
                        <>
                            <h3 className="text-md font-semibold mt-6 mb-3 text-gray-400">
                                候補名單 ({waitlistMembers.length})
                            </h3>
                            <div className="space-y-2">
                                {waitlistMembers.map((member, index) => (
                                    <div
                                        key={member.user.id}
                                        className="flex items-center gap-3 p-2 rounded-lg bg-white/3"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-sm">
                                            {index + 1}
                                        </div>
                                        <span className="text-gray-400">
                                            {member.user.nickname || member.user.email.split('@')[0]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
