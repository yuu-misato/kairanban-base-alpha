import { supabase } from '@/integrations/supabase/client';

export const getPosts = async (areas: string[], currentUserId?: string, page: number = 0, limit: number = 20) => {
    const from = page * limit;
    const to = from + limit - 1;

    // Fetch posts with author info
    const { data: postsData, error: postsError } = await supabase
        .from('posts' as any)
        .select('*, author:profiles(nickname, avatar_url)')
        .in('area', areas)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (postsError || !postsData) return { data: [], error: postsError };

    // If no user, return raw posts (mapped lightly)
    if (!currentUserId) {
        // Map basic structure anyway to ensure consistency if caller expects mapped
        return {
            data: (postsData as any[]).map(p => ({
                ...p,
                isLiked: false,
                comments: []
            })), error: null
        };
    }

    // Fetch 'isLiked' and 'comments' count manually since complex joins are tricky in one go
    // 1. Get IDs of posts liked by this user
    const postIds = (postsData as any[]).map(p => p.id);

    // Likes check
    const { data: userLikes } = await supabase
        .from('post_likes' as any)
        .select('post_id')
        .eq('user_id', currentUserId)
        .in('post_id', postIds);

    const likedPostIds = new Set((userLikes as any[])?.map((l: any) => l.post_id) || []);

    // Comments fetch (simplified: fetch all comments for these posts)
    // OPTIMIZATION: For production with thousands of posts, this should be paginated or count-only.
    // For now, we fetch actual comments to show them.
    const { data: commentsData } = await supabase
        .from('comments' as any)
        .select('*, author:profiles(nickname, avatar_url)')
        .in('post_id', postIds)
        .order('created_at', { ascending: true });

    // Map back to posts
    const mappedPosts = (postsData as any[]).map(post => {
        const postComments = (commentsData as any[])?.filter((c: any) => c.post_id === post.id) || [];
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
        .from('posts' as any)
        .insert(dbPayload)
        .select();

    if (error) console.error('Create Post Error:', error);
    return { data, error };
};

export const getComments = async (postId: string) => {
    const { data, error } = await supabase
        .from('comments' as any)
        .select('*, author:profiles(nickname, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
    return { data, error };
};

export const addComment = async (comment: { postId: string, userId: string, content: string }) => {
    const { data, error } = await supabase
        .from('comments' as any)
        .insert({
            post_id: comment.postId,
            user_id: comment.userId,
            content: comment.content
        })
        .select('*, author:profiles(nickname, avatar_url)')
        .single();
    return { data, error };
};

export const toggleLike = async (postId: string, userId: string) => {
    // Google Engineer Fix: Use database function (RPC) for atomicity
    const { error } = await supabase.rpc('toggle_like' as any, {
        p_id: postId,
        u_id: userId
    });

    return { error };
};
