import { supabase } from './supabaseService';

export interface SafetyReport {
    id: string;
    user_id: string;
    household_member_id?: string;
    status: 'safe' | 'injured' | 'unknown' | 'help_needed';
    message?: string;
    reported_at: string;
}

export const sendSafetyReport = async (userId: string, reports: { memberId: string | 'SELF', status: string, message?: string }[]) => {
    const records = reports.map(r => ({
        user_id: userId,
        household_member_id: r.memberId === 'SELF' ? null : r.memberId,
        status: r.status,
        message: r.message,
        reported_at: new Date().toISOString()
        // coordinates omitted for simple implementation
    }));

    const { data, error } = await supabase
        .from('safety_reports')
        .insert(records)
        .select();

    return { data, error };
};
