import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase, getProfile } from '../services/supabaseService';
import { User } from '../types';
import { useLiffAutoAuth } from './useLiffAutoAuth';
// Duplicate import removed
import { logger } from '../lib/logger';
// Duplicate import removed

interface AuthContextType {
    user: User | null;
    setUser: (user: User) => void;
    isLoading: boolean;
    isAuthChecking: boolean;
    isLiffRestoring: boolean;
    logout: () => Promise<void>;
    tempUser: User | null;
    setTempUser: (user: User | null) => void;
    revalidateProfile: () => Promise<void>;
    checkSession: (manualSession?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Safe localStorage helper
const getStoredUser = (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem('saitama_user_profile');
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        console.error('Failed to parse stored user', e);
        return null;
    }
};

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    // Initialize state
    const [user, setUser] = useState<User | null>(null);

    const [session, setSession] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [tempUser, setTempUser] = useState<User | null>(null);

    // Helper to load profile
    const loadProfile = useCallback(async (userId: string) => {
        try {
            const profilePromise = getProfile(userId);
            const { data } = await profilePromise;

            // Cast data to any for now to bypass strict union type checks from Supabase generated types
            // in a real scenario, we should use the Database['public']['Tables']['profiles']['Row'] type
            const profile = data as any;

            if (profile) {
                const u: User = {
                    id: userId,
                    nickname: profile.nickname || '名無し',
                    role: profile.role || 'resident',
                    avatar: profile.avatar_url || '',
                    score: profile.score || 0,
                    level: profile.level || 1,
                    selectedAreas: profile.selected_areas || [],
                    isLineConnected: true,
                    shopName: profile.shop_name || undefined
                };
                setUser(u);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('saitama_user_profile', JSON.stringify(u));
                }
            } else {
                logger.warn('Profile not found in DB');
            }
        } catch (e) {
            logger.error('Load profile failed', e);
        }
    }, []);

    const checkSession = useCallback(async (manualSession?: any) => {
        try {
            const checkLogic = async () => {
                let s = manualSession;

                if (!s) {
                    const { data } = await supabase.auth.getSession();
                    s = data?.session;
                }

                setSession(s);
                if (s) {
                    await loadProfile(s.user.id);
                }
            };

            await Promise.race([
                checkLogic(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Session check timeout')), 10000))
            ]);

        } catch (e) {
            console.warn('Session check warning (using local fallback if available):', e);
        } finally {
            setIsAuthChecking(false);
            setIsLoading(false);
        }
    }, [loadProfile]);

    const handleSessionRestored = useCallback(() => {
        logger.log('Session restored callback');
        checkSession();
    }, [checkSession]);

    const { isRestoring: isLiffRestoring, isLiffProcessing } = useLiffAutoAuth(
        !!session,
        handleSessionRestored
    );

    // Duplicate useLiffAutoAuth block removed

    useEffect(() => {
        // Hydrate from local storage on mount
        const stored = getStoredUser();
        if (stored) {
            setUser(stored);
            setIsLoading(false);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
            logger.log('Auth State Change:', event);
            setSession(session);

            if (session) {
                await loadProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('saitama_user_profile');
                }
            }

            setIsAuthChecking(false);
            setIsLoading(false);
        });

        checkSession();

        return () => subscription.unsubscribe();
    }, [checkSession, loadProfile]);

    const logout = async () => {
        try {
            console.log('Logging out...');
            await supabase.auth.signOut();
        } catch (e) {
            console.error('Supabase signOut failed (ignoring):', e);
        } finally {
            // NUCLEAR OPTION: Completely wipe everything
            if (typeof window !== 'undefined') {
                // Clear all storage mechanisms
                localStorage.clear();
                sessionStorage.clear();

                // Clear state immediately to give UI feedback (though reload will happen)
                setUser(null);
                setSession(null);

                // Force a hard reload to clear memory and restart app from scratch
                // This prevents any 'ghost' state from lingering in React context or closures
                window.location.href = '/';
                // Add tiny delay to ensure redirection happens before any auto-re-login logic runs
                setTimeout(() => window.location.reload(), 100);
            }
        }
    };

    const revalidateProfile = async () => {
        if (user) await loadProfile(user.id);
    };

    const effectiveIsAuthChecking = isAuthChecking || isLiffProcessing || (isLiffRestoring && !session);

    return (
        <AuthContext.Provider value={{
            user,
            setUser: (u) => {
                setUser(u);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('saitama_user_profile', JSON.stringify(u));
                }
            },
            isLoading,
            isAuthChecking: effectiveIsAuthChecking,
            isLiffRestoring,
            logout,
            tempUser,
            setTempUser,
            revalidateProfile,
            checkSession
        }}>
            {children}
        </AuthContext.Provider>
    );
};
