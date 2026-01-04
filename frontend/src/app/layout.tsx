import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/hooks/useAuth';
import '@/styles/globals.css';

export const metadata: Metadata = {
    title: 'Lumo NCNU - 暨南校園運動配對平台',
    description: '找到志同道合的運動夥伴，一起揪團運動！籃球、跑步、羽球、桌球、健身，暨南大學專屬運動配對平台。',
    keywords: ['運動', '揪團', '配對', '暨南大學', 'NCNU', '籃球', '羽球', '跑步', '健身'],
    authors: [{ name: 'Lumo Team' }],
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Lumo NCNU',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    themeColor: '#22c55e',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh-TW">
            <head>
                <link rel="icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" href="/icons/icon-192.png" />
            </head>
            <body className="bg-gradient-main min-h-screen">
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
