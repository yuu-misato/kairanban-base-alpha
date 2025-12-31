import { supabase } from '@/integrations/supabase/client';

export const sendSafetyReport = async (
    reporterId: string,
    reports: { memberId: string, status: string }[]
) => {
    // 安否報告用のテーブルが未実装のため、ログ出力のみ行う
    console.log("【安否報告】", reporterId, reports);

    // 将来的に safety_reports テーブルへ保存する実装にする
    /*
    const { error } = await supabase
        .from('safety_reports')
        .insert(reports.map(r => ({
            reporter_id: reporterId,
            member_id: r.memberId,
            status: r.status,
            reported_at: new Date().toISOString()
        })));
    return { error };
    */

    // 成功したていで返す
    return { error: null };
};
