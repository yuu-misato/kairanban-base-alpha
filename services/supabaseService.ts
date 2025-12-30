
import { supabase } from '../integrations/supabase/client';
export { supabase };

// Removed duplicate client creation to ensure singleton pattern
// and consistent environment variable usage.

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

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('FAILED TO SAVE PROFILE TO DB (RLS or Constraint Error):', error);
  } else {
    console.log('Profile saved successfully:', data);
  }
  return { data, error };
};

export const createCommunity = async (community: any) => {
  const { data, error } = await supabase
    .from('communities')
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
    // Auto-join the creator
    await supabase.from('community_members').insert({
      community_id: data.id,
      user_id: community.ownerId
    });
    // Initialize member count
    await supabase.rpc('increment_member_count', { c_id: data.id });
  }

  return { data, error };
};

// Join community logic
export const joinCommunity = async (communityId: string, userId: string) => {
  const { data, error } = await supabase
    .from('community_members')
    .insert({
      community_id: communityId,
      user_id: userId
    })
    .select();

  // Increment member count
  if (!error) {
    await supabase.rpc('increment_member_count', { c_id: communityId });
  }
  return { data, error };
};

// Fetch user's communities
export const getMyCommunities = async (userId: string) => {
  const { data, error } = await supabase
    .from('community_members')
    .select('community_id, communities(*)') // Revert select
    .eq('user_id', userId);

  if (data) {
    // Flatten the structure to match Community type
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
        // Infer admin role if owner, otherwise 'member' (fallback until migration applied)
        role: (item.communities.owner_id === userId ? 'admin' : 'member') as 'admin' | 'member'
      })),
      error: null
    };
  }
  return { data: [], error };
};

export const getCommunityByInviteCode = async (code: string) => {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('invite_code', code)
    .single();
  return { data, error };
};


// ... (skip to end of file to append new functions)
/**
 * コミュニティメンバー一覧取得
 */
export const getCommunityMembers = async (communityId: string) => {
  const { data, error } = await supabase
    .from('community_members')
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

/**
 * コミュニティメンバー権限更新
 */
export const updateMemberRole = async (communityId: string, userId: string, role: string) => {
  const { error } = await supabase
    .from('community_members')
    .update({ role })
    .match({ community_id: communityId, user_id: userId });

  return { error };
};

/**
 * コミュニティ管理者権限委譲
 */
export const transferCommunityOwnership = async (communityId: string, newOwnerId: string) => {
  const { error } = await supabase.rpc('transfer_community_ownership', {
    community_id: communityId,
    new_owner_id: newOwnerId
  });
  return { error };
};

/**
 * 住民・事業者のプロファイル管理
 */
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

/**
 * タイムライン投稿の取得
 */
/**
 * タイムライン投稿の取得
 */
export const getPosts = async (areas: string[], currentUserId?: string, page: number = 0, limit: number = 20) => {
  const from = page * limit;
  const to = from + limit - 1;

  // Fetch posts with author info
  const { data: postsData, error: postsError } = await supabase
    .from('posts')
    .select('*, author:profiles(nickname, avatar_url)')
    .in('area', areas)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (postsError || !postsData) return { data: [], error: postsError };

  // If no user, return raw posts (mapped lightly)
  if (!currentUserId) {
    // Map basic structure anyway to ensure consistency if caller expects mapped
    return {
      data: postsData.map(p => ({
        ...p,
        isLiked: false,
        comments: []
      })), error: null
    };
  }

  // Fetch 'isLiked' and 'comments' count manually since complex joins are tricky in one go
  // 1. Get IDs of posts liked by this user
  const postIds = postsData.map(p => p.id);

  // Likes check
  const { data: userLikes } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', currentUserId)
    .in('post_id', postIds);

  const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);

  // Comments fetch (simplified: fetch all comments for these posts)
  // OPTIMIZATION: For production with thousands of posts, this should be paginated or count-only.
  // For now, we fetch actual comments to show them.
  const { data: commentsData } = await supabase
    .from('comments')
    .select('*, author:profiles(nickname, avatar_url)')
    .in('post_id', postIds)
    .order('created_at', { ascending: true });

  // Map back to posts
  const mappedPosts = postsData.map(post => {
    const postComments = commentsData?.filter(c => c.post_id === post.id) || [];
    return {
      ...post,
      isLiked: likedPostIds.has(post.id),
      comments: postComments.map(c => ({
        id: c.id,
        userId: c.user_id,
        userName: c.author?.nickname || 'Unknown',
        userAvatar: c.author?.avatar_url || '',
        content: c.content,
        createdAt: c.created_at
      }))
    };
  });

  return { data: mappedPosts, error: null };
};

/**
 * タイムライン投稿の作成
 */
export const createPost = async (post: any) => {
  // Map frontend camelCase to DB snake_case
  const dbPayload = {
    title: post.title,
    content: post.content,
    area: post.area,
    category: post.category,
    image_url: post.imageUrl || post.image || null,
    author_id: post.authorId || post.userId,
    likes: 0,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('posts')
    .insert(dbPayload)
    .select();

  if (error) console.error('Create Post Error:', error);
  return { data, error };
};

/**
 * コメント機能（SNS強化）
 */
export const getComments = async (postId: string) => {
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles(nickname, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  return { data, error };
};

export const addComment = async (comment: { postId: string, userId: string, content: string }) => {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: comment.postId,
      user_id: comment.userId,
      content: comment.content
    })
    .select('*, author:profiles(nickname, avatar_url)')
    .single();
  return { data, error };
};

/**
 * いいね機能（永続化・アトミック処理）
 */
export const toggleLike = async (postId: string, userId: string) => {
  // Google Engineer Fix: Use database function (RPC) for atomicity
  const { error } = await supabase.rpc('toggle_like', {
    p_id: postId,
    u_id: userId
  });

  return { error };
};

/**
 * 回覧板の取得
 */
export const getKairanbans = async () => {
  const { data, error } = await supabase
    .from('kairanbans')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
};

/**
 * 町会長用：LINE連携プッシュ通知の記録と投稿
 */
export const createKairanbanWithNotification = async (kairan: any) => {
  // 1. 回覧板データを挿入
  const { data, error } = await supabase
    .from('kairanbans')
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
    console.log("Invoking line-broadcast Edge Function...");
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
      console.error("Failed to send LINE notification:", funcError);
    } else {
      console.log("LINE notification sent successfully:", funcData);
    }
  }

  return { data, error };
};

/**
 * 地域クーポン取得
 */
export const getCoupons = async () => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*');
  return { data, error };
};

/**
 * 地域クーポン登録
 */
export const registerLocalCoupon = async (coupon: any) => {
  const { data, error } = await supabase
    .from('coupons')
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

/**
 * 地域お手伝いミッションの取得
 */
export const getMissions = async () => {
  const { data, error } = await supabase
    .from('volunteer_missions')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
};

/**
 * 地域お手伝いミッションの作成
 */
export const createMission = async (mission: any) => {
  const { data, error } = await supabase
    .from('volunteer_missions')
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

/**
 * ミッションに参加（トランザクション処理）
 */
export const joinMission = async (missionId: string, userId: string) => {
  // Google Engineer Fix: Use RPC to prevent race conditions (overbooking)
  const { data, error } = await supabase.rpc('join_mission', {
    m_id: missionId,
    u_id: userId
  });

  if (data === true) {
    return { data, error: null };
  } else if (data === false) {
    return { data: null, error: 'Already joined or full' };
  }

  return { data, error };
};
// ... (existing code)

/**
 * ユーザーが参加しているミッションIDを取得
 */
export const getUserJoinedMissionIds = async (userId: string) => {
  const { data, error } = await supabase
    .from('mission_participants')
    .select('mission_id')
    .eq('user_id', userId);

  if (data) {
    return { data: data.map((item: any) => item.mission_id), error: null };
  }
  return { data: [], error };
};

/**
 * 管理者機能：全ユーザー取得
 */
export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
};

/**
 * 管理者機能：ユーザー権限更新
 */
export const updateUserRole = async (userId: string, role: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select();
  return { data, error };
};

/**
 * 管理者機能：ポイント付与
 */
export const giveUserPoints = async (userId: string, points: number) => {
  const { data: current } = await supabase
    .from('profiles')
    .select('score')
    .eq('id', userId)
    .single();

  if (current) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ score: (current.score || 0) + points })
      .eq('id', userId)
      .select();
    return { data, error };
  }
  return { data: null, error: 'User not found' };
};

/**
 * 管理者機能：全コミュニティ取得
 */
export const getAllCommunities = async () => {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
};

/**
 * 管理者機能：コミュニティ削除
 */
// ... (existing code)

/**
 * 管理者機能：コミュニティ削除
 */
export const deleteCommunity = async (communityId: string) => {
  const { error } = await supabase
    .from('communities')
    .delete()
    .eq('id', communityId);
  return { error };
};


/**
 * 管理者機能：ユーザー一覧とプラン情報の取得
 */
export const getAllUsersWithPlans = async () => {
  // Use a raw query or join manual if needed, but Supabase standard client supports joins.
  // user_plans is 1:1 with users (based on unique user_id).
  // profiles is 1:1 with users (id).
  // So we select from profiles and join user_plans.

  // Note: Since user_monthly_usages is composite unique (user_id, year_month),
  // we can't easily join just "current month" in one standard SELECT without Views or precise filters.
  // Instead, we'll fetch users+plans first, then fetch usage stats separately or in a loop/map.

  const { data: users, error } = await supabase
    .from('profiles')
    .select('*, user_plans(plan_type, expires_at)')
    .order('created_at', { ascending: false });

  if (error) return { data: [], error };

  // Fetch usage for current month
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const userIds = users.map((u: any) => u.id);

  const { data: usages } = await supabase
    .from('user_monthly_usages')
    .select('user_id, message_count')
    .eq('year_month', yearMonth)
    .in('user_id', userIds);

  const usageMap = new Map();
  usages?.forEach((u: any) => usageMap.set(u.user_id, u.message_count));

  // Merge
  const combined = users.map((u: any) => {
    // Determine plan (default to normal if missing)
    const plan = u.user_plans?.[0] || u.user_plans; // depending on if it returns array or object. usually array for left join unless single() used (but single can't be used on list)
    // Actually select returns array for relation.

    // Check if user_plans is array or object. In 1:1 it might be object if defined correctly?
    // Supabase JS maps 1:N relations as array. profiles->user_plans: user_plans should have FK to profiles? No, user_plans has user_id FK to auth.users. 
    // If we query 'profiles' joined with 'user_plans', we need to ensure the foreign key relationship is recognized by PostgREST.
    // If not auto-detected (because both key to auth.users but not to each other directly in schema), we might need to fetch separately.
    // However, profiles.id IS auth.users.id.

    // Let's assume fetching separately is safer if relation isn't clear.
    return {
      ...u,
      plan_type: Array.isArray(plan) ? plan[0]?.plan_type : (plan?.plan_type || 'normal'),
      current_usage: usageMap.get(u.id) || 0
    };
  });

  return { data: combined, error: null };
};

/**
 * 管理者機能：ユーザープラン変更
 */
export const updateUserPlan = async (userId: string, newPlan: string) => {
  // Check if mapping exists
  const { data: existing } = await supabase
    .from('user_plans')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('user_plans')
      .update({ plan_type: newPlan, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select();
    return { data, error };
  } else {
    const { data, error } = await supabase
      .from('user_plans')
      .insert({ user_id: userId, plan_type: newPlan })
      .select();
    return { data, error };
  }
};


/**
 * 管理者機能：コミュニティ更新
 */
export const updateCommunity = async (communityId: string, updates: any) => {
  const { data, error } = await supabase
    .from('communities')
    .update({
      name: updates.name,
      description: updates.description,
      image_url: updates.imageUrl,
      is_secret: updates.isSecret
    })
    .eq('id', communityId)
    .select();
  return { data, error };
};

/**
 * 管理者機能：LINE一斉送信
 */
export const sendLineBroadcast = async (message: string, targetRole: string = 'all') => {
  // Edge Function 'line-broadcast' needs to handle 'targetRole'
  const { data, error } = await supabase.functions.invoke('line-broadcast', {
    body: {
      content: message,
      targetRole: targetRole,
      broadcast: true
    }
  });
  return { data, error };
};
export const getAdminData = async (type: 'users' | 'missions' | 'communities') => {
  const { data, error } = await supabase.functions.invoke(`admin-data?type=${type}`, {
    method: 'GET'
  });
  return { data, error };
};

/**
 * ユーザーが既読の回覧板IDを取得
 */
export const getUserReadKairanbanIds = async (userId: string) => {
  const { data, error } = await supabase
    .from('kairanban_reads')
    .select('kairanban_id')
    .eq('user_id', userId);

  if (data) {
    return { data: data.map((item: any) => item.kairanban_id), error: null };
  }
  return { data: [], error };
};

/**
 * 回覧板を既読にする
 */
export const markKairanbanAsRead = async (userId: string, kairanbanId: string) => {
  const { error } = await supabase
    .from('kairanban_reads')
    .insert({ user_id: userId, kairanban_id: kairanbanId });

  return { error };
};

/**
 * AIによる回覧板解析
 */
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
