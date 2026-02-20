import { Metadata } from 'next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const SPORT_NAMES: Record<string, string> = {
    BASKETBALL: '籃球',
    RUNNING: '跑步',
    BADMINTON: '羽球',
    TABLE_TENNIS: '桌球',
    GYM: '健身',
};

// 這是 Next.js 14 的產生動態 metadata 方法
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    try {
        const res = await fetch(`${API_BASE_URL}/groups/${params.id}`, { cache: 'no-store' });
        if (!res.ok) {
            return { title: '揪團詳情 | Lumo NCNU', description: '無法載入揪團資訊' };
        }
        const json = await res.json();
        const group = json.data;
        if (!group) {
            return { title: '找不到揪團 | Lumo NCNU' };
        }

        const sportName = SPORT_NAMES[group.sportType] || group.sportType;
        const timeStr = new Date(group.time).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const title = `LUMO - ${group.title}`;
        const description = `🏀 ${sportName} | ${group.currentCount}/${group.capacity}人 | ${timeStr} @ ${group.location}`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: 'website',
                // images 屬性可以留空，Next.js 會自動尋找同目錄下的 opengraph-image.tsx
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
            }
        };
    } catch (e) {
        return {
            title: '揪團詳情 | Lumo NCNU',
        };
    }
}

export default function GroupDetailLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
