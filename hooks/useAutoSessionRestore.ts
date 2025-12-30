import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { logger } from '../lib/logger';

interface AutoSessionRestoreResult {
    isRestoring: boolean;
    error: string | null;
}

export const useAutoSessionRestore = (hasSession: boolean): AutoSessionRestoreResult => {
    const [isRestoring, setIsRestoring] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const restoreSession = async () => {
            // Skip if auto-login is explicitly disabled
            if (localStorage.getItem('disable_auto_login')) {
                return;
            }

            // Skip if already has session
            if (hasSession) {
                logger.log('Auto restore: Session exists, skipping');
                return;
            }

            // Check for saved LINE User ID
            const savedLineUserId = localStorage.getItem('linked_line_user_id');
            if (!savedLineUserId) {
                logger.log('Auto restore: No saved LINE User ID');
                return;
            }

            logger.log('Auto restore: Attempting to restore session for LINE user');
            setIsRestoring(true);
            setError(null);

            try {
                // Add Timeout for auto-restore
                const restorePromise = supabase.functions.invoke('line-login', {
                    body: {
                        action: 'auto_restore',
                        line_user_id: savedLineUserId,
                    },
                });

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Auto-restore timed out')), 5000)
                );

                const { data, error: funcError } = await Promise.race([restorePromise, timeoutPromise]) as any;

                if (funcError) {
                    throw new Error(funcError.message);
                }

                if (data?.error === 'restore_failed') {
                    // Clear invalid saved data
                    logger.log('Auto restore: Restore failed, clearing saved data');
                    localStorage.removeItem('linked_line_user_id');
                    setIsRestoring(false);
                    return;
                }

                if (data?.token_hash && data?.email) {
                    logger.log('Auto restore: Verifying OTP for session creation');
                    const { error: verifyError } = await supabase.auth.verifyOtp({
                        token_hash: data.token_hash,
                        type: 'magiclink',
                    });

                    if (verifyError) {
                        logger.error('Auto restore: OTP verification failed:', verifyError);
                        // Don't clear saved data on temporary failures
                        setError('セッションの復元に失敗しました');
                    } else {
                        logger.log('Auto restore: Session restored successfully');
                    }
                }
            } catch (err) {
                logger.error('Auto restore error:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
                // Force clear to prevent loop if error persists
                if (err instanceof Error && (err.message.includes('timeout') || err.message.includes('Function'))) {
                    localStorage.removeItem('linked_line_user_id');
                }
            } finally {
                setIsRestoring(false);
            }
        };

        // Small delay to ensure initial session check completes first
        const timer = setTimeout(restoreSession, 100);
        return () => clearTimeout(timer);
    }, [hasSession]);

    return { isRestoring, error };
};
