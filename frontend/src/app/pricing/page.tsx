'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api-client';

const FEATURES = [
    { name: '瀏覽揪團', free: true, plus: true },
    { name: '發起揪團', free: true, plus: true },
    { name: '加入揪團', free: true, plus: true },
    { name: '個人偏好設定', free: true, plus: true },
    { name: '候補功能', free: false, plus: true },
    { name: '優先配對（即將推出）', free: false, plus: true },
    { name: '專屬徽章', free: false, plus: true },
];

export default function PricingPage() {
    const { user, getToken, refreshUser } = useAuth();

    const handleUpgrade = async () => {
        if (!user) return;

        const token = await getToken();
        const response = await api.upgradePlan(token!);

        if (response.success) {
            await refreshUser();
            alert('升級成功！您現在是 PLUS 會員');
        } else {
            alert(response.error?.message || '升級失敗');
        }
    };

    return (
        <div className="min-h-screen pt-20 pb-10 px-4">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
                    ← 返回首頁
                </Link>

                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold mb-4">選擇適合你的方案</h1>
                    <p className="text-gray-400">免費使用核心功能，升級解鎖更多特權</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    {/* Free Plan */}
                    <div className="glass-card p-8">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold mb-2">Free</h2>
                            <div className="text-4xl font-bold mb-1">$0</div>
                            <div className="text-gray-400 text-sm">永久免費</div>
                        </div>

                        <ul className="space-y-3 mb-8">
                            {FEATURES.map((feature) => (
                                <li key={feature.name} className="flex items-center gap-3">
                                    {feature.free ? (
                                        <span className="text-primary-400">✓</span>
                                    ) : (
                                        <span className="text-gray-600">✗</span>
                                    )}
                                    <span className={feature.free ? '' : 'text-gray-500'}>{feature.name}</span>
                                </li>
                            ))}
                        </ul>

                        {user?.planType === 'FREE' && (
                            <div className="text-center p-3 rounded-xl bg-white/5 text-gray-400">
                                目前方案
                            </div>
                        )}

                        {!user && (
                            <Link href="/" className="btn-secondary w-full block text-center py-3">
                                開始使用
                            </Link>
                        )}
                    </div>

                    {/* Plus Plan */}
                    <div className="glass-card p-8 border-2 border-accent-500/50 relative overflow-hidden">
                        {/* Glow effect */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent-500/20 rounded-full blur-3xl" />

                        <div className="relative">
                            <div className="text-center mb-6">
                                <div className="inline-block plus-badge text-sm px-3 py-1 mb-3">推薦</div>
                                <h2 className="text-2xl font-bold mb-2">PLUS</h2>
                                <div className="text-4xl font-bold mb-1">
                                    $20<span className="text-lg font-normal text-gray-400">/月</span>
                                </div>
                                <div className="text-gray-400 text-sm">解鎖所有功能</div>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {FEATURES.map((feature) => (
                                    <li key={feature.name} className="flex items-center gap-3">
                                        {feature.plus ? (
                                            <span className="text-accent-400">✓</span>
                                        ) : (
                                            <span className="text-gray-600">✗</span>
                                        )}
                                        <span className={feature.plus ? '' : 'text-gray-500'}>{feature.name}</span>
                                    </li>
                                ))}
                            </ul>

                            {user?.planType === 'PLUS' ? (
                                <div className="text-center p-3 rounded-xl bg-accent-500/10 text-accent-300 border border-accent-500/30">
                                    ✓ 已是 PLUS 會員
                                </div>
                            ) : user ? (
                                <button onClick={handleUpgrade} className="btn-primary w-full py-3">
                                    立即升級
                                </button>
                            ) : (
                                <Link href="/" className="btn-primary w-full block text-center py-3">
                                    登入後升級
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* FAQ */}
                <div className="mt-16 max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-8">常見問題</h2>
                    <div className="space-y-4">
                        <div className="glass-card p-6">
                            <h3 className="font-semibold mb-2">什麼是候補功能？</h3>
                            <p className="text-gray-400 text-sm">
                                當揪團人數已滿時，PLUS 會員可以加入候補名單。當有人退出時，系統會自動將候補成員遞補加入。
                            </p>
                        </div>
                        <div className="glass-card p-6">
                            <h3 className="font-semibold mb-2">如何付款？</h3>
                            <p className="text-gray-400 text-sm">
                                目前第一版為模擬升級功能，未來將支援信用卡與行動支付。
                            </p>
                        </div>
                        <div className="glass-card p-6">
                            <h3 className="font-semibold mb-2">可以隨時取消嗎？</h3>
                            <p className="text-gray-400 text-sm">
                                是的，你可以隨時取消訂閱，已付款的期間仍可繼續使用 PLUS 功能。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
