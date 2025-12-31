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

export const giveUserPoints = async (userId: string, points: number) => {
    const { data: current } = await supabase
        .from('profiles' as any)
        .select('score')
        .eq('id', userId)
        .single();

    if (current) {
        const { data, error } = await supabase
            .from('profiles' as any)
            .update({ score: ((current as any).score || 0) + points })
            .eq('id', userId)
            .select();
        return { data, error };
    }
    return { data: null, error: 'User not found' };
};
