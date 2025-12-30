import { useEffect, useMemo, useState } from "react";
import {
    getLiffAccessToken,
    getLiffProfile,
    initLiff,
    isInLineApp,
    isLiffLoggedIn,
    liffLogin,
} from "../lib/liff";
import { supabase } from "../services/supabaseService";

// Use the LIFF ID from user
const LIFF_ID = "2008784970-Izb0ykCR";
// Only update this if the deployment URL changes significantly, but typically handled by LIFF console
const LIFF_BASE_URL = `https://liff.line.me/${LIFF_ID}`;

interface LiffAutoAuthResult {
    isLiffInitialized: boolean;
    isInLiff: boolean;
    isLiffLoggedIn: boolean;
    isRestoring: boolean;
    isLiffProcessing: boolean;
    error: string | null;
}

// Public pages that don't require LIFF login (adjusted for this project)
const PUBLIC_PATHS = ["/", "/index.html"];

const getLiffState = (): string | null => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("liff.state");
    if (!raw) return null;
    try {
        return decodeURIComponent(raw);
    } catch {
        return raw;
    }
};

const getEffectivePathnameForAccessControl = (): string => {
    if (typeof window === 'undefined') return '';
    const state = getLiffState();
    if (state && state.startsWith("/")) {
        return state.split("?")[0];
    }
    return window.location.pathname;
};

const getEffectiveTargetForRedirect = (): string => {
    if (typeof window === 'undefined') return '';
    const state = getLiffState();
    if (state && state.startsWith("/")) return state;
    return `${window.location.pathname}${window.location.search}`;
};

const isPublicPath = (path: string) => {
    return PUBLIC_PATHS.includes(path) || path.startsWith("/public-");
};

export const useLiffAutoAuth = (
    hasSupabaseSession: boolean,
    onSessionRestored: () => void
): LiffAutoAuthResult => {
    const [isLiffInitialized, setIsLiffInitialized] = useState(false);
    const [isInLiff, setIsInLiff] = useState(false);
    const [isLiffUserLoggedIn, setIsLiffUserLoggedIn] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasAttemptedRestore, setHasAttemptedRestore] = useState(false);
    const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false);

    // useMemo for initial state - check window inside
    const initialProcessing = useMemo(() => {
        if (typeof window === 'undefined') return false;

        const effectivePath = getEffectivePathnameForAccessControl();
        const looksLikeLiff = !!getLiffState();
        return looksLikeLiff && !isPublicPath(effectivePath);
    }, []);

    const [isLiffProcessing, setIsLiffProcessing] = useState<boolean>(initialProcessing);

    // Initialize LIFF on mount
    useEffect(() => {
        const initialize = async () => {
            if (typeof window === 'undefined') return;

            if (!LIFF_ID) {
                setIsLiffProcessing(false);
                return;
            }

            try {
                const success = await initLiff(LIFF_ID);
                if (!success) {
                    setIsLiffProcessing(false);
                    return;
                }

                setIsLiffInitialized(true);
                const inLine = isInLineApp();
                const loggedIn = isLiffLoggedIn();
                setIsInLiff(inLine);
                setIsLiffUserLoggedIn(loggedIn);

                // If not in LINE app, stop processing
                if (!inLine) {
                    setIsLiffProcessing(false);
                    return;
                }

                const effectivePath = getEffectivePathnameForAccessControl();
                if (isPublicPath(effectivePath)) {
                    setIsLiffProcessing(false);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "LIFF init failed");
                setIsLiffProcessing(false);
            }
        };

        if (typeof window !== 'undefined') {
            initialize();
        }
    }, []);

    // Auto-login or restore session when LIFF is ready
    useEffect(() => {
        const handleAuth = async () => {
            if (typeof window === 'undefined') return;

            const effectivePath = getEffectivePathnameForAccessControl();

            // Skip for public pages
            if (isPublicPath(effectivePath)) {
                setIsLiffProcessing(false);
                return;
            }

            // Skip if auto-login is explicitly disabled (e.g. after logout)
            if (localStorage.getItem('disable_auto_login')) {
                setIsLiffProcessing(false);
                return;
            }

            // Already signed in
            if (hasSupabaseSession) {
                setIsLiffProcessing(false);
                return;
            }

            // Wait for LIFF init
            if (!isLiffInitialized) return;

            // Not in LINE client
            if (!isInLiff) {
                setIsLiffProcessing(false);
                return;
            }

            // If LIFF is not logged in, trigger LIFF login (only once)
            if (!isLiffUserLoggedIn && !hasAttemptedLogin) {
                setHasAttemptedLogin(true);

                const target = getEffectiveTargetForRedirect();
                const redirectUri = `${LIFF_BASE_URL}${target}`;
                liffLogin(redirectUri);
                return;
            }

            // If LIFF is logged in but no Supabase session, restore session
            if (isLiffUserLoggedIn && !hasAttemptedRestore) {
                setIsRestoring(true);
                setHasAttemptedRestore(true);

                try {
                    const accessToken = getLiffAccessToken();
                    const profile = await getLiffProfile();

                    if (!accessToken || !profile) {
                        setIsLiffProcessing(false);
                        return;
                    }

                    const { data, error: fnError } = await supabase.functions.invoke("line-login", {
                        body: {
                            action: "liff_login",
                            liff_access_token: accessToken,
                            line_user_id: profile.userId,
                            display_name: profile.displayName,
                            picture_url: profile.pictureUrl,
                        },
                    });

                    if (fnError) {
                        setError(fnError.message);
                        setIsLiffProcessing(false);
                        return;
                    }

                    // New user - store profile for registration
                    if (data?.status === "new_user") {
                        localStorage.setItem(
                            "line_profile",
                            JSON.stringify({
                                line_user_id: profile.userId,
                                display_name: profile.displayName,
                                picture_url: profile.pictureUrl,
                            })
                        );
                        setIsLiffProcessing(false);
                        // Redirect to root, App will handle registration modal
                        if (window.location.pathname !== '/') {
                            window.location.href = "/";
                        }
                        return;
                    }

                    // Existing user - verify OTP to create session
                    if (data?.token_hash) {
                        const { error: otpError } = await supabase.auth.verifyOtp({
                            token_hash: data.token_hash,
                            type: "magiclink",
                        });

                        if (otpError) {
                            setError(otpError.message);
                        } else {
                            localStorage.setItem("linked_line_user_id", profile.userId);
                            onSessionRestored();
                        }
                    }
                } catch (err) {
                    setError(err instanceof Error ? err.message : "Auto-restore failed");
                } finally {
                    setIsRestoring(false);
                    setIsLiffProcessing(false);
                }
            }
        };

        handleAuth();
    }, [
        hasSupabaseSession,
        hasAttemptedLogin,
        hasAttemptedRestore,
        isInLiff,
        isLiffInitialized,
        isLiffUserLoggedIn,
        onSessionRestored,
    ]);

    return {
        isLiffInitialized,
        isInLiff,
        isLiffLoggedIn: isLiffUserLoggedIn,
        isRestoring,
        isLiffProcessing,
        error,
    };
};
