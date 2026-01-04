'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

const SPORT_OPTIONS = [
    { value: 'BASKETBALL', label: '🏀 籃球' },
    { value: 'RUNNING', label: '🏃 跑步' },
    { value: 'BADMINTON', label: '🏸 羽球' },
    { value: 'TABLE_TENNIS', label: '🏓 桌球' },
    { value: 'GYM', label: '💪 健身' },
];

const LEVEL_OPTIONS = [
    { value: 'BEGINNER', label: '初學者' },
    { value: 'INTERMEDIATE', label: '中級' },
    { value: 'ADVANCED', label: '進階' },
    { value: 'ANY', label: '不限' },
];

const TIME_OPTIONS = [
    '平日早上',
    '平日中午',
    '平日晚上',
    '週末早上',
    '週末下午',
    '週末晚上',
];

const LOCATION_OPTIONS = [
    '體育館',
    '操場',
    '健身房',
    '籃球場',
    '羽球場',
];

export default function ProfilePage() {
    const router = useRouter();
    const { user, loading, signIn, signOut, getToken, refreshUser } = useAuth();

    const [form, setForm] = useState({
        nickname: '',
        sports: [] as string[],
        skillLevel: 'BEGINNER',
        availableTimes: [] as string[],
        usualLocations: [] as string[],
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (user) {
            setForm({
                nickname: user.nickname || '',
                sports: (user as any).preferences?.sports || [],
                skillLevel: (user as any).preferences?.skillLevel || 'BEGINNER',
                availableTimes: (user as any).preferences?.availableTimes || [],
                usualLocations: (user as any).preferences?.usualLocations || [],
            });
        }
    }, [user]);

    const toggleArrayItem = (array: string[], item: string) => {
        return array.includes(item) ? array.filter((i) => i !== item) : [...array, item];
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        setMessage(null);

        const token = await getToken();
        const response = await api.updateProfile(token!, {
            nickname: form.nickname,
            preferences: {
                sports: form.sports,
                skillLevel: form.skillLevel,
                availableTimes: form.availableTimes,
                usualLocations: form.usualLocations,
            },
        });

        if (response.success) {
            setMessage({ type: 'success', text: '已儲存！' });
            await refreshUser();
        } else {
            setMessage({ type: 'error', text: response.error?.message || '儲存失敗' });
        }
        setSaving(false);
    };

    const handleUpgrade = async () => {
        if (!user) return;

        setSaving(true);
        const token = await getToken();
        const response = await api.upgradePlan(token!);

        if (response.success) {
            setMessage({ type: 'success', text: '升級成功！您現在是 PLUS 會員' });
            await refreshUser();
        } else {
            setMessage({ type: 'error', text: response.error?.message || '升級失敗' });
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-20 pb-10 px-4">
                <div className="max-w-xl mx-auto glass-card p-8 animate-pulse">
                    <div className="h-8 bg-white/10 rounded w-1/2 mb-6" />
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 bg-white/10 rounded" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen pt-20 pb-10 px-4">
                <div className="max-w-xl mx-auto glass-card p-10 text-center">
                    <div className="text-4xl mb-4">👤</div>
                    <h1 className="text-2xl font-bold mb-4">個人檔案</h1>
                    <p className="text-gray-400 mb-6">請先登入以查看個人檔案</p>
                    <button onClick={signIn} className="btn-primary">
                        使用學生帳號登入
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 pb-10 px-4">
            <div className="max-w-xl mx-auto">
                <Link href="/" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
                    ← 返回首頁
                </Link>

                <h1 className="text-3xl font-bold mb-8">👤 個人檔案</h1>

                {/* User Info */}
                <div className="glass-card p-6 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-2xl font-bold">
                            {(form.nickname || user.email)[0].toUpperCase()}
                        </div>
                        <div>
                            <div className="text-lg font-semibold">{form.nickname || '未設定暱稱'}</div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                            {user.planType === 'PLUS' && (
                                <span className="plus-badge mt-1 inline-block">PLUS 會員</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">暱稱</label>
                        <input
                            type="text"
                            maxLength={50}
                            value={form.nickname}
                            onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                            placeholder="輸入你的暱稱"
                            className="input-field"
                        />
                    </div>
                </div>

                {/* Preferences */}
                <div className="glass-card p-6 mb-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-3">喜好運動</label>
                        <div className="flex flex-wrap gap-2">
                            {SPORT_OPTIONS.map((sport) => (
                                <button
                                    key={sport.value}
                                    type="button"
                                    onClick={() =>
                                        setForm({ ...form, sports: toggleArrayItem(form.sports, sport.value) })
                                    }
                                    className={`px-4 py-2 rounded-xl transition-all ${form.sports.includes(sport.value)
                                            ? 'bg-primary-500/20 border-2 border-primary-500'
                                            : 'bg-white/5 border-2 border-transparent'
                                        }`}
                                >
                                    {sport.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-3">程度</label>
                        <div className="flex flex-wrap gap-2">
                            {LEVEL_OPTIONS.map((level) => (
                                <button
                                    key={level.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, skillLevel: level.value })}
                                    className={`px-4 py-2 rounded-xl transition-all ${form.skillLevel === level.value
                                            ? 'bg-primary-500/20 border-2 border-primary-500'
                                            : 'bg-white/5 border-2 border-transparent'
                                        }`}
                                >
                                    {level.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-3">可運動時段</label>
                        <div className="flex flex-wrap gap-2">
                            {TIME_OPTIONS.map((time) => (
                                <button
                                    key={time}
                                    type="button"
                                    onClick={() =>
                                        setForm({ ...form, availableTimes: toggleArrayItem(form.availableTimes, time) })
                                    }
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${form.availableTimes.includes(time)
                                            ? 'bg-primary-500/20 border border-primary-500'
                                            : 'bg-white/5 border border-transparent'
                                        }`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-3">常去地點</label>
                        <div className="flex flex-wrap gap-2">
                            {LOCATION_OPTIONS.map((loc) => (
                                <button
                                    key={loc}
                                    type="button"
                                    onClick={() =>
                                        setForm({ ...form, usualLocations: toggleArrayItem(form.usualLocations, loc) })
                                    }
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${form.usualLocations.includes(loc)
                                            ? 'bg-primary-500/20 border border-primary-500'
                                            : 'bg-white/5 border border-transparent'
                                        }`}
                                >
                                    {loc}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Plan Status */}
                {user.planType === 'FREE' && (
                    <div className="glass-card p-6 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-semibold">升級 PLUS</div>
                                <div className="text-sm text-gray-400">每月 $20，解鎖候補功能</div>
                            </div>
                            <button onClick={handleUpgrade} disabled={saving} className="btn-primary">
                                {saving ? '處理中...' : '升級'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Message */}
                {message && (
                    <div
                        className={`p-4 mb-6 rounded-xl ${message.type === 'success'
                                ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                                : 'bg-red-500/10 border border-red-500/30 text-red-300'
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary flex-1 py-3 disabled:opacity-50"
                    >
                        {saving ? '儲存中...' : '💾 儲存變更'}
                    </button>
                    <button onClick={signOut} className="btn-secondary px-6 py-3">
                        登出
                    </button>
                </div>
            </div>
        </div>
    );
}
