'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { SportType, SkillLevel } from '@lumo/shared';

const SPORT_OPTIONS = [
    { value: 'BASKETBALL', label: '🏀 籃球' },
    { value: 'RUNNING', label: '🏃 跑步' },
    { value: 'BADMINTON', label: '🏸 羽球' },
    { value: 'TABLE_TENNIS', label: '🏓 桌球' },
    { value: 'GYM', label: '💪 健身' },
];

const LEVEL_OPTIONS = [
    { value: 'ANY', label: '不限程度' },
    { value: 'BEGINNER', label: '初學者' },
    { value: 'INTERMEDIATE', label: '中級' },
    { value: 'ADVANCED', label: '進階' },
];

export default function CreateGroupPage() {
    const router = useRouter();
    const { user, getToken, signIn } = useAuth();

    const [form, setForm] = useState({
        sportType: 'BASKETBALL',
        title: '',
        description: '',
        time: '',
        location: '',
        level: 'ANY',
        capacity: 4,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setError('請先登入');
            return;
        }

        setLoading(true);
        setError(null);

        const token = await getToken();
        const response = await api.createGroup(token!, {
            ...form,
            time: new Date(form.time).toISOString(),
        });

        if (response.success && response.data) {
            router.push(`/groups/${(response.data as { id: string }).id}`);
        } else {
            setError(response.error?.message || '建立失敗');
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen pt-20 pb-10 px-4">
                <div className="max-w-xl mx-auto glass-card p-10 text-center">
                    <div className="text-4xl mb-4">🔐</div>
                    <h1 className="text-2xl font-bold mb-4">請先登入</h1>
                    <p className="text-gray-400 mb-6">需要登入才能發起揪團</p>
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
                <Link href="/groups" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
                    ← 返回列表
                </Link>

                <h1 className="text-3xl font-bold mb-8">✨ 發起揪團</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Sport Type */}
                    <div className="glass-card p-6">
                        <label className="block text-sm font-medium mb-3">運動類型</label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {SPORT_OPTIONS.map((sport) => (
                                <button
                                    key={sport.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, sportType: sport.value })}
                                    className={`p-3 rounded-xl text-center transition-all ${form.sportType === sport.value
                                            ? 'bg-primary-500/20 border-2 border-primary-500'
                                            : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                                        }`}
                                >
                                    {sport.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title & Description */}
                    <div className="glass-card p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">揪團標題 *</label>
                            <input
                                type="text"
                                required
                                maxLength={100}
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="例如：週五晚上來打球！"
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">說明（選填）</label>
                            <textarea
                                maxLength={500}
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="提供更多資訊，例如：新手友善、歡迎女生參加..."
                                className="input-field min-h-24 resize-none"
                            />
                        </div>
                    </div>

                    {/* Time & Location */}
                    <div className="glass-card p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">時間 *</label>
                            <input
                                type="datetime-local"
                                required
                                value={form.time}
                                onChange={(e) => setForm({ ...form, time: e.target.value })}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">地點 *</label>
                            <input
                                type="text"
                                required
                                maxLength={100}
                                value={form.location}
                                onChange={(e) => setForm({ ...form, location: e.target.value })}
                                placeholder="例如：暨大體育館、操場、健身房"
                                className="input-field"
                            />
                        </div>
                    </div>

                    {/* Level & Capacity */}
                    <div className="glass-card p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">程度要求</label>
                            <select
                                value={form.level}
                                onChange={(e) => setForm({ ...form, level: e.target.value })}
                                className="input-field"
                            >
                                {LEVEL_OPTIONS.map((level) => (
                                    <option key={level.value} value={level.value}>
                                        {level.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">人數上限（含自己）</label>
                            <input
                                type="number"
                                min={2}
                                max={50}
                                value={form.capacity}
                                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 4 })}
                                className="input-field"
                            />
                        </div>
                    </div>

                    {/* Preview Card */}
                    <div className="glass-card p-6">
                        <h3 className="text-sm font-medium mb-3 text-gray-400">預覽卡片</h3>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="sport-tag text-sm">
                                    {SPORT_OPTIONS.find((s) => s.value === form.sportType)?.label}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {LEVEL_OPTIONS.find((l) => l.value === form.level)?.label}
                                </span>
                            </div>
                            <h4 className="font-semibold mb-2">{form.title || '（輸入標題）'}</h4>
                            <div className="text-sm text-gray-400 space-y-1">
                                <div>📅 {form.time ? new Date(form.time).toLocaleString('zh-TW') : '（選擇時間）'}</div>
                                <div>📍 {form.location || '（輸入地點）'}</div>
                                <div>👥 1/{form.capacity} 人</div>
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-4 text-lg disabled:opacity-50"
                    >
                        {loading ? '建立中...' : '🚀 發起揪團'}
                    </button>
                </form>
            </div>
        </div>
    );
}
