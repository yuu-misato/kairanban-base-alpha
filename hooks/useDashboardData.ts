import { useState, useCallback, useEffect, useRef } from 'react';
import { User, Post, Kairanban, VolunteerMission, Coupon, Community } from '../types';
import { Household, getMyHouseholds } from '../services/householdService';
import { KairanbanRead, getMyReadStatus } from '../services/kairanbanService';
import { getPosts, getKairanbans, getCoupons, getMissions, getMyCommunities } from '../services/supabaseService';

export const useDashboardData = (user: User | null, selectedAreas: string[], addToast: (msg: string, type?: 'success' | 'error' | 'info') => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [kairanbans, setKairanbans] = useState<Kairanban[]>([]);
    const [missions, setMissions] = useState<VolunteerMission[]>([]);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [myCommunities, setMyCommunities] = useState<Community[]>([]);
    const [households, setHouseholds] = useState<Household[]>([]);
    const [myReads, setMyReads] = useState<KairanbanRead[]>([]);

    // Pagination
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Simple in-memory cache
    const CACHE_TTL = 60000; // 60 seconds
    const cacheRef = useRef<Map<string, { data: any, ts: number }>>(new Map());

    const fetchData = useCallback(async (pageIdx: number, isReset: boolean = false) => {
        if (!user) return;

        const cacheKey = `dashboard-${pageIdx}-${selectedAreas.join(',')}`;
        const now = Date.now();
        const cached = cacheRef.current.get(cacheKey);

        // Serve from cache if valid and not forcing reset
        if (!isReset && cached && (now - cached.ts < CACHE_TTL)) {
            const data = cached.data;
            if (pageIdx === 0) {
                setPosts(data.posts);
                setKairanbans(data.kairanbans);
                setMissions(data.missions);
                setCoupons(data.coupons);
                setIsLoading(false);
                return;
            } else {
                // For pagination, we might just append, but cache usually stores single page results
                // For simplicity in this '1M user' fix, we cache page 0 heavily.
            }
        }

        if (pageIdx === 0) setIsLoading(true);
        else setLoadingMore(true);

        try {
            if (pageIdx === 0) {
                const results = await Promise.allSettled([
                    getPosts(selectedAreas, user.id, pageIdx, 10),
                    getKairanbans(),
                    getCoupons(),
                    getMissions(),
                    getMyHouseholds(user.id),
                    getMyReadStatus(user.id)
                ]);

                const postsRes = results[0].status === 'fulfilled' ? results[0].value : { data: null, error: results[0].reason };
                const kairanRes = results[1].status === 'fulfilled' ? results[1].value : { data: null };
                const couponsRes = results[2].status === 'fulfilled' ? results[2].value : { data: null };
                const missionsRes = results[3].status === 'fulfilled' ? results[3].value : { data: null };
                const householdsRes = results[4].status === 'fulfilled' ? results[4].value : [];
                const readsRes = results[5].status === 'fulfilled' ? results[5].value : { data: [] };

                if (householdsRes) setHouseholds(householdsRes as any[]);
                if (readsRes.data) setMyReads(readsRes.data as any[]);

                let mappedKairan: Kairanban[] = [];
                if (kairanRes.data) {
                    mappedKairan = kairanRes.data.map((k: any) => ({
                        id: k.id,
                        title: k.title,
                        content: k.content,
                        area: k.area || '',
                        author: k.author,
                        points: k.points || 0,
                        readCount: k.read_count || 0,
                        isRead: false,
                        sentToLine: k.sent_to_line || false,
                        createdAt: k.created_at,
                        category: 'notice',
                        communityId: k.communityId || k.community_id
                    }));
                    setKairanbans(mappedKairan);
                }

                let mappedCoupons: Coupon[] = [];
                if (couponsRes.data) {
                    mappedCoupons = couponsRes.data.map((c: any) => ({
                        id: c.id,
                        shopName: c.shop_name,
                        title: c.title,
                        description: c.description,
                        requiredScore: c.required_score || 0,
                        discount: c.discount_rate || c.discount || 'Special',
                        imageUrl: c.image_url,
                        area: c.area,
                        isUsed: c.is_used || false,
                        discountRate: c.discount_rate
                    }));
                    setCoupons(mappedCoupons);
                }

                let mappedMissions: VolunteerMission[] = [];
                if (missionsRes.data) {
                    mappedMissions = missionsRes.data.map((m: any) => ({
                        id: m.id,
                        title: m.title,
                        description: m.description,
                        points: m.points,
                        area: m.area,
                        date: m.date,
                        currentParticipants: m.current_participants || 0,
                        maxParticipants: m.max_participants || 10
                    }));
                    setMissions(mappedMissions);
                }

                let mappedPosts: Post[] = [];
                if (postsRes.error) {
                    console.error('Posts Fetch Error:', postsRes.error);
                    addToast(`投稿の取得に失敗しました: ${postsRes.error.message}`, 'error');
                } else if (postsRes.data) {
                    mappedPosts = postsRes.data.map((p: any) => ({
                        id: p.id,
                        userId: p.author_id || 'unknown',
                        userName: p.author?.nickname || 'Unknown',
                        userAvatar: p.author?.avatar_url || '',
                        category: p.category as any,
                        title: p.title,
                        content: p.content,
                        area: p.area,
                        imageUrl: p.image_url,
                        likes: p.likes,
                        isLiked: p.isLiked,
                        comments: p.comments || [],
                        createdAt: p.created_at,
                        timestamp: new Date(p.created_at).toLocaleDateString()
                    }));
                    setPosts(mappedPosts);
                    if (mappedPosts.length < 10) setHasMore(false);
                    else setHasMore(true);
                }

                // Update Cache
                cacheRef.current.set(cacheKey, {
                    data: { posts: mappedPosts, kairanbans: mappedKairan, coupons: mappedCoupons, missions: mappedMissions },
                    ts: Date.now()
                });

            } else {
                const postsRes = await getPosts(selectedAreas, user.id, pageIdx, 10);
                if (postsRes.data) {
                    const mappedPosts: Post[] = postsRes.data.map((p: any) => ({
                        id: p.id,
                        userId: p.author_id || 'unknown',
                        userName: p.author?.nickname || 'Unknown',
                        userAvatar: p.author?.avatar_url || '',
                        category: p.category,
                        title: p.title,
                        content: p.content,
                        area: p.area,
                        imageUrl: p.image_url,
                        likes: p.likes,
                        isLiked: p.isLiked,
                        comments: p.comments || [],
                        createdAt: p.created_at,
                        timestamp: new Date(p.created_at).toLocaleDateString()
                    }));
                    setPosts(prev => [...prev, ...mappedPosts]);
                    if (mappedPosts.length < 10) setHasMore(false);
                }
            }
        } catch (err) {
            console.error(err);
            addToast('エラーが発生しました', 'error');
        } finally {
            setIsLoading(false);
            setLoadingMore(false);
        }
    }, [user, selectedAreas, addToast]);

    const refreshReads = async () => {
        if (!user) return;
        const { data } = await getMyReadStatus(user.id);
        if (data) setMyReads(data);
    };

    const refreshCommunities = useCallback(async () => {
        if (!user) return;
        const { data } = await getMyCommunities(user.id);
        if (data) setMyCommunities(data);
    }, [user]);

    // Initial Communities Load
    useEffect(() => {
        if (user) {
            refreshCommunities();
        }
    }, [user, refreshCommunities]);

    return {
        posts, setPosts,
        kairanbans, setKairanbans,
        missions, setMissions,
        coupons, setCoupons,
        myCommunities, setMyCommunities,
        households, setHouseholds,
        myReads, setMyReads,
        isLoading,
        loadingMore,
        hasMore,
        fetchData,
        refreshReads,
        refreshCommunities
    };
};
