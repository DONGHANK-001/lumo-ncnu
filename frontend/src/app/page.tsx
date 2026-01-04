'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';

const SPORTS = [
    { icon: '🏀', name: '籃球', color: 'from-orange-500 to-red-500' },
    { icon: '🏃', name: '跑步', color: 'from-blue-500 to-cyan-500' },
    { icon: '🏸', name: '羽球', color: 'from-green-500 to-emerald-500' },
    { icon: '🏓', name: '桌球', color: 'from-yellow-500 to-orange-500' },
    { icon: '💪', name: '健身', color: 'from-purple-500 to-pink-500' },
];

export default function LandingPage() {
    const { user, loading, error, signIn } = useAuth(); // 加入 error
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    // 錯誤提示自動消失
    const [showError, setShowError] = useState(false);
    useEffect(() => {
        if (error) {
            setShowError(true);
            const timer = setTimeout(() => setShowError(false), 5000); // 5秒後消失
            return () => clearTimeout(timer);
        }
    }, [error]);

    // PWA 安裝提示
    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowInstallPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            setDeferredPrompt(null);
            setShowInstallPrompt(false);
        }
    };

    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-2xl">🌟</span>
                            <span className="font-bold text-xl bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                                Lumo NCNU
                            </span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href="/groups" className="text-gray-300 hover:text-white transition">
                                揪團列表
                            </Link>
                            <Link href="/pricing" className="text-gray-300 hover:text-white transition">
                                方案
                            </Link>
                            {loading ? (
                                <div className="w-20 h-10 bg-white/10 animate-pulse rounded-xl" />
                            ) : user ? (
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition"
                                >
                                    <span className="text-sm">{user.nickname || user.email.split('@')[0]}</span>
                                    {user.planType === 'PLUS' && <span className="plus-badge">PLUS</span>}
                                </Link>
                            ) : (
                                <button onClick={signIn} className="btn-primary text-sm">
                                    登入
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Error Toast */}
            {showError && error && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce w-full max-w-md px-4 pointer-events-none">
                    <div className="bg-red-500/90 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border border-red-400">
                        <span className="text-2xl">🚫</span>
                        <p className="font-medium text-sm sm:text-base">{error}</p>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 overflow-hidden">
                {/* 背景裝飾 */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
                </div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
                        找到你的
                        <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 bg-clip-text text-transparent">
                            {' '}運動夥伴{' '}
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto animate-slide-up">
                        暨南大學專屬運動配對平台<br />
                        揪團、配對、一起動起來！
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
                        <Link href="/groups" className="btn-primary text-lg px-8 py-4">
                            🏃 瀏覽揪團
                        </Link>
                        {user ? (
                            <Link href="/create" className="btn-secondary text-lg px-8 py-4">
                                ✨ 發起揪團
                            </Link>
                        ) : (
                            <button onClick={signIn} className="btn-secondary text-lg px-8 py-4">
                                🔐 使用學生帳號登入
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* Sports Section */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-10">支援運動類型</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {SPORTS.map((sport) => (
                            <div
                                key={sport.name}
                                className="glass-card p-6 text-center cursor-pointer group"
                            >
                                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                                    {sport.icon}
                                </div>
                                <div className="font-medium">{sport.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="glass-card p-8">
                            <div className="text-3xl mb-4">🎯</div>
                            <h3 className="text-xl font-semibold mb-2">智慧配對</h3>
                            <p className="text-gray-400">
                                根據程度、時間、地點，找到最適合你的運動夥伴
                            </p>
                        </div>
                        <div className="glass-card p-8">
                            <div className="text-3xl mb-4">📱</div>
                            <h3 className="text-xl font-semibold mb-2">隨時揪團</h3>
                            <p className="text-gray-400">
                                即時發起或加入揪團，不再獨自運動
                            </p>
                        </div>
                        <div className="glass-card p-8">
                            <div className="text-3xl mb-4">🛡️</div>
                            <h3 className="text-xl font-semibold mb-2">校園限定</h3>
                            <p className="text-gray-400">
                                僅限暨南學生使用，安全有保障
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="max-w-3xl mx-auto text-center glass-card p-10">
                    <h2 className="text-3xl font-bold mb-4">準備好開始了嗎？</h2>
                    <p className="text-gray-400 mb-8">
                        使用暨南學生 Google 帳號即可開始使用
                    </p>
                    {!user && (
                        <button onClick={signIn} className="btn-primary text-lg px-8 py-4">
                            🚀 立即開始
                        </button>
                    )}
                    {user && (
                        <Link href="/groups" className="btn-primary text-lg px-8 py-4 inline-block">
                            🏃 查看揪團
                        </Link>
                    )}
                </div>
            </section>

            {/* PWA Install Prompt */}
            {showInstallPrompt && (
                <div className="fixed bottom-4 left-4 right-4 z-50 glass-card p-4 flex items-center justify-between sm:max-w-md sm:mx-auto">
                    <div>
                        <p className="font-medium">安裝 Lumo NCNU</p>
                        <p className="text-sm text-gray-400">加入主畫面，更快存取</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowInstallPrompt(false)}
                            className="px-3 py-2 text-sm text-gray-400"
                        >
                            稍後
                        </button>
                        <button onClick={handleInstall} className="btn-primary text-sm px-4 py-2">
                            安裝
                        </button>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="py-8 px-4 border-t border-white/10">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-gray-500 text-sm">
                        © 2026 Lumo NCNU. 專為暨南大學學生打造。
                    </div>
                    <div className="flex gap-6 text-sm">
                        <Link href="/safety" className="text-gray-400 hover:text-white transition">
                            安全規範
                        </Link>
                        <Link href="/pricing" className="text-gray-400 hover:text-white transition">
                            方案比較
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// PWA install prompt type
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
