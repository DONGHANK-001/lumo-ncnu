import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Lumo Group Preview';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

const SPORT_NAMES: Record<string, string> = {
    BASKETBALL: '籃球',
    RUNNING: '跑步',
    BADMINTON: '羽球',
    TABLE_TENNIS: '桌球',
    GYM: '健身',
};

const SPORT_EMOJIS: Record<string, string> = {
    BASKETBALL: '🏀',
    RUNNING: '🏃',
    BADMINTON: '🏸',
    TABLE_TENNIS: '🏓',
    GYM: '💪',
};

export default async function Image({ params }: { params: { id: string } }) {
    try {
        const res = await fetch(`${API_BASE_URL}/groups/${params.id}`);
        if (!res.ok) throw new Error('Failed to fetch');

        const json = await res.json();
        const group = json.data;

        if (!group) throw new Error('Not found');

        const sportEmoji = SPORT_EMOJIS[group.sportType] || '🔥';
        const sportName = SPORT_NAMES[group.sportType] || group.sportType;
        const timeStr = new Date(group.time).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const remaining = group.capacity - group.currentCount;
        const remainingText = remaining > 0 ? `${group.capacity}缺${remaining}` : '已滿團';
        const levelText = group.level === 'ANY' ? '不限程度' : group.level === 'BEGINNER' ? '新手友善' : group.level === 'INTERMEDIATE' ? '中階' : '進階';

        return new ImageResponse(
            (
                <div
                    style={{
                        background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '40px',
                        color: 'white',
                    }}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            width: '90%',
                            height: '80%',
                            padding: '60px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
                            <span style={{ fontSize: '80px', marginRight: '20px' }}>{sportEmoji}</span>
                            <div
                                style={{
                                    display: 'flex',
                                    color: '#4f46e5',
                                    fontWeight: 'bold',
                                    fontSize: '32px',
                                    backgroundColor: '#e0e7ff',
                                    padding: '8px 24px',
                                    borderRadius: '9999px',
                                }}
                            >
                                {sportName} · {levelText}
                            </div>
                        </div>

                        <h1
                            style={{
                                color: '#111827',
                                fontSize: '64px',
                                fontWeight: '900',
                                lineHeight: '1.2',
                                margin: '0 0 30px 0',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {group.title}
                        </h1>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', marginTop: 'auto' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <span style={{ color: '#6b7280', fontSize: '24px', fontWeight: 'bold' }}>時間</span>
                                <span style={{ color: '#1f2937', fontSize: '36px', fontWeight: 'bold' }}>{timeStr}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <span style={{ color: '#6b7280', fontSize: '24px', fontWeight: 'bold' }}>地點</span>
                                <span style={{ color: '#1f2937', fontSize: '36px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.location}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <span style={{ color: '#6b7280', fontSize: '24px', fontWeight: 'bold' }}>狀態</span>
                                <span style={{ color: remaining > 0 ? '#10b981' : '#ef4444', fontSize: '36px', fontWeight: 'bold' }}>
                                    {remainingText}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ),
            {
                ...size,
            }
        );
    } catch (e) {
        return new ImageResponse(
            (
                <div style={{ background: '#f3f4f6', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '48px', color: '#374151' }}>LUMO 揪團</h1>
                </div>
            ),
            { ...size }
        );
    }
}
