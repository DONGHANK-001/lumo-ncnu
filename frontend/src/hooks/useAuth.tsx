'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, googleProvider, firebase } from '@/lib/firebase';
import { api } from '@/lib/api-client';

// 使用 compat 類型
type FirebaseUser = firebase.User;

interface User {
    id: string;
    email: string;
    nickname: string | null;
    planType: 'FREE' | 'PLUS';
    firebaseUser: FirebaseUser;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    getToken: () => Promise<string | null>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 取得 ID Token
    const getToken = async (): Promise<string | null> => {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return null;
        return firebaseUser.getIdToken();
    };

    // 從後端取得使用者資料
    const fetchUserData = async (firebaseUser: FirebaseUser) => {
        try {
            const token = await firebaseUser.getIdToken();
            const response = await api.getMe(token);

            if (response.success && response.data) {
                setUser({
                    id: response.data.id,
                    email: response.data.email,
                    nickname: response.data.nickname,
                    planType: response.data.planType as 'FREE' | 'PLUS',
                    firebaseUser,
                });
                setError(null);
            } else {
                setError(response.error?.message || '無法取得使用者資料');
                // 如果是 domain 錯誤，登出並顯示明確提示
                if (response.error?.code === 'DOMAIN_NOT_ALLOWED') {
                    await auth.signOut();
                    setError('⚠️ 登入失敗：請改用暨南大學學校信箱 (@mail1.ncnu.edu.tw) 登入');
                    return; // 重要的是 return，不要讓後面的邏輯覆蓋
                }
            }
        } catch (err) {
            console.error('Fetch user data error:', err);
            setError('網路連線失敗');
        }
    };

    // 監聽 Firebase auth 狀態
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                await fetchUserData(firebaseUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Google 登入
    const signIn = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await auth.signInWithPopup(googleProvider);
            if (result.user) {
                await fetchUserData(result.user);
            }
        } catch (err: unknown) {
            console.error('Sign in error:', err);
            const errorMessage = err instanceof Error ? err.message : '登入失敗';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // 登出
    const signOut = async () => {
        try {
            await auth.signOut();
            setUser(null);
            setError(null);
        } catch (err) {
            console.error('Sign out error:', err);
        }
    };

    // 重新整理使用者資料
    const refreshUser = async () => {
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
            await fetchUserData(firebaseUser);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, signIn, signOut, getToken, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
