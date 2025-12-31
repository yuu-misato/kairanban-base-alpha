import { supabase } from '@/integrations/supabase/client';

export const getMissions = async () => {
    const { data, error } = await supabase
        .from('volunteer_missions' as any)
        .select('*')
        .order('created_at', { ascending: false });
    return { data, error };
};

export const createMission = async (mission: any) => {
    const { data, error } = await supabase
        .from('volunteer_missions' as any)
        .insert([{
            title: mission.title,
            description: mission.description,
            points: mission.points,
            area: mission.area,
            date: mission.date,
            max_participants: mission.maxParticipants
        }])
        .select();
    return { data, error };
};

export const joinMission = async (missionId: string, userId: string) => {
    // Googleエンジニア修正: レースコンディション（定員オーバー）を防ぐためにRPCを使用
    const { data, error } = await supabase.rpc('join_mission' as any, {
        m_id: missionId,
        u_id: userId
    });

    if (data === true) {
        return { data, error: null };
    } else if (data === false) {
        return { data: null, error: 'すでに参加済みか、定員に達しています' };
    }

    return { data, error };
};

export const getUserJoinedMissionIds = async (userId: string) => {
    const { data, error } = await supabase
        .from('mission_participants' as any)
        .select('mission_id')
        .eq('user_id', userId);

    if (data) {
        return { data: data.map((item: any) => item.mission_id), error: null };
    }
    return { data: [], error };
};
