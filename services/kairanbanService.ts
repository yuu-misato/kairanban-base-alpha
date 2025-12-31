import { supabase } from '@/integrations/supabase/client';

export const getKairanbans = async () => {
    const { data, error } = await supabase
        .from('kairanbans' as any)
        .select('*')
        .order('created_at', { ascending: false });
    return { data, error };
};

export const createKairanbanWithNotification = async (kairan: any) => {
    // 1. 回覧板データを挿入
    const { data, error } = await supabase
        .from('kairanbans' as any)
        .insert([{
            title: kairan.title,
            content: kairan.content,
            area: kairan.area,
            author: kairan.author,
            sent_to_line: kairan.sent_to_line,
            community_id: kairan.communityId || null
        }])
        .select();

    if (!error && kairan.sent_to_line) {
        console.log("LINE一斉送信 Edge Functionを起動中...");
        const { data: funcData, error: funcError } = await supabase.functions.invoke('line-broadcast', {
            body: {
                title: kairan.title,
                content: kairan.content,
                area: kairan.area,
                communityId: kairan.communityId,
                communityName: kairan.communityName
            }
        });

        if (funcError) {
            console.error("LINE通知の送信に失敗しました:", funcError);
        } else {
            console.log("LINE通知が正常に送信されました:", funcData);
        }
    }

    return { data, error };
};

export const getUserReadKairanbanIds = async (userId: string) => {
    const { data, error } = await supabase
        .from('kairanban_reads' as any)
        .select('kairanban_id')
        .eq('user_id', userId);

    if (data) {
        return { data: data.map((item: any) => item.kairanban_id), error: null };
    }
    return { data: [], error };
};

export const markKairanbanAsRead = async (userId: string, kairanbanId: string) => {
    const { error } = await supabase
        .from('kairanban_reads' as any)
        .insert({ user_id: userId, kairanban_id: kairanbanId });

    return { error };
};

// KairanbanCard.tsx から呼び出される、世帯メンバー対応版の既読処理
export const markKairanbanRead = async (kairanbanId: string, userId: string, memberIds: string[]) => {
    // メンバー指定がない場合は、ユーザー自身の既読（既存関数を利用）
    if (!memberIds || memberIds.length === 0) {
        return markKairanbanAsRead(userId, kairanbanId);
    }

    // メンバー指定がある場合は、それぞれのメンバーについて既読をつける
    // household_member_id を設定する
    const inserts = memberIds.map(mid => ({
        kairanban_id: kairanbanId,
        user_id: userId, // 操作者として記録（またはNULLでもよいが、誰が操作したか残すならこれ）
        household_member_id: mid,
        read_at: new Date().toISOString()
    }));

    const { error } = await supabase
        .from('kairanban_reads' as any)
        .insert(inserts);

    return { error };
};

export const analyzeKairanban = async (fileBase64: string, mimeType: string) => {
    // console.log("Calling AI analysis...", mimeType);
    const { data, error } = await supabase.functions.invoke('analyze-kairanban', {
        body: { file: fileBase64, mimeType }
    });

    if (error) {
        console.error("AI Analysis Error (Service):", error);
    }
    return { data, error };
};
