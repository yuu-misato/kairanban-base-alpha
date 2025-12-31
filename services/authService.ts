import { supabase } from '@/integrations/supabase/client';

/**
 * 住民・事業者のプロファイル管理
 */
export const createProfile = async (user: any) => {
    if (!user.id) {
        console.error('CRITICAL: Attempted to create profile without User ID');
        return { data: null, error: { message: 'User ID is missing' } };
    }

    const payload = {
        id: user.id,
        nickname: user.nickname || '名無し',
        avatar_url: user.avatar || user.avatar_url || '',
        role: user.role || 'resident',
        level: user.level || 1,
        score: user.score || 100,
        selected_areas: user.selectedAreas || user.selected_areas || [],
        updated_at: new Date().toISOString()
    };

    console.log('Upserting Profile Payload:', payload);

    try {
        // 5秒タイムアウトを設定
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timed out. Check Supabase settings.')), 5000)
        );

        const dbPromise = supabase
            .from('profiles')
            .upsert(payload, { onConflict: 'id' })
            .select();

        const result: any = await Promise.race([dbPromise, timeoutPromise]);
        const { data, error } = result;

        if (error) {
            console.error('FAILED TO SAVE PROFILE TO DB (RLS or Constraint Error):', error);
        } else {
            console.log('Profile saved successfully:', data);
        }
        return { data, error };

    } catch (err: any) {
        console.error('CRITICAL: Profile save failed or timed out:', err);
        // UIにエラーを返すためにダミーのエラーオブジェクトを返す
        return { data: null, error: { message: err.message || 'Connection Timed Out' } };
    }
};

export const getProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles' as any)
        .select('*')
        .eq('id', userId)
        .single();
    return { data, error };
};
