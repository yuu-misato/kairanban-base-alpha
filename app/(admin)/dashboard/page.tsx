"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import Layout from '@/components/Layout';
import DebugPanel from '@/components/DebugPanel';
import PostCard from '@/components/PostCard';
import CouponList from '@/components/CouponList';
import ChokaiPanel from '@/components/ChokaiPanel';
import CommunityPanel from '@/components/CommunityPanel';
import BusinessPanel from '@/components/BusinessPanel';
import AdminDashboard from '@/components/AdminDashboard';
import { PostSkeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import Toast, { ToastMessage } from '@/components/Toast';
import RegistrationModal from '@/components/RegistrationModal';
import CommunitySettingsModal from '@/components/CommunitySettingsModal';
import AIChat from '@/components/AIChat';
import AreaSelectModal from '@/components/AreaSelectModal';

import { useAuth } from '@/hooks/useAuth';
import { useLineLogin } from '@/hooks/useLineLogin';

import { Post, PostCategory, Coupon, Kairanban, VolunteerMission, Community, CommunityMember } from '@/types';
import { MUNICIPALITY_COORDINATES } from '@/constants';
import { getPosts, createPost, createKairanbanWithNotification, registerLocalCoupon, createProfile, createMission, joinMission, addComment, toggleLike, getKairanbans, getCoupons, getMissions, getAllCommunities, getMyCommunities, createCommunity, getCommunityMembers, joinCommunity, getUserJoinedMissionIds, getUserReadKairanbanIds, markKairanbanAsRead, analyzeKairanban } from '@/services/supabaseService';

function DashboardContent() {
    const {
        user,
        setUser,
        isLoading: isAuthLoading,
        isAuthChecking,
        logout,
    } = useAuth();

    // Auth redirect handled by useEffect to prevent hydration mismatch
    const router = useRouter();

    useEffect(() => {
        if (!isAuthLoading && !user && typeof window !== 'undefined') {
            // For now, we allow guests or handle redirect in render
            // But usually we'd redirect.
            // router.replace('/');
        }
    }, [user, isAuthLoading, router]);

    const searchParams = useSearchParams();
    const initialTab = searchParams?.get('tab') || 'chokai';

    const [activeTab, setActiveTabState] = useState(initialTab);

    // Sync URL with Tab state
    const setActiveTab = (tab: string) => {
        setActiveTabState(tab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.pushState({}, '', url);
    };

    useEffect(() => {
        const tab = searchParams?.get('tab');
        if (tab) setActiveTabState(tab);
    }, [searchParams]);


    const [isLoading, setIsLoading] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [kairanbans, setKairanbans] = useState<Kairanban[]>([]);
    const [missions, setMissions] = useState<VolunteerMission[]>([]);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [myCommunities, setMyCommunities] = useState<Community[]>([]);
    const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
    const [score, setScore] = useState(150);
    const [selectedAreas, setSelectedAreas] = useState<string[]>(['さいたま市大宮区']); // Default
    const [joinedMissionIds, setJoinedMissionIds] = useState<Set<string>>(new Set());
    const [readKairanbanIds, setReadKairanbanIds] = useState<Set<string>>(new Set());

    // Derived from user profile if available
    useEffect(() => {
        if (user?.selectedAreas && user.selectedAreas.length > 0) {
            setSelectedAreas(user.selectedAreas);
        }
        if (user?.score) {
            setScore(user.score);
        }
    }, [user]);

    const [isPosting, setIsPosting] = useState(false);
    const [isCreatingMission, setIsCreatingMission] = useState(false);
    const [newPost, setNewPost] = useState({ title: '', content: '', category: 'notice' as PostCategory, area: '', imageUrl: '' });
    const [newMission, setNewMission] = useState({ title: '', description: '', points: 50, area: '', date: '', maxParticipants: 5 });

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
    const [showScorePopup, setShowScorePopup] = useState<{ show: boolean, amount: number }>({ show: false, amount: 0 });
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = Math.random().toString(36).substring(7);
        setToasts(prev => [...prev, { id, type, message }]);
    };




    // Handle Invite
    useEffect(() => {
        const handleInvite = async () => {
            if (!user) return;
            const inviteId = localStorage.getItem('pendingInviteCommunityId');
            if (inviteId) {
                const { error } = await joinCommunity(inviteId, user.id);
                if (!error) {
                    addToast('コミュニティに参加しました！', 'success');
                    localStorage.removeItem('pendingInviteCommunityId');
                    const { data } = await getMyCommunities(user.id);
                    if (data) setMyCommunities(data);
                } else {
                    // console.error(error); // Optionally log
                }
            }
        };
        if (user && !isLoading) handleInvite();
    }, [user, isLoading]);

    // Community Creation State
    const [isCreatingCommunityState, setIsCreatingCommunityState] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [newCommunity, setNewCommunity] = useState({ name: '', description: '', isSecret: false });

    const handleCreateCommunity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCommunity.name || !user) return;

        // Limit check: Max 2 communities for free plan
        const ownedCount = myCommunities.filter(c => c.ownerId === user.id).length;
        if (ownedCount >= 2) {
            addToast('無料プランでは作成できるコミュニティは2つまでです', 'error');
            return;
        }

        // Generate simple invite code
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const { data, error } = await createCommunity({
            name: newCommunity.name,
            description: newCommunity.description,
            ownerId: user.id,
            imageUrl: '', // default
            inviteCode,
            isSecret: newCommunity.isSecret
        });

        if (error) {
            console.error(error);
            addToast('コミュニティの作成に失敗しました', 'error');
        } else {
            addToast('コミュニティを作成しました', 'success');
            setIsCreatingCommunityState(false);
            setNewCommunity({ name: '', description: '', isSecret: false });
            // Refresh
            const { data: communities } = await getMyCommunities(user.id);
            if (communities) setMyCommunities(communities);
        }
    };

    // Community Detail State
    const [isKairanbanModalOpen, setIsKairanbanModalOpen] = useState(false);
    const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>([]);

    useEffect(() => {
        if (selectedCommunity) {
            getCommunityMembers(selectedCommunity.id).then(({ data }) => {
                if (data) setCommunityMembers(data);
            });
        }
    }, [selectedCommunity]);

    // Data Fetching
    const [newCommunityKairanban, setNewCommunityKairanban] = useState({ title: '', content: '' });
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyzeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result?.toString().split(',')[1];
                if (!base64) return;

                const { data, error } = await analyzeKairanban(base64, file.type);

                if (!error && data) {
                    setNewCommunityKairanban({
                        ...newCommunityKairanban,
                        title: data.title || '',
                        content: data.content || ''
                    });
                    addToast('読み込みが完了しました', 'success');
                } else {
                    console.error(error);
                    addToast('読み込みに失敗しました', 'error');
                }
                setIsAnalyzing(false);
            };
        } catch {
            addToast('読み込みに失敗しました', 'error');
            setIsAnalyzing(false);
        }
    };

    const handleCreateCommunityKairanban = async () => {
        if (!selectedCommunity || !user) return;

        setIsLoading(true);
        // Create kairanban linked to this community
        const { error } = await createKairanbanWithNotification({
            title: newCommunityKairanban.title,
            content: newCommunityKairanban.content,
            area: selectedCommunity.region || 'その他', // Fallback
            author: user.nickname,
            sent_to_line: true,
            communityId: selectedCommunity.id,
            communityName: selectedCommunity.name
        });

        if (error) {
            addToast('お知らせの配信に失敗しました', 'error');
            console.error(error);
        } else {
            addToast('お知らせを配信しました', 'success');
            setNewCommunityKairanban({ title: '', content: '' });
            // Refresh data
            const { data: kData } = await getKairanbans();
            if (kData) {
                setKairanbans(kData.map((k: any) => ({
                    id: k.id,
                    title: k.title,
                    content: k.content,
                    area: k.area,
                    author: k.author,
                    points: k.points || 0,
                    readCount: k.read_count || 0,
                    isRead: readKairanbanIds.has(k.id),
                    sentToLine: k.sent_to_line || false,
                    createdAt: k.created_at,
                    category: 'notice',
                    communityId: k.community_id
                })));
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (!user || isAuthChecking) return;

        setIsLoading(true);
        const promises = [
            getPosts(selectedAreas, user.id),
            getKairanbans(),
            getCoupons(),
            getMissions(), // missionsRes
            getMyCommunities(user.id), // myCommunitiesRes
            getUserJoinedMissionIds(user.id), // userJoinedMissionIdsRes
            getUserReadKairanbanIds(user.id) // userReadKairanbanIdsRes
        ];

        Promise.all(promises).then(([postsRes, kairanRes, couponsRes, missionsRes, myCommunitiesRes, userJoinedMissionIdsRes, userReadKairanbanIdsRes]) => {
            if (postsRes.data) {
                // Mapping handled in service for complex objects, but double check format
                setPosts(postsRes.data as Post[]);
            }
            if (kairanRes.data) {
                // Map Kairanban
                const mappedKairan: Kairanban[] = kairanRes.data.map((k: any) => ({
                    id: k.id,
                    title: k.title,
                    content: k.content,
                    area: k.area || '',
                    author: k.author,
                    points: k.points || 0,
                    readCount: k.read_count || 0,
                    isRead: userReadKairanbanIdsRes?.data ? new Set(userReadKairanbanIdsRes.data).has(k.id) : false,
                    sentToLine: k.sent_to_line || false,
                    createdAt: k.created_at,
                    category: 'notice',
                    communityId: k.community_id
                }));
                setKairanbans(mappedKairan);
            }
            if (couponsRes.data) {
                const mappedCoupons: Coupon[] = couponsRes.data.map((c: any) => ({
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
            if (missionsRes.data) {
                const mappedMissions: VolunteerMission[] = missionsRes.data.map((m: any) => ({
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
            if (myCommunitiesRes?.data) {
                setMyCommunities(myCommunitiesRes.data as Community[]);
            }
            if (userJoinedMissionIdsRes?.data) {
                setJoinedMissionIds(new Set(userJoinedMissionIdsRes.data));
            }
            if (userReadKairanbanIdsRes?.data) {
                setReadKairanbanIds(new Set(userReadKairanbanIdsRes.data));
            }
        }).finally(() => {
            setIsLoading(false);
        }).catch(err => {
            console.error(err);
            addToast('データの読み込みに失敗しました', 'error');
            setIsLoading(false);
        });

    }, [selectedAreas, user, isAuthChecking]);

    const { login: lineLogin } = useLineLogin();

    const addScore = (amount: number) => {
        setScore(prev => prev + amount);
        setShowScorePopup({ show: true, amount });
        setTimeout(() => setShowScorePopup({ show: false, amount: 0 }), 2000);
    };

    const handleRegistrationComplete = async (nickname: string, areas: string[]) => {
        if (!user) return;
        const updatedUser = { ...user, nickname, selectedAreas: areas };
        const { error } = await createProfile(updatedUser);
        if (error) {
            addToast('保存に失敗しましたが、続行します', 'info');
        } else {
            addToast('プロフィールを更新しました', 'success');
        }
        setUser(updatedUser);
        setSelectedAreas(areas);
        setIsEditingProfile(false);
    };

    const handleAreaAdd = async (newArea: string) => {
        if (newArea && !selectedAreas.includes(newArea)) {
            const newAreas = [...selectedAreas, newArea];
            setSelectedAreas(newAreas);
            if (user) {
                const updatedUser = { ...user, selectedAreas: newAreas };
                await createProfile(updatedUser);
                setUser(updatedUser);
                addToast(`${newArea}を追加しました`, 'success');
            }
        } else {
            addToast('そのエリアは既に追加されています', 'info');
        }
    };

    const handleAddComment = async (postId: string, content: string) => {
        if (!user) return;
        try {
            await addComment({ postId, userId: user.id, content });
            addToast('コメントを送信しました', 'success');
        } catch (e) {
            addToast('送信に失敗しました', 'error');
        }
    };

    const handleLikePost = async (postId: string) => {
        if (!user) return;

        // Optimistic UI Update
        setPosts(currentPosts => currentPosts.map(p => {
            if (p.id === postId) {
                const isLiked = !p.isLiked;
                return {
                    ...p,
                    isLiked,
                    likes: isLiked ? p.likes + 1 : Math.max(0, p.likes - 1)
                };
            }
            return p;
        }));

        if (!posts.find(p => p.id === postId)?.isLiked) {
            addScore(2);
        }

        toggleLike(postId, user.id);
    };

    const handleCreateMission = async (e: React.FormEvent) => {
        e.preventDefault();
        const missionPayload = { ...newMission, area: selectedAreas[0] };
        const { data, error } = await createMission(missionPayload);
        if (!error && data) {
            const raw = data[0] as any;
            const created: VolunteerMission = {
                id: raw.id,
                title: raw.title,
                description: raw.description,
                points: raw.points,
                area: raw.area,
                date: raw.date,
                currentParticipants: 0,
                maxParticipants: raw.max_participants
            };
            setMissions([created, ...missions]);
            setIsCreatingMission(false);
            setNewMission({ title: '', description: '', points: 50, area: '', date: '', maxParticipants: 5 });
            addToast('ミッションを作成しました', 'success');
        }
    };

    const handleJoinMission = async (id: string, points: number) => {
        if (!user) return;
        const { error } = await joinMission(id, user.id);
        if (!error) {
            setMissions(missions.map(m => m.id === id ? { ...m, currentParticipants: m.currentParticipants + 1 } : m));
            addScore(points);
            addToast('ミッションに参加しました！', 'success');
        }
    };

    const handleRegisterCoupon = async (coupon: Coupon) => {
        const { data, error } = await registerLocalCoupon(coupon);
        if (!error && data) {
            const newCoupon = { ...coupon, id: (data[0] as any).id };
            setCoupons([newCoupon, ...coupons]);
            addScore(100);
        }
    };

    if (!user) { // Simple loading state or redirect fallback
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full animate-bounce mx-auto mb-4"></div>
                    <p className="font-bold text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Check if we need to show registration modal (e.g. if name is '名無し')
    // Logic for tempUser is handled by checking user data
    if (user.nickname === '名無し' || isEditingProfile) {
        return (
            <RegistrationModal
                initialNickname={user.nickname === '名無し' ? '' : user.nickname}
                onRegister={handleRegistrationComplete}
            />
        );
    }


    const renderContent = () => {
        switch (activeTab) {
            case 'community':
                if (selectedCommunity) {
                    // Community Detail View
                    const communityKairanbans = kairanbans.filter(k => k.communityId === selectedCommunity.id);
                    return (
                        <div className="space-y-6 animate-in slide-in-from-right duration-300">
                            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                                <button onClick={() => setSelectedCommunity(null)} className="absolute top-6 left-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors backdrop-blur-sm">
                                    <i className="fas fa-arrow-left"></i>
                                </button>
                                <button onClick={() => setIsSettingsModalOpen(true)} className="absolute top-6 right-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors backdrop-blur-sm">
                                    <i className="fas fa-cog"></i>
                                </button>
                                <div className="mt-8">
                                    <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-black tracking-widest mb-2 backdrop-blur-sm">VIP COMMUNITY</span>
                                    <h2 className="text-3xl font-black mb-2">{selectedCommunity.name}</h2>
                                    <p className="opacity-80 font-bold text-sm mb-6">{selectedCommunity.description}</p>
                                </div>
                            </div>
                            {/* Admin Actions */}
                            {['admin', 'sub_admin'].includes(selectedCommunity.role || '') && (
                                <div className="mb-6">
                                    <button
                                        onClick={() => setIsKairanbanModalOpen(true)}
                                        className="w-full py-4 bg-indigo-600 text-white rounded-[2rem] font-black shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
                                    >
                                        <i className="fas fa-bullhorn"></i>
                                        お知らせを配信する
                                    </button>
                                </div>
                            )}

                            {/* Create Kairanban Modal */}
                            {isKairanbanModalOpen && (
                                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
                                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-black text-xl text-slate-800">📢 お知らせを作成</h3>
                                            <button onClick={() => setIsKairanbanModalOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200">
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">タイトル</label>
                                                <input
                                                    type="text"
                                                    placeholder="例: 今月の清掃活動について"
                                                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none"
                                                    value={newCommunityKairanban.title}
                                                    onChange={e => setNewCommunityKairanban({ ...newCommunityKairanban, title: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">PDF/画像から読み込む</label>
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept="image/*,application/pdf"
                                                        onChange={handleAnalyzeFile}
                                                        className="hidden"
                                                        id="kairanban-file-upload"
                                                    />
                                                    <label
                                                        htmlFor="kairanban-file-upload"
                                                        className="w-full py-3 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-200 transition-colors font-bold text-sm border-2 border-dashed border-slate-300"
                                                    >
                                                        {isAnalyzing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
                                                        {isAnalyzing ? '解析中...' : 'AIで読み込む'}
                                                    </label>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">内容</label>
                                                <textarea
                                                    placeholder="詳細を入力してください..."
                                                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none h-40 resize-none"
                                                    value={newCommunityKairanban.content}
                                                    onChange={e => setNewCommunityKairanban({ ...newCommunityKairanban, content: e.target.value })}
                                                />
                                            </div>
                                            <div className="pt-2">
                                                <button
                                                    onClick={handleCreateCommunityKairanban}
                                                    disabled={!newCommunityKairanban.title || !newCommunityKairanban.content || isLoading}
                                                    className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                                                    配信する
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Member List Section */}
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                                <h3 className="font-black text-slate-800 text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-users text-indigo-500"></i>
                                    参加メンバー
                                    <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">{communityMembers.length}名</span>
                                </h3>

                                {communityMembers.length > 0 ? (
                                    <div className="flex -space-x-3 overflow-x-auto pb-2 scrollbar-hide px-2">
                                        {communityMembers.map((member) => (
                                            <div key={member.userId} className="relative group shrink-0">
                                                <div
                                                    className="w-12 h-12 rounded-full border-2 border-white shadow-md bg-slate-200 overflow-hidden cursor-pointer"
                                                    title={member.nickname || 'Unknown'}
                                                >
                                                    <img
                                                        src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.userId}`}
                                                        alt={member.nickname}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                    {member.nickname}
                                                </div>
                                                {member.role === 'admin' && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white z-10" title="管理者">
                                                        <i className="fas fa-crown"></i>
                                                    </div>
                                                )}
                                                {member.role === 'sub_admin' && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white z-10" title="副管理者">
                                                        <i className="fas fa-star"></i>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => setIsSettingsModalOpen(true)}
                                            className="w-12 h-12 rounded-full bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors shrink-0 z-0"
                                        >
                                            <i className="fas fa-ellipsis-h"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-slate-400 text-xs font-bold">
                                        読み込み中...
                                    </div>
                                )}
                            </div>

                            {/* Community Posts */}
                            {communityKairanbans.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-100">
                                    <p className="text-slate-400 font-bold">まだお知らせはありません</p>
                                </div>
                            ) : (
                                communityKairanbans.map(k => (
                                    <div key={k.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-black text-lg text-slate-800">{k.title}</h4>
                                            <span className="text-[10px] text-slate-400 font-bold">{new Date(k.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-slate-600 mb-2 whitespace-pre-wrap">{k.content}</p>
                                        <div className="flex items-center gap-2 mt-4">
                                            <div className="flex -space-x-2">
                                                {/* Mock Read Users - In real app, fetch read status */}
                                                <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>
                                                <div className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white"></div>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-bold">その他 {k.readCount}人が確認済み</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    );
                }
                return (
                    <CommunityPanel
                        user={user}
                        myCommunities={myCommunities}
                        onCreateCommunity={() => setIsCreatingCommunityState(true)}
                        onJoinCommunity={() => { }} // TODO: Implement
                        onSelectCommunity={setSelectedCommunity}
                    />
                );
            case 'feed':
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* Chokai Leader Panel */}
                        {user.role === 'chokai_leader' && (
                            <div className="bg-emerald-600 rounded-[2rem] p-6 text-white shadow-xl shadow-emerald-200 cursor-pointer hover:bg-emerald-700 transition-all" onClick={() => setActiveTab('chokai')}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><i className="fas fa-bullhorn text-2xl"></i></div>
                                    <div>
                                        <h3 className="font-black">町会長パネル</h3>
                                        <p className="text-xs opacity-80">ここから回覧板を作成・配信できます</p>
                                    </div>
                                    <i className="fas fa-arrow-right ml-auto"></i>
                                </div>
                            </div>
                        )}

                        {/* Posting Trigger */}
                        {!isPosting && (
                            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 mb-6 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setIsPosting(true)}>
                                <img src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest'} className="w-10 h-10 rounded-full border border-slate-200" alt="avatar" />
                                <div className="flex-1 bg-slate-100 h-10 rounded-full flex items-center px-4 text-slate-400 font-bold text-sm">
                                    地域の出来事をシェアしよう...
                                </div>
                                <button className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center hover:bg-indigo-100 transition-colors">
                                    <i className="fas fa-image"></i>
                                </button>
                            </div>
                        )}

                        {/* Posting Modal */}
                        {isPosting && (
                            <div className="bg-white border-2 border-indigo-500 rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 mb-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                                        <i className="fas fa-pen-fancy text-indigo-500"></i> 投稿を作成
                                    </h3>
                                    <button onClick={() => setIsPosting(false)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-200"><i className="fas fa-times"></i></button>
                                </div>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!newPost.title || !newPost.content) return;
                                    const postPayload = {
                                        userId: user.id,
                                        userName: user.nickname,
                                        userAvatar: user.avatar,
                                        category: newPost.category,
                                        area: selectedAreas[0],
                                        title: newPost.title,
                                        content: newPost.content,
                                        imageUrl: newPost.imageUrl
                                    };
                                    const { data, error } = await createPost(postPayload);
                                    if (!error && data) {
                                        // Update Local
                                        const created: Post = {
                                            id: (data[0] as any).id,
                                            ...postPayload,
                                            likes: 0,
                                            comments: [],
                                            createdAt: new Date().toISOString()
                                        };
                                        setPosts([created, ...posts]);
                                        addToast('投稿しました', 'success');
                                        setIsPosting(false);
                                        setNewPost({ title: '', content: '', category: 'general', area: '', imageUrl: '' });
                                        addScore(5);
                                    }
                                }} className="space-y-4">
                                    <input type="text" placeholder="タイトル" className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-black text-lg" value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })} autoFocus />
                                    <textarea placeholder="内容を入力..." className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none min-h-[120px] font-medium resize-none" value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} />
                                    <button type="submit" disabled={!newPost.title || !newPost.content} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 disabled:bg-slate-200 disabled:cursor-not-allowed">
                                        <i className="fas fa-paper-plane"></i> 投稿する
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Post Feed */}
                        <div className="space-y-4">
                            {isLoading ? <PostSkeleton /> : (
                                posts.length === 0 ? (
                                    <EmptyState title="まだ投稿がありません" description="この地域の最初の投稿を作成してみましょう！" />
                                ) : (
                                    posts.map(post => <PostCard key={post.id} post={post} currentUser={user} onLike={handleLikePost} onAddComment={handleAddComment} />)
                                )
                            )}
                        </div>
                    </div>
                );
            case 'chokai':
                return (
                    <>
                        {isCreatingMission && (
                            <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                                <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-black text-xl text-slate-800">お手伝いミッション作成</h3>
                                        <button onClick={() => setIsCreatingMission(false)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center"><i className="fas fa-times"></i></button>
                                    </div>
                                    <form onSubmit={handleCreateMission} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-500 mb-1">タイトル</label>
                                            <input type="text" placeholder="例: 公園の清掃" className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none" value={newMission.title} onChange={e => setNewMission({ ...newMission, title: e.target.value })} required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-500 mb-1">詳細</label>
                                            <textarea placeholder="活動内容の詳細を入力してください" className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none min-h-[100px]" value={newMission.description} onChange={e => setNewMission({ ...newMission, description: e.target.value })} required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-500 mb-1">日時</label>
                                            <input type="datetime-local" className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none" value={newMission.date} onChange={e => setNewMission({ ...newMission, date: e.target.value })} required />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-500 mb-1">最大人数</label>
                                                <input type="number" placeholder="5" className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none" value={newMission.maxParticipants} onChange={e => setNewMission({ ...newMission, maxParticipants: parseInt(e.target.value) })} required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-500 mb-1">ポイント</label>
                                                <input type="number" placeholder="50" className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none" value={newMission.points} onChange={e => setNewMission({ ...newMission, points: parseInt(e.target.value) })} required />
                                            </div>
                                        </div>
                                        <button type="submit" className="w-full bg-rose-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all active:scale-[0.98]">作成</button>
                                    </form>
                                </div>
                            </div>
                        )}
                        <ChokaiPanel
                            kairanbans={kairanbans}
                            missions={missions}
                            onReadKairanban={async (id, p) => {
                                // Persist to DB
                                if (user) {
                                    await markKairanbanAsRead(user.id, id);
                                    addScore(p);
                                    setKairanbans(prev => prev.map(k => k.id === id ? { ...k, isRead: true, readCount: k.readCount + 1 } : k));
                                    setReadKairanbanIds(prev => new Set(prev).add(id));
                                }
                            }}
                            onJoinMission={handleJoinMission}
                            selectedAreas={selectedAreas}
                            userRole={user.role}
                            onOpenCreateMission={() => setIsCreatingMission(true)}
                            myCommunities={myCommunities}
                            joinedMissionIds={joinedMissionIds}
                        />
                    </>
                );
            case 'coupons':
                return (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
                        <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl shadow-xl shadow-orange-200 flex items-center justify-center text-4xl text-white mb-6">
                            <i className="fas fa-ticket-alt"></i>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Coming Soon</h3>
                        <p className="text-slate-500 font-bold mb-8">地域クーポン機能は現在準備中です</p>
                    </div>
                );
            case 'business':
                return <BusinessPanel user={user} onRegisterCoupon={handleRegisterCoupon} myCoupons={coupons.filter(c => c.shopName === user.shopName)} />;
            case 'admin':
                return user.role === 'admin' ? <AdminDashboard currentUser={user} onAddToast={addToast} /> : <div className="p-8 text-center font-bold text-slate-400">Access Denied</div>;
            case 'profile':
                return (
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm space-y-8 animate-in slide-in-from-right">
                        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                            <img src={user.avatar} className="w-24 h-24 rounded-3xl shadow-lg" alt="avatar" />
                            <div>
                                <h2 className="text-3xl font-black text-slate-800 mb-1">{user.nickname}</h2>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold">住民ランク: {user.level}</span>
                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">ID: {user.id.substring(0, 8)}</span>
                                </div>
                                <button onClick={() => setIsEditingProfile(true)} className="mt-4 text-emerald-600 text-sm font-bold flex items-center gap-2 hover:underline">
                                    <i className="fas fa-pen"></i> プロフィールを編集
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-slate-800">マイエリア設定</h3>
                            <button onClick={() => setIsAreaModalOpen(true)} className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-slate-700 transition flex items-center gap-2">
                                <i className="fas fa-plus"></i> エリア追加
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {selectedAreas.map(area => (
                                <span key={area} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-full text-sm">
                                    {area}
                                    <button onClick={async () => {
                                        const newAreas = selectedAreas.filter(a => a !== area);
                                        setSelectedAreas(newAreas);
                                        const updated = { ...user, selectedAreas: newAreas };
                                        await createProfile(updated);
                                        setUser(updated);
                                    }} className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200"><i className="fas fa-times text-xs"></i></button>
                                </span>
                            ))}
                        </div>

                        <div className="pt-8 border-t border-slate-100">
                            <button onClick={() => {
                                if (window.confirm('ログアウトしますか？')) {
                                    logout();
                                    router.replace('/');
                                }
                            }} className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-colors">ログアウト</button>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <Layout
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userRole={user.role}
            userNickname={user.nickname}
            userAvatar={user.avatar}
            onClickProfile={() => setActiveTab('profile')}
            onLogout={() => {
                if (window.confirm('ログアウトしますか？')) {
                    logout();
                    router.replace('/');
                }
            }}
            score={score}
            selectedAreas={selectedAreas}
        >
            {showScorePopup.show && (
                <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-500">
                    <div className="bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 font-black border-2 border-emerald-500/30">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs"><i className="fas fa-plus"></i></div>
                        <span className="tracking-tight">LOCAL SCORE +{showScorePopup.amount}!</span>
                    </div>
                </div>
            )}
            <Toast toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

            {/* Community Creation Modal */}
            {isCreatingCommunityState && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-xl text-slate-800">新しいコミュニティを作成</h3>
                            <button onClick={() => setIsCreatingCommunityState(false)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-colors">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleCreateCommunity} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">コミュニティ名</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold border-none outline-none focus:ring-2 ring-emerald-200"
                                    placeholder="例: 大宮駅前清掃隊"
                                    value={newCommunity.name}
                                    onChange={e => setNewCommunity({ ...newCommunity, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">説明</label>
                                <textarea
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold border-none outline-none focus:ring-2 ring-emerald-200 min-h-[100px]"
                                    placeholder="活動内容や目的を入力してください"
                                    value={newCommunity.description}
                                    onChange={e => setNewCommunity({ ...newCommunity, description: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer" onClick={() => setNewCommunity({ ...newCommunity, isSecret: !newCommunity.isSecret })}>
                                <div className={`w-10 h-6 rounded-full relative transition-colors ${newCommunity.isSecret ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${newCommunity.isSecret ? 'left-5' : 'left-1'}`}></div>
                                </div>
                                <span className="text-sm font-bold text-slate-600">非公開（招待制）にする</span>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-emerald-500 text-white rounded-xl font-black shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all mt-4"
                            >
                                <i className="fas fa-plus mr-2"></i> 作成する
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {renderContent()}
            {isSettingsModalOpen && selectedCommunity && user && (
                <CommunitySettingsModal
                    community={selectedCommunity}
                    currentUser={user}
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    onAddToast={addToast}
                />
            )}
            <DebugPanel />
            <AreaSelectModal isOpen={isAreaModalOpen} onClose={() => setIsAreaModalOpen(false)} onAdd={handleAreaAdd} />
        </Layout>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <DashboardContent />
        </Suspense>
    );
}
