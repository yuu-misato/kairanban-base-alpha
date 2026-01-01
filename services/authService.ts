import { supabase } from '@/integrations/supabase/client';

/**
 * 住民・事業者のプロファイル管理
 */
export const createProfile = async (user: any) => {
    if (!user.id) {
        console.error('重大なエラー: ユーザーIDなしでプロファイル作成を試みました');
        return { data: null, error: { message: 'ユーザーIDが見つかりません' } };
    }

    // プロファイルの作成または更新（権限昇格を防ぐため、sensitiveなフィールドは除外）
    // セキュリティ対策: クライアントからの role/score/level 操作を無効化
    // これらはサーバーサイドまたは管理者機能でのみ変更可能とする
    const payload = {
        id: user.id,
        nickname: user.nickname || '名無し',
        avatar_url: user.avatar || user.avatar_url || '',
        // role: user.role, // 削除: ユーザー入力を信頼しない
        // score: user.score, // 削除
        // level: user.level, // 削除
        selected_areas: user.selectedAreas || user.selected_areas || [],
        shop_name: user.shopName || null, // 新しいフィールド
        is_line_connected: user.isLineConnected || false, // 新しいフィールド
        updated_at: new Date().toISOString(),
    };

    console.log('プロファイル更新ペイロード:', payload);

    try {
        // profilesテーブルは型定義(Types.ts)に存在しない可能性があるため、anyキャストで回避
        // 将来的には正しい型定義を反映させる必要があります
        const { data, error } = await supabase
            .from('profiles' as any)
            .upsert(payload, { onConflict: 'id' })
            .select()
            .single();

        if (error) {
            console.error('プロファイルのDB保存に失敗しました (RLSまたは制約エラー):', JSON.stringify(error, null, 2));
        } else {
            console.log('プロファイルが正常に保存されました:', data);
        }
        return { data, error };

    } catch (err: any) {
        console.error('重大なエラー: プロファイル保存失敗またはタイムアウト:', err, JSON.stringify(err, null, 2));
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
