
import { supabase } from '@/integrations/supabase/client';

export const createCommunity = async (community: any) => {
    // クライアントサイドでの認証チェックを削除し、DBのRLSに任せる
    // (Amplify環境でgetUserがタイムアウトする問題を回避するため)
    console.log('Creating community with RLS protection:', community.ownerId);

    const { data, error } = await supabase
        .from('communities' as any)
        .insert({
            name: community.name,
            description: community.description,
            owner_id: community.ownerId,
            image_url: community.imageUrl,
            invite_code: community.inviteCode,
            is_secret: community.isSecret
        })
        .select()
        .single();

    if (!error && data) {
        // 作成者を自動的に参加させる
        // ここもRLSが効くので安全
        await supabase.from('community_members' as any).insert({
            community_id: (data as any).id,
            user_id: community.ownerId
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
