'use client';

import { AuthProvider } from '@/hooks/useAuth';

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    );
}
