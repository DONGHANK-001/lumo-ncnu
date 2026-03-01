import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/hooks/useAuth';
import '@/styles/globals.css';
import ThemeRegistry from '@/theme/ThemeRegistry';
import ErrorBoundary from './components/ErrorBoundary';
import InAppBrowserOverlay from './components/InAppBrowserOverlay';

export const metadata: Metadata = {
    title: 'LUMO - 暨大揪團平台',
    description: '國立暨南國際大學專屬運動揪團平台',
    manifest: '/manifest.json',
};

export const viewport: Viewport = {
    themeColor: '#141218',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};



export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="zh-TW">
            <body>
                <ThemeRegistry>
                    <ErrorBoundary>
                        <AuthProvider>
                            <InAppBrowserOverlay />
                            {children}
                        </AuthProvider>
                    </ErrorBoundary>
                </ThemeRegistry>
            </body>
        </html>
    );
}
