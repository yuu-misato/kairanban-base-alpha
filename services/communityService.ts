import { supabase } from '@/integrations/supabase/client';

export const createCommunity = async (community: any) => {
    // RLSエラーを防ぐためにユーザーを明示的に検証
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error('CREATE COMMUNITY AUTH ERROR:', authError);
        return { data: null, error: { message: 'ログイン有効期限が切れています。一度ログアウトして再ログインしてください。' } as any };
    }

    // オーナーIDが認証ユーザーと一致することを確認
    const safeOwnerId = user.id;
    console.log('Creating community for user:', safeOwnerId);
    const { data, error } = await supabase
        .from('communities' as any)
        .insert({
            name: community.name,
            description: community.description,
            owner_id: safeOwnerId,
            image_url: community.imageUrl,
            invite_code: community.inviteCode,
            is_secret: community.isSecret
        })
        .select()
        .single();

    if (!error && data) {
        // 作成者を自動的に参加させる
        await supabase.from('community_members' as any).insert({
            community_id: (data as any).id,
            user_id: safeOwnerId
        });
        // メンバー数を初期化
        await supabase.rpc('increment_member_count' as any, { c_id: (data as any).id });
    }

    return { data, error };
};

export const joinCommunity = async (communityId: string, userId: string) => {
    const { data, error } = await supabase
        .from('community_members' as any)
        .insert({
            community_id: communityId,
            user_id: userId
        })
        .select();

    // メンバー数をインクリメント
    if (!error) {
        await supabase.rpc('increment_member_count' as any, { c_id: communityId });
    }
    return { data, error };
};

export const getMyCommunities = async (userId: string) => {
    const { data, error } = await supabase
        .from('community_members' as any)
        .select('community_id, communities(*)') // 選択を元に戻す
        .eq('user_id', userId);

    if (data) {
        // Community型に合わせて構造をフラット化
        return {
            data: data.map((item: any) => ({
                id: item.communities.id,
                name: item.communities.name,
                description: item.communities.description,
                ownerId: item.communities.owner_id,
                inviteCode: item.communities.invite_code,
                membersCount: item.communities.members_count,
                isSecret: item.communities.is_secret,
                imageUrl: item.communities.image_url,
                // オーナーならadmin、それ以外はmemberと推論（マイグレーション適用までのフォールバック）
                role: (item.communities.owner_id === userId ? 'admin' : 'member') as 'admin' | 'member'
            })),
            error: null
        };
    }
    return { data: [], error };
};

export const getCommunityByInviteCode = async (code: string) => {
    const { data, error } = await supabase
        .from('communities' as any)
        .select('*')
        .eq('invite_code', code)
        .single();
    return { data, error };
};

export const getCommunityMembers = async (communityId: string) => {
    const { data, error } = await supabase
        .from('community_members' as any)
        .select('*, profiles(nickname, avatar_url)')
        .eq('community_id', communityId);

    if (data) {
        return {
            data: data.map((m: any) => ({
                communityId: m.community_id,
                userId: m.user_id,
                joinedAt: m.joined_at,
                role: m.role || 'member',
                nickname: m.profiles?.nickname,
                avatar: m.profiles?.avatar_url
            })),
            error: null
        };
    }
    return { data: [], error };
};

export const updateMemberRole = async (communityId: string, userId: string, role: string) => {
    const { error } = await supabase
        .from('community_members' as any)
        .update({ role })
        .match({ community_id: communityId, user_id: userId });

    return { error };
};

export const transferCommunityOwnership = async (communityId: string, newOwnerId: string) => {
    const { error } = await supabase.rpc('transfer_community_ownership' as any, {
        community_id: communityId,
        new_owner_id: newOwnerId
    });
    return { error };
};
