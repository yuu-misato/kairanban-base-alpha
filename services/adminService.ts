import { supabase } from '@/integrations/supabase/client';

export const getAllUsers = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
    return { data, error };
};

export const updateUserRole = async (userId: string, role: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select();
    return { data, error };
};

export const getAllCommunities = async () => {
    const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false });
    return { data, error };
};

export const deleteCommunity = async (communityId: string) => {
    const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', communityId);
    return { error };
};

export const updateCommunity = async (communityId: string, updates: any) => {
    const { data, error } = await supabase
        .from('communities')
        .update({
            name: updates.name,
            description: updates.description,
            image_url: updates.imageUrl,
            is_secret: updates.isSecret
        })
        .eq('id', communityId)
        .select();
    return { data, error };
};

export const getAllUsersWithPlans = async () => {
    const { data: users, error } = await supabase
        .from('profiles')
        .select('*, user_plans(plan_type, expires_at)')
        .order('created_at', { ascending: false });

    if (error) return { data: [], error };

    // Fetch usage for current month
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const userIds = users.map((u: any) => u.id);

    const { data: usages } = await supabase
        .from('user_monthly_usages')
        .select('user_id, message_count')
        .eq('year_month', yearMonth)
        .in('user_id', userIds);

    const usageMap = new Map();
    usages?.forEach((u: any) => usageMap.set(u.user_id, u.message_count));

    // Merge
    const combined = users.map((u: any) => {
        const plan = u.user_plans?.[0] || u.user_plans;
        return {
            ...u,
            plan_type: Array.isArray(plan) ? plan[0]?.plan_type : (plan?.plan_type || 'normal'),
            current_usage: usageMap.get(u.id) || 0
        };
    });

    return { data: combined, error: null };
};

export const updateUserPlan = async (userId: string, newPlan: string) => {
    // Check if mapping exists
    const { data: existing } = await supabase
        .from('user_plans')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

    if (existing) {
        const { data, error } = await supabase
            .from('user_plans')
            .update({ plan_type: newPlan, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .select();
        return { data, error };
    } else {
        const { data, error } = await supabase
            .from('user_plans')
            .insert({ user_id: userId, plan_type: newPlan })
            .select();
        return { data, error };
    }
};

export const sendLineBroadcast = async (message: string, targetRole: string = 'all') => {
    const { data, error } = await supabase.functions.invoke('line-broadcast', {
        body: {
            content: message,
            targetRole: targetRole,
            broadcast: true
        }
    });
    return { data, error };
};

export const getAdminData = async (type: 'users' | 'missions' | 'communities' | 'points') => {
    const { data, error } = await supabase.functions.invoke(`admin-data?type=${type}`, {
        method: 'GET'
    });
    return { data, error };
};
