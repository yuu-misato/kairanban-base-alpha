import { supabase } from '@/integrations/supabase/client';

/**
 * 住民・事業者のプロファイル管理
 */
export const createProfile = async (user: any) => {
    if (!user.id) {
        console.error('重大なエラー: ユーザーIDなしでプロファイル作成を試みました');
        return { data: null, error: { message: 'ユーザーIDが見つかりません' } };
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

    console.log('プロファイル更新ペイロード:', payload);

    try {
        // 5秒タイムアウトを設定
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('接続がタイムアウトしました。Supabase設定を確認してください。')), 5000)
        );

        const dbPromise = supabase
            .from('profiles')
            .upsert(payload, { onConflict: 'id' })
            .select();

        const result: any = await Promise.race([dbPromise, timeoutPromise]);
        const { data, error } = result;

        if (error) {
            console.error('プロファイルのDB保存に失敗しました (RLSまたは制約エラー):', error);
        } else {
            console.log('プロファイルが正常に保存されました:', data);
        }
        return { data, error };

    } catch (err: any) {
        console.error('重大なエラー: プロファイル保存失敗またはタイムアウト:', err);
        // UIにエラーを返すためにダミーのエラーオブジェクトを返す
        return { data: null, error: { message: err.message || '接続タイムアウト' } };
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
