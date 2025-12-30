/**
 * Production-safe logger utility
 * Logs are only output in development mode
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
    log: (...args: unknown[]) => {
        if (isDev) {
            console.log(...args);
        }
    },
    warn: (...args: unknown[]) => {
        if (isDev) {
            console.warn(...args);
        }
    },
    error: (...args: unknown[]) => {
        // Always log errors, but could be sent to error tracking service in production
        console.error(...args);
    },
    debug: (...args: unknown[]) => {
        if (isDev) {
            console.debug(...args);
        }
    },
};
