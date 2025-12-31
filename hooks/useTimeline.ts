import { useState, useCallback } from 'react';
import { getPosts, createPost, toggleLike, addComment } from '@/services/timelineService';
import { Post, PostCategory } from '@/types';

export const useTimeline = (areas: string[], currentUserId?: string) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPosts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await getPosts(areas, currentUserId);
            if (error) throw error;
            if (data) setPosts(data as Post[]);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch posts');
        } finally {
            setIsLoading(false);
        }
    }, [areas, currentUserId]);

    const handleCreatePost = async (post: { title: string, content: string, area: string, category: PostCategory, imageUrl?: string }) => {
        if (!currentUserId) return;
        const { error } = await createPost({ ...post, userId: currentUserId });
        if (!error) {
            await fetchPosts(); // Refresh
        }
        return { error };
    };

    const handleLike = async (postId: string) => {
        if (!currentUserId) return;
        // Optimistic update
        setPosts(prev => prev.map(p =>
            p.id === postId
                ? { ...p, likes: p.isLiked ? p.likes - 1 : p.likes + 1, isLiked: !p.isLiked }
                : p
        ));

        const { error } = await toggleLike(postId, currentUserId);
        if (error) {
            // Revert on error
            await fetchPosts();
        }
    };

    return {
        posts,
        isLoading,
        error,
        fetchPosts,
        createPost: handleCreatePost,
        toggleLike: handleLike
    };
};
