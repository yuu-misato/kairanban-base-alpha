import { logger } from './logger';

declare global {
    interface Window {
        liff: any;
    }
}

let liffInitialized = false;

export const initLiff = async (liffId: string): Promise<boolean> => {
    if (liffInitialized) return true;

    // Load LIFF SDK if not already loaded
    if (!window.liff) {
        await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load LIFF SDK'));
            document.head.appendChild(script);
        });
    }

    try {
        await window.liff.init({ liffId });
        liffInitialized = true;
        logger.log('LIFF initialized successfully');
        return true;
    } catch (error) {
        logger.error('LIFF initialization failed:', error);
        return false;
    }
};

export const isInLineApp = (): boolean => {
    if (!window.liff || !liffInitialized) return false;
    return window.liff.isInClient();
};

export const isLiffLoggedIn = (): boolean => {
    if (!window.liff || !liffInitialized) return false;
    return window.liff.isLoggedIn();
};

export const liffLogin = (redirectUri?: string): void => {
    if (!window.liff || !liffInitialized) return;

    if (redirectUri) {
        window.liff.login({ redirectUri });
    } else {
        window.liff.login();
    }
};

export const liffLogout = (): void => {
    if (!window.liff || !liffInitialized) return;
    window.liff.logout();
};

export const getLiffAccessToken = (): string | null => {
    if (!window.liff || !liffInitialized) return null;
    return window.liff.getAccessToken();
};

export const getLiffProfile = async (): Promise<{
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
} | null> => {
    if (!window.liff || !liffInitialized) return null;
    try {
        return await window.liff.getProfile();
    } catch (error) {
        logger.error('Failed to get LIFF profile:', error);
        return null;
    }
};

export const closeLiffWindow = (): void => {
    if (!window.liff || !liffInitialized) return;
    window.liff.closeWindow();
};

export const openInExternalBrowser = (url: string): void => {
    if (!window.liff || !liffInitialized) {
        window.open(url, '_blank');
        return;
    }

    window.liff.openWindow({
        url,
        external: true
    });
};
