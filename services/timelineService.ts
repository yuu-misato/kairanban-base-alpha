import { supabase } from '@/integrations/supabase/client';

export const getPosts = async (areas: string[], currentUserId?: string, page: number = 0, limit: number = 20) => {
    const from = page * limit;
    const to = from + limit - 1;

    // 投稿と投稿者情報を取得
    const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*, author:profiles(nickname, avatar_url)')
        .in('area', areas)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (postsError || !postsData) return { data: [], error: postsError };

    // ユーザーがいない場合は未加工の投稿データを返す（最低限のマッピングは行う）
    if (!currentUserId) {
        // 呼び出し元が一貫したマッピングを期待している場合に対応
        return {
            data: (postsData as any[]).map(p => ({
                ...p,
                isLiked: false,
                comments: []
            })), error: null
        };
    }

    // 複雑な結合クエリを避けるため、「いいね」と「コメント」は手動で取得する
    // 1. このユーザーがいいねした投稿IDを取得
    const postIds = (postsData as any[]).map(p => p.id);

    // いいねチェック
    const { data: userLikes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', currentUserId)
        .in('post_id', postIds);

    const likedPostIds = new Set((userLikes as any[])?.map((l: any) => l.post_id) || []);

    // コメント取得（簡易版：これらの投稿に対する全コメントを取得）
    // 最適化: 本番環境で数千件のコメントがある場合はページネーションかカウントのみにするべき。
    // 現状は表示用に実際のコメントを取得する。
    const { data: commentsData } = await supabase
        .from('comments')
        .select('*, author:profiles(nickname, avatar_url)')
        .in('post_id', postIds)
        .order('created_at', { ascending: true });

    // 投稿データにマッピングして返す
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
    // フロントエンドのキャメルケースをDBのスネークケースに変換
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

    if (error) console.error('投稿作成エラー:', error);
    return { data, error };
};

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

export const toggleLike = async (postId: string, userId: string) => {
    // Google Engineer Fix: Use database function (RPC) for atomicity
    const { error } = await supabase.rpc('toggle_like', {
        p_id: postId,
        u_id: userId
    });

    return { error };
};
