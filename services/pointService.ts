import { supabase } from '@/integrations/supabase/client';

export const getCoupons = async () => {
    const { data, error } = await supabase
        .from('coupons' as any)
        .select('*');
    return { data, error };
};

export const registerLocalCoupon = async (coupon: any) => {
    const { data, error } = await supabase
        .from('coupons' as any)
        .insert([{
            shop_name: coupon.shopName,
            title: coupon.title,
            description: coupon.description,
            discount_rate: coupon.discountRate,
            area: coupon.area,
            image_url: coupon.imageUrl
        }])
        .select();
    return { data, error };
};

// ユーザーにポイントを付与する (Secure RPC)
export const giveUserPoints = async (userId: string, points: number) => {
    // クライアントサイドでの直接DB更新は脆弱性があるため廃止
    // RPC (Remote Procedure Call) を使用してサーバーサイドで安全に計算・更新する
    // 必要なRPC: increment_points(user_id uuid, amount integer)

    const { data, error } = await supabase.rpc('increment_points' as any, {
        user_id: userId,
        amount: points
    });

    if (error) {
        console.error("ポイント付与エラー (RPC):", error);
        return { data: null, error };
    }

    // RPCの戻り値をチェック (JSONで返却される想定)
    const result = data as any;
    if (result && result.success === false) {
        console.error("ポイント付与失敗 (Logic):", result.error);
        return { data: null, error: result.error };
    }

    return { data, error: null };
};

export const getActionPointSettings = async () => {
    const { data, error } = await supabase
        .from('action_point_settings')
        .select('*')
        .order('display_order', { ascending: true });

    // Ensure 'read_kairanban' setting exists (Auto-seed for existing environments)
    if (!error && data) {
        const hasKairanban = data.some((s: any) => s.action_key === 'read_kairanban');
        if (!hasKairanban) {
            console.log("Seeding missing read_kairanban setting...");
            const { error: seedError } = await supabase
                .from('action_point_settings')
                .insert({
                    action_key: 'read_kairanban',
                    action_name: '回覧板確認',
                    description: 'デジタル回覧板を確認した際に付与されるポイント',
                    points_amount: 5,
                    is_active: true,
                    display_order: 20
                });

            if (!seedError) {
                // Re-fetch
                const { data: newData, error: newError } = await supabase
                    .from('action_point_settings')
                    .select('*')
                    .order('display_order', { ascending: true });
                return { data: newData, error: newError };
            }
        }
    }

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
