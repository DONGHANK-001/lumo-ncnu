'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api-client';

const SAFETY_RULES = [
    {
        icon: '🏟️',
        title: '選擇公共場所',
        description: '請在校園內公共場所進行運動活動，如體育館、操場等人多的地方。',
    },
    {
        icon: '👥',
        title: '首次見面要小心',
        description: '首次與新成員見面，建議選擇人多且有監視器的場地。',
    },
    {
        icon: '📱',
        title: '告知親友行蹤',
        description: '出門運動前，告知親友您的活動時間、地點與預計返回時間。',
    },
    {
        icon: '🎯',
        title: '遵守場地規則',
        description: '尊重場地使用規則與禮儀，愛護公共設施。',
    },
    {
        icon: '🤝',
        title: '尊重每個人',
        description: '尊重每位參與者的程度差異，營造友善包容的運動環境。',
    },
    {
        icon: '🚨',
        title: '遇到不當行為立即離開',
        description: '如遇任何不當行為或感到不安全，請立即離開並向平台檢舉。',
    },
    {
        icon: '💰',
        title: '避免金錢往來',
        description: '請勿與他人進行金錢交易或借貸，保護自己的財務安全。',
    },
    {
        icon: '🔒',
        title: '保護個人隱私',
        description: '不要輕易透露個人敏感資訊，如住址、電話、身分證字號等。',
    },
];

const REPORT_REASONS = [
    '騷擾或不當言語',
    '詐騙或金錢糾紛',
    '爽約或遲到不報',
    '假冒身分',
    '其他違規行為',
];

export default function SafetyPage() {
    const { user, getToken } = useAuth();
    const [showReportForm, setShowReportForm] = useState(false);
    const [reportForm, setReportForm] = useState({
        targetType: 'USER',
        targetId: '',
        reason: '',
        details: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setMessage({ type: 'error', text: '請先登入' });
            return;
        }

        if (!reportForm.targetId || !reportForm.reason) {
            setMessage({ type: 'error', text: '請填寫必填欄位' });
            return;
        }

        setSubmitting(true);
        setMessage(null);

        const token = await getToken();
        const response = await api.createReport(token!, {
            targetType: reportForm.targetType,
            targetId: reportForm.targetId,
            reason: reportForm.reason,
            details: reportForm.details,
        });

        if (response.success) {
            setMessage({ type: 'success', text: '檢舉已送出，我們會盡快處理' });
            setReportForm({ targetType: 'USER', targetId: '', reason: '', details: '' });
            setShowReportForm(false);
        } else {
            setMessage({ type: 'error', text: response.error?.message || '送出失敗' });
        }
        setSubmitting(false);
    };

    return (
        <div className="min-h-screen pt-20 pb-10 px-4">
            <div className="max-w-3xl mx-auto">
                <Link href="/" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
                    ← 返回首頁
                </Link>

                <div className="text-center mb-12">
                    <div className="text-4xl mb-4">🛡️</div>
                    <h1 className="text-3xl font-bold mb-4">安全規範</h1>
                    <p className="text-gray-400">你的安全是我們最重視的事</p>
                </div>

                {/* Safety Rules */}
                <div className="grid md:grid-cols-2 gap-4 mb-12">
                    {SAFETY_RULES.map((rule, index) => (
                        <div key={index} className="glass-card p-6">
                            <div className="flex items-start gap-4">
                                <div className="text-3xl">{rule.icon}</div>
                                <div>
                                    <h3 className="font-semibold mb-1">{rule.title}</h3>
                                    <p className="text-sm text-gray-400">{rule.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Report Section */}
                <div className="glass-card p-8">
                    <h2 className="text-xl font-bold mb-4">🚨 檢舉不當行為</h2>
                    <p className="text-gray-400 mb-6">
                        如果你遇到任何違規行為或感到不安全，請立即向我們檢舉。我們會認真處理每一則檢舉。
                    </p>

                    {!showReportForm ? (
                        <button
                            onClick={() => setShowReportForm(true)}
                            className="btn-secondary"
                        >
                            📝 提交檢舉
                        </button>
                    ) : (
                        <form onSubmit={handleSubmitReport} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">檢舉對象類型 *</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="targetType"
                                            value="USER"
                                            checked={reportForm.targetType === 'USER'}
                                            onChange={(e) => setReportForm({ ...reportForm, targetType: e.target.value })}
                                            className="w-4 h-4"
                                        />
                                        <span>使用者</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="targetType"
                                            value="GROUP"
                                            checked={reportForm.targetType === 'GROUP'}
                                            onChange={(e) => setReportForm({ ...reportForm, targetType: e.target.value })}
                                            className="w-4 h-4"
                                        />
                                        <span>揪團</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">對象 ID *</label>
                                <input
                                    type="text"
                                    required
                                    value={reportForm.targetId}
                                    onChange={(e) => setReportForm({ ...reportForm, targetId: e.target.value })}
                                    placeholder="請輸入使用者或揪團的 ID"
                                    className="input-field"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    可在使用者個人頁或揪團頁面的網址中找到
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">檢舉原因 *</label>
                                <select
                                    required
                                    value={reportForm.reason}
                                    onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="">請選擇原因</option>
                                    {REPORT_REASONS.map((reason) => (
                                        <option key={reason} value={reason}>
                                            {reason}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">詳細說明（選填）</label>
                                <textarea
                                    maxLength={1000}
                                    value={reportForm.details}
                                    onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })}
                                    placeholder="請描述發生的情況..."
                                    className="input-field min-h-24 resize-none"
                                />
                            </div>

                            {message && (
                                <div
                                    className={`p-4 rounded-xl ${message.type === 'success'
                                            ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                                            : 'bg-red-500/10 border border-red-500/30 text-red-300'
                                        }`}
                                >
                                    {message.text}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary disabled:opacity-50"
                                >
                                    {submitting ? '送出中...' : '送出檢舉'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowReportForm(false)}
                                    className="btn-secondary"
                                >
                                    取消
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Emergency Contact */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>如遇緊急情況，請撥打 110 報警或 119 求助</p>
                </div>
            </div>
        </div>
    );
}
