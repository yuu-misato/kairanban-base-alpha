
import { supabase } from '../services/supabaseService';

export const getActionPointSettings = async () => {
    const { data, error } = await supabase
        .from('action_point_settings')
        .select('*')
        .order('display_order', { ascending: true });
    return { data, error };
};

export const updateActionPointSetting = async (id: string, updates: any) => {
    const { data, error } = await supabase
        .from('action_point_settings')
        .update(updates)
        .eq('id', id)
        .select();
    return { data, error };
};

export const grantActionPoints = async (userId: string, actionKey: string) => {
    // 1. Get setting
    const { data: setting } = await supabase
        .from('action_point_settings')
        .select('*')
        .eq('action_key', actionKey)
        .single();

    if (!setting || !setting.is_active || setting.points_amount <= 0) return { granted: false };

    // 2. Check one-time limit if applicable (e.g., specific logic needed, or we rely on 'action_point_history')
    // For now, let's assume 'read_kairanban' is repeatable per kairanban, so this function might need context.
    // If simple action like "profile_setup", we check history.

    // Simplified logic: Just grant points to user profile
    // Note: In a real app, use RPC to update score safely
    // We already have addScore logic in frontend, but secure backend approach is better.

    // Using existing RPC or direct update if insecure is okay for prototype
    const { error } = await supabase.rpc('increment_score', {
        user_id: userId,
        amount: setting.points_amount
    });

    if (!error) {
        // Log history
        await supabase.from('action_point_history').insert({
            user_id: userId,
            action_key: actionKey,
            points_granted: setting.points_amount
        });
        return { granted: true, amount: setting.points_amount };
    }
    return { granted: false, error };
};
