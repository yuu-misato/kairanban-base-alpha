"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import liff from '@line/liff';

interface LiffProfile {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
}

interface LiffContextType {
    liffObject: typeof liff | null;
    profile: LiffProfile | null;
    isLoggedIn: boolean;
    error: string | null;
    login: () => void;
    logout: () => void;
}

const LiffContext = createContext<LiffContextType>({
    liffObject: null,
    profile: null,
    isLoggedIn: false,
    error: null,
    login: () => { },
    logout: () => { },
});

export const useLiff = () => useContext(LiffContext);

export const LiffProvider = ({ children }: { children: React.ReactNode }) => {
    const [liffObject, setLiffObject] = useState<typeof liff | null>(null);
    const [profile, setProfile] = useState<LiffProfile | null>(null);
    const [error, setError] = useState<string | null>(null);

    const initLiff = async () => {
        try {
            const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
            if (!liffId) {
                throw new Error('LIFF ID is not defined in environment variables');
            }

            await liff.init({ liffId });
            setLiffObject(liff);

            if (liff.isLoggedIn()) {
                const profile = await liff.getProfile();
                setProfile(profile);
            }
        } catch (err: any) {
            console.error('LIFF Initialization failed', err);
            setError(err.message);
        }
    };

    useEffect(() => {
        // Only init LIFF in browser
        if (typeof window !== 'undefined') {
            initLiff();
        }
    }, []);

    const login = () => {
        if (liffObject && !liffObject.isLoggedIn()) {
            liffObject.login();
        }
    };

    const logout = () => {
        if (liffObject && liffObject.isLoggedIn()) {
            liffObject.logout();
            setProfile(null);
            window.location.reload();
        }
    };

    return (
        <LiffContext.Provider
            value={{
                liffObject,
                profile,
                isLoggedIn: !!profile,
                error,
                login,
                logout,
            }}
        >
            {children}
        </LiffContext.Provider>
    );
};
