import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';

import PostCard from '../components/PostCard';
import CouponList from '../components/CouponList';
import ChokaiPanel from '../components/ChokaiPanel';
import CommunityPanel from '../components/CommunityPanel';
import BusinessPanel from '../components/BusinessPanel';
import LandingPage from '../components/LandingPage';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLineLogin } from '../hooks/useLineLogin';
import { useDashboardData } from '../hooks/useDashboardData';
import { SAITAMA_MUNICIPALITIES, MUNICIPALITY_COORDINATES, MOCK_KAIRANBAN, MOCK_MISSIONS, MOCK_COUPONS, INITIAL_POSTS } from '../constants';
import { supabase, getPosts, createPost, createKairanbanWithNotification, registerLocalCoupon, createProfile, createCommunity, joinCommunity, getProfile, getKairanbans, getCoupons, getMissions, createMission, joinMission, addComment, toggleLike } from '../services/supabaseService';
import { summarizeLocalFeed } from '../services/geminiService';

import { PostSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Toast, { ToastMessage } from '../components/Toast';
import AreaSelectModal from '../components/AreaSelectModal';

import AreaSelectModal from '../components/AreaSelectModal';
import { getMyHouseholds, Household } from '../services/householdService';
import { getMyReadStatus, KairanbanRead } from '../services/kairanbanService';
import KairanbanCard from '../components/KairanbanCard';
import SafetyCheckModal from '../components/SafetyCheckModal';

const Dashboard: React.FC = () => {
  const {
    user,
    setUser,
    tempUser,
    setTempUser,
    isLoading: isAuthLoading,
    isAuthChecking,
    logout,
    revalidateProfile,
    checkSession
  } = useAuth();

  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.initialTab || 'chokai');

  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [score, setScore] = useState(150);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(['三郷市']);
  const [isPosting, setIsPosting] = useState(false);
  const [isCreatingMission, setIsCreatingMission] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'notice' as PostCategory, area: '', imageUrl: '' });
  const [newMission, setNewMission] = useState({ title: '', description: '', points: 50, area: '', date: '', maxParticipants: 5 });
  const [isBroadcasting, setIsBroadcasting] = useState(false);


  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false); // New state
  const [showScorePopup, setShowScorePopup] = useState<{ show: boolean, amount: number }>({ show: false, amount: 0 });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);



  // New States

  // New States


  // Pagination
  const [page, setPage] = useState(0);


  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const {
    posts, setPosts,
    kairanbans, setKairanbans,
    missions, setMissions,
    coupons, setCoupons,
    myCommunities, setMyCommunities,
    households, setHouseholds,
    myReads, setMyReads,
    isLoading, loadingMore, hasMore,
    fetchData, refreshReads, refreshCommunities
  } = useDashboardData(user, selectedAreas, addToast);


  // ...

  // Inside renderContent for community or feed tab:
  // Replace the map(k => <div>...</div>) with:
  /* 
    {communityKairanbans.length === 0 ? (...) : (
        communityKairanbans.map(k => (
            <KairanbanCard 
                key={k.id} 
                kairanban={k} 
                currentUser={user} 
                households={households} 
                myReads={myReads.filter(r => r.kairanban_id === k.id)} 
                onReadUpdate={refreshReads} 
            />
        ))
    )}
  */


  useEffect(() => {
    setPage(0);
    if (user) {
      fetchData(0, true);
    }
  }, [user, selectedAreas, fetchData]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage);
    }
  };

  // Separate effect for communities to allow independent refresh


  const [publicCommunity, setPublicCommunity] = useState<Community | null>(null);

  // URLからの招待コードチェック
  useEffect(() => {
    // 1. Check URL params (legacy or direct link)
    const params = new URLSearchParams(window.location.search);
    const inviteCodeParam = params.get('invite');

    // 2. Check LocalStorage (from CommunityInvite page flow)
    const pendingCode = localStorage.getItem('pendingInviteCode');

    // Priority: Pending Code (fresh login) > URL Param
    const inviteCode = pendingCode || inviteCodeParam;

    if (inviteCode) {
      // Clear pending code to prevent loop
      if (pendingCode) localStorage.removeItem('pendingInviteCode');

      import('../services/supabaseService').then(({ getCommunityByInviteCode, joinCommunity }) => {
        getCommunityByInviteCode(inviteCode).then(async ({ data }) => {
          if (data) {
            // If user is logged in, auto-join
            if (user) {
              const { error } = await joinCommunity(data.id, user.id);
              if (!error) {
                addToast(`${data.name}に参加しました！`, 'success');
                // Refresh communities
                import('../services/supabaseService').then(({ getMyCommunities }) => {
                  getMyCommunities(user.id).then(({ data: myCommData }) => {
                    if (myCommData) setMyCommunities(myCommData);
                  });
                });
              } else {
                // Already joined or error
                addToast(`${data.name}を表示します`, 'info');
              }
              // Set as active
              const comm: Community = {
                id: data.id,
                name: data.name,
                description: data.description,
                ownerId: data.owner_id,
                inviteCode: data.invite_code,
                membersCount: data.members_count || 1,
                isSecret: data.is_secret,
                imageUrl: data.image_url
              };
              setSelectedCommunity(comm);
              setActiveTab('community');
            } else {
              // Not logged in -> Show public preview (this logic might be redundant if we have /invite page, 
              // but good for legacy links handled by Dashboard)
              const comm: Community = {
                id: data.id,
                name: data.name,
                description: data.description,
                ownerId: data.owner_id,
                inviteCode: data.invite_code,
                membersCount: data.members_count || 1,
                isSecret: data.is_secret,
                imageUrl: data.image_url
              };
              setPublicCommunity(comm);
            }
          }
        });
      });
    }
  }, [user]); // Re-run when user logs in

  /* LINE Login Callback Handler removed, handled by /auth/callback route */



  const { login: lineLogin } = useLineLogin(); // Use hook



  // LINE Login (Delegated to hook)
  const handleLineLogin = (role: 'resident' | 'chokai_leader' | 'business' = 'resident') => {
    lineLogin(role);
  };


  const handleRegistrationComplete = async (nickname: string, areas: string[]) => {
    // Use 'user' if available (editing), otherwise use 'tempUser' (new registration)
    const targetUser = user || tempUser;

    if (targetUser) {
      const updatedUser = { ...targetUser, nickname, selectedAreas: areas };

      // Attempt to save to Supabase
      const { error } = await createProfile(updatedUser);

      if (error) {
        console.error('Registration/Update failed on server:', error);
        // Fallback: If it's an RLS issue or Guest mode, allow local proceed anyway
        addToast('サーバーへの保存に失敗しましたが、続行します', 'info');
      } else {
        addToast(user ? 'プロフィールを更新しました' : '登録が完了しました！', 'success');
      }

      // Always update local state to unblock user
      setUser(updatedUser);
      setTempUser(null); // Clear temp state
      setSelectedAreas(areas);
      setIsEditingProfile(false);

      // Update local storage for persistence
      localStorage.setItem('saitama_user_nickname', nickname);
      localStorage.setItem('saitama_user_profile', JSON.stringify(updatedUser));
    }
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

  // 事前登録フロー（情報入力 -> LINE認証）
  const handlePreRegister = (nickname: string, areas: string[]) => {
    localStorage.setItem('pendingRegistration', JSON.stringify({ nickname, areas }));
    handleLineLogin('resident');
  };

  const addScore = (amount: number) => {
    setScore(prev => prev + amount);
    setShowScorePopup({ show: true, amount });
    setTimeout(() => setShowScorePopup({ show: false, amount: 0 }), 2000);
  };

  const handleAddComment = async (postId: string, content: string) => {
    if (!user) return;
    try {
      await addComment({ postId, userId: user.id, content });
      addToast('コメントを送信しました', 'success');
    } catch (e) {
      console.error(e);
      addToast('送信に失敗しました', 'error');
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;
    addScore(2);
    toggleLike(postId, user.id);
  };

  const handleCreateKairanban = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBroadcasting(true);

    const kairanPayload = {
      title: newPost.title,
      content: newPost.content,
      area: newPost.area,
      author: user?.nickname,
      sent_to_line: true,
      communityId: selectedCommunity?.id,
      communityName: selectedCommunity?.name
    };

    const { data, error } = await createKairanbanWithNotification(kairanPayload);

    if (!error && data && data.length > 0) {
      const newKairan: Kairanban = {
        id: data[0].id,
        title: data[0].title,
        content: data[0].content,
        // date removed as it causes type error and is not used
        area: data[0].area || selectedCommunity?.name,
        author: data[0].author,
        points: data[0].points || 0,
        readCount: 0,
        isRead: false,
        sentToLine: data[0].sent_to_line || false,
        createdAt: data[0].created_at,
        category: 'notice',
        communityId: data[0].community_id
      };
      setKairanbans([newKairan, ...kairanbans]);
      addScore(50);
      setIsPosting(false);
      setNewPost({ title: '', content: '', category: 'notice', area: '', imageUrl: '' });
    }
    setIsBroadcasting(false);
  };

  const handleRegisterCoupon = async (coupon: Coupon) => {
    const { data, error } = await registerLocalCoupon(coupon);
    if (!error && data) {
      const newCoupon = { ...coupon, id: data[0].id }; // ID from DB
      setCoupons([newCoupon, ...coupons]);
      addScore(100);
    }
  };

  // Registration / Profile Editing
  // Registration Guard
  if (tempUser || (user && (!user.nickname || !user.isVerified))) {
    return <Navigate to="/onboarding" replace />;
  }

  // ---------------------------------------------------------
  // Render Guards (Must be after all hooks)
  // ---------------------------------------------------------

  // 1. Loading Guard
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // 2. Auth Guard
  // Redirect strictly if not logged in
  if (!user) {
    return <Navigate to="/" replace />;
  }
  // Actually, Dashboard is protected? No, App.tsx has no protection yet. 
  // Let's add a redirect effect here just in case.



  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    const missionPayload = {
      ...newMission,
      area: selectedAreas[0] // Default to first selected area for now
    };

    const { data, error } = await createMission(missionPayload);
    if (!error && data) {
      const created: VolunteerMission = {
        id: data[0].id,
        title: data[0].title,
        description: data[0].description,
        points: data[0].points,
        area: data[0].area,
        date: data[0].date,
        currentParticipants: 0,
        maxParticipants: data[0].max_participants
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

  // 残りのレンダリングロジックは以前と同様
  const renderContent = () => {
    switch (activeTab) {
      case 'community':
        // ... (keep existing community case logic)
        if (selectedCommunity) {
          // コミュニティ詳細画面
          const communityKairanbans = kairanbans.filter(k => (k as any).communityId === selectedCommunity.id);

          return (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              {/* ヘッダー */}
              <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                <button
                  onClick={() => setSelectedCommunity(null)}
                  className="absolute top-6 left-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors backdrop-blur-sm"
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <div className="mt-8">
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-black tracking-widest mb-2 backdrop-blur-sm">VIP COMMUNITY</span>
                  <h2 className="text-3xl font-black mb-2">{selectedCommunity.name}</h2>
                  <p className="opacity-80 font-bold text-sm mb-6">{selectedCommunity.description}</p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/invite/${selectedCommunity.inviteCode}`; // Update URL format
                        navigator.clipboard.writeText(url);
                        addToast(`招待リンクをコピーしました！`, 'success');
                      }}
                      className="flex-1 py-3 bg-white text-indigo-600 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                    >
                      <i className="fas fa-share-alt"></i> 招待する
                    </button>
                    <button
                      onClick={() => {
                        setIsPosting(true);
                        setNewPost({ ...newPost, category: 'chokai', area: selectedCommunity.name });
                      }}
                      className="flex-1 py-3 bg-indigo-800/50 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-800/70 transition-colors border border-white/10"
                    >
                      <i className="fas fa-bullhorn"></i> 回覧板作成
                    </button>
                  </div>
                </div>
              </div>

              {/* 投稿フォーム (コミュニティ用) */}
              {isPosting && (
                <div className="bg-white border-2 border-indigo-500 rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                      <i className="fab fa-line text-[#06C755]"></i> メンバーへ一斉配信
                    </h3>
                    <button onClick={() => setIsPosting(false)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center"><i className="fas fa-times"></i></button>
                  </div>
                  <form onSubmit={async (e) => {
                    // コミュニティ用の投稿ハンドラ
                    e.preventDefault();
                    if (!newPost.title || !newPost.content) return;

                    const kairanPayload = {
                      title: newPost.title,
                      content: newPost.content,
                      area: selectedCommunity.name,
                      author: user?.nickname || '管理者',
                      sent_to_line: true,
                      communityId: selectedCommunity.id
                    };

                    const { data, error } = await createKairanbanWithNotification(kairanPayload);

                    if (!error && data) {
                      const newKairan = {
                        id: data[0].id,
                        title: data[0].title,
                        content: data[0].content,
                        area: selectedCommunity.name,
                        author: user?.nickname || '管理者',
                        points: 20,
                        readCount: 0,
                        isRead: false,
                        sentToLine: true,
                        createdAt: new Date().toISOString(),
                        communityId: selectedCommunity.id
                      };
                      setKairanbans([newKairan as any, ...kairanbans]);
                      setIsPosting(false);
                      setNewPost({ title: '', content: '', category: 'notice', area: '', imageUrl: '' });
                      addToast(`${selectedCommunity.membersCount}人のLINEに配信しました！`, 'success');
                    } else {
                      console.error(error);
                      addToast('配信に失敗しました', 'error');
                    }
                  }} className="space-y-4">
                    {/* ... form content ... */}
                    <p className="text-sm font-bold text-slate-500 bg-slate-50 p-4 rounded-xl">
                      <i className="fas fa-info-circle mr-2"></i>
                      「{selectedCommunity.name}」に参加している{selectedCommunity.membersCount}名のLINEに通知が届きます。
                    </p>
                    <input type="text" placeholder="タイトル" className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-black" value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })} />
                    <textarea placeholder="連絡事項を入力..." className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none min-h-[150px] font-medium" value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} />
                    <button type="submit" disabled={!newPost.title} className="w-full bg-[#06C755] text-white font-black py-5 rounded-2xl shadow-xl hover:bg-[#05b34c] transition-all flex items-center justify-center gap-3 disabled:bg-slate-200">
                      <i className="fab fa-line text-2xl"></i> 一斉送信
                    </button>
                  </form>
                </div>
              )}

              {/* タイムライン */}
              <div className="space-y-4">
                <h3 className="font-black text-slate-400 text-sm px-4">最近のお知らせ</h3>
                {/* ... list ... */}
                {communityKairanbans.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-100">
                    <p className="text-slate-400 font-bold">まだお知らせはありません</p>
                  </div>
                ) : (
                  communityKairanbans.map(k => (
                    <KairanbanCard
                      key={k.id}
                      kairanban={k}
                      currentUser={user}
                      households={households}
                      myReads={myReads.filter(r => r.kairanban_id === k.id)}
                      onReadUpdate={refreshReads}
                    />
                  ))
                )}
              </div>
            </div>
          );
        }
        return (
          <CommunityPanel
            user={user}
            myCommunities={myCommunities}
            onCreateCommunity={async (name, desc, isSecret) => {
              const inviteCode = Math.random().toString(36).substring(7);
              const newCommPayload = {
                name,
                description: desc,
                ownerId: user.id,
                imageUrl: '',
                isSecret,
                inviteCode
              };

              const { data, error } = await createCommunity(newCommPayload);

              if (!error && data) {
                const newComm: Community = {
                  id: data.id,
                  name: data.name,
                  description: data.description,
                  ownerId: data.owner_id,
                  inviteCode: data.invite_code,
                  membersCount: 1,
                  isSecret: data.is_secret
                };

                // Auto-join the creator
                await joinCommunity(data.id, user.id);
                setMyCommunities([...myCommunities, newComm]);
                addToast('コミュニティを作成しました！', 'success');
              } else {
                console.error(error);
                addToast('コミュニティの作成に失敗しました', 'error');
              }
            }}
            onJoinCommunity={(code) => {
              // Also fix dynamic import here
              import('../services/supabaseService').then(async ({ getCommunityByInviteCode, joinCommunity }) => {
                // First find the community
                const { data: commData, error: findError } = await getCommunityByInviteCode(code);

                if (findError || !commData) {
                  addToast('無効な招待コードです', 'error');
                  return;
                }

                // Check if already joined
                if (myCommunities.some(c => c.id === commData.id)) {
                  addToast('既に参加しています', 'info');
                  return;
                }

                // Join
                const { error: joinError } = await joinCommunity(commData.id, user.id);

                if (!joinError) {
                  const newComm: Community = {
                    id: commData.id,
                    name: commData.name,
                    description: commData.description,
                    ownerId: commData.owner_id,
                    inviteCode: commData.invite_code,
                    membersCount: commData.members_count + 1, // Optimistic update
                    isSecret: commData.is_secret
                  };
                  setMyCommunities([...myCommunities, newComm]);
                  addToast(`${newComm.name}に参加しました！`, 'success');
                } else {
                  console.error(joinError);
                  addToast('参加に失敗しました', 'error');
                }
              });
            }}
            onSelectCommunity={setSelectedCommunity}
          />
        );
      case 'feed':
        // ... (keep feed logic)
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* ... */}
            {user.role === 'chokai_leader' && !isPosting && (
              <div className="bg-emerald-600 rounded-[2rem] p-6 text-white shadow-xl shadow-emerald-200">
                {/* ... */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <i className="fab fa-line text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="font-black">町会長パネル (Push Enabled)</h3>
                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Connected to Supabase Functions</p>
                  </div>
                </div>
                <button onClick={() => setIsPosting(true)} className="w-full bg-white text-emerald-600 font-black py-4 rounded-2xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2">
                  <i className="fas fa-bullhorn"></i> LINE一斉通知を送信する
                </button>
              </div>
            )}

            {/* Safety Check Button (Testing or Emergency) */}
            <div className={`p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between mb-2 cursor-pointer transition-colors ${isSafetyModalOpen ? 'bg-red-50 border-red-200' : 'bg-white hover:bg-slate-50'}`} onClick={() => setIsSafetyModalOpen(true)}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
                  <i className={`fas fa-broadcast-tower ${!isSafetyModalOpen && 'animate-pulse'}`}></i>
                </div>
                <div>
                  <h4 className="font-black text-slate-700">安否確認・訓練</h4>
                  <p className="text-xs text-slate-400 font-bold">家族の安否状況を報告する</p>
                </div>
              </div>
              <div className="text-red-500 bg-red-50 px-4 py-2 rounded-full font-black text-xs">
                報告する
              </div>
            </div>

            {/* General Post Creation Button */}
            {!isPosting && (
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 mb-6 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setIsPosting(true)}>
                <img src={user.avatar} className="w-10 h-10 rounded-full border border-slate-200" alt="avatar" />
                <div className="flex-1 bg-slate-100 h-10 rounded-full flex items-center px-4 text-slate-400 font-bold text-sm">
                  地域の出来事をシェアしよう...
                </div>
                <button className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center hover:bg-indigo-100 transition-colors">
                  <i className="fas fa-image"></i>
                </button>
              </div>
            )}

            {/* General Post Creation Modal */}
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
                    category: newPost.category as any,
                    area: selectedAreas[0], // Default to primary area
                    title: newPost.title,
                    content: newPost.content,
                    imageUrl: newPost.imageUrl
                  };

                  const { data, error } = await createPost(postPayload);

                  if (!error && data) {
                    const createdPost: Post = {
                      id: data[0].id,
                      ...postPayload,
                      likes: 0,
                      comments: [],
                      createdAt: new Date().toISOString()
                    };
                    setPosts([createdPost, ...posts]);
                    setIsPosting(false);
                    setNewPost({ title: '', content: '', category: 'general', area: '', imageUrl: '' });
                    addToast('投稿しました！', 'success');
                    addScore(5); // 投稿ボーナス
                  } else {
                    console.error('Post creation failed:', error);
                    // Check if error is RLS related (403, 401)
                    if (error?.code === '42501' || error?.message?.includes('violates row level security')) {
                      addToast('投稿権限がありません。再ログインしてください。', 'error');
                      // Force session check checkSession() might be useful here if we had access to it easily, 
                      // but let's just log it.
                    } else {
                      addToast(`投稿に失敗しました: ${error?.message || '不明なエラー'}`, 'error');
                    }
                  }
                }} className="space-y-4">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {['general', 'event', 'safety', 'marketplace', 'notice'].map(cat => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setNewPost({ ...newPost, category: cat })}
                        className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all ${newPost.category === cat ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                        {cat === 'general' && '雑談'}
                        {cat === 'event' && 'イベント'}
                        {cat === 'safety' && '防犯・防災'}
                        {cat === 'marketplace' && '譲ります'}
                        {cat === 'notice' && 'お知らせ'}
                      </button>
                    ))}
                  </div>
                  <input type="text" placeholder="タイトル" className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-black text-lg" value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })} autoFocus />
                  <textarea placeholder="内容を入力..." className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none min-h-[120px] font-medium resize-none" value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} />

                  {/* Image URL Input (Simplified for mock) */}
                  <div className="flex items-center gap-2 bg-slate-50 px-5 py-3 rounded-2xl">
                    <i className="fas fa-link text-slate-400"></i>
                    <input type="text" placeholder="画像URL (任意)" className="w-full bg-transparent outline-none text-sm font-bold text-slate-600" value={newPost.imageUrl || ''} onChange={e => setNewPost({ ...newPost, imageUrl: e.target.value })} />
                  </div>

                  <button type="submit" disabled={!newPost.title || !newPost.content} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 disabled:bg-slate-200 disabled:cursor-not-allowed">
                    <i className="fas fa-paper-plane"></i> 投稿する
                  </button>
                </form>
              </div>
            )}

            {isPosting && user.role === 'chokai_leader' && (
              <div className="mb-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-800 mb-2">💡 町会長メニュー</p>
                <button onClick={() => { /* Switch mode logic if needed, or just keep separate */ }} className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg">
                  回覧板作成モードに切り替え
                </button>
              </div>
            )}

            <div className="space-y-4">
              {/* Post List */}
              {isLoading ? <PostSkeleton /> : (
                posts.length === 0 ? (
                  <EmptyState
                    title="まだ投稿がありません"
                    description="この地域の最初の投稿を作成してみましょう！"
                  />
                ) : (
                  <>
                    {posts.map(post => <PostCard key={post.id} post={post} currentUser={user} onLike={handleLikePost} onAddComment={handleAddComment} />)}
                    {hasMore && (
                      <div className="flex justify-center mt-6 mb-12">
                        <button
                          onClick={loadMore}
                          disabled={loadingMore}
                          className="px-6 py-2 bg-slate-100 text-slate-600 rounded-full font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
                        >
                          {loadingMore ? '読み込み中...' : 'もっと見る'}
                        </button>
                      </div>
                    )}
                  </>
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
                    <input type="text" placeholder="ミッション名 (例: 公園の清掃)" required className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-black" value={newMission.title} onChange={e => setNewMission({ ...newMission, title: e.target.value })} />
                    <textarea placeholder="内容の詳細..." required className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none min-h-[100px] font-medium" value={newMission.description} onChange={e => setNewMission({ ...newMission, description: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="開催日 (例: 12/30 10:00)" required className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none" value={newMission.date} onChange={e => setNewMission({ ...newMission, date: e.target.value })} />
                      <input type="number" placeholder="最大人数" required className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none" value={newMission.maxParticipants} onChange={e => setNewMission({ ...newMission, maxParticipants: parseInt(e.target.value) })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" placeholder="付与ポイント" required className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none" value={newMission.points} onChange={e => setNewMission({ ...newMission, points: parseInt(e.target.value) })} />
                      <div className="flex items-center justify-center font-bold text-slate-400 bg-slate-50 rounded-2xl">
                        エリア: {selectedAreas[0]}
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-rose-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-rose-500 transition-all">作成する</button>
                  </form>
                </div>
              </div>
            )}
            <ChokaiPanel
              kairanbans={kairanbans}
              missions={missions}
              onReadKairanban={(id, p) => addScore(p)}
              onJoinMission={handleJoinMission}
              selectedAreas={selectedAreas}
              userRole={user?.role}
              onOpenCreateMission={() => setIsCreatingMission(true)}
              myCommunities={myCommunities}
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
            <div className="px-6 py-3 bg-slate-50 rounded-2xl text-slate-400 font-bold border-2 border-slate-100 border-dashed">
              楽しみにお待ちください！ 🎁
            </div>
          </div>
        );
      case 'business':
        return <BusinessPanel user={user} onRegisterCoupon={handleRegisterCoupon} myCoupons={coupons.filter(c => c.shopName === user.shopName)} />;
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'profile':
        // ... (keep profile logic)
        return (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm space-y-8 animate-in slide-in-from-right">
            {/* ... */}
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
              <button
                onClick={() => {
                  if (!navigator.geolocation) {
                    addToast('位置情報がサポートされていません', 'error');
                    return;
                  }
                  addToast('位置情報を取得中...', 'info');
                  navigator.geolocation.getCurrentPosition(async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    let nearest = '';
                    let minDistance = Infinity;

                    Object.entries(MUNICIPALITY_COORDINATES).forEach(([name, coords]) => {
                      const dist = Math.sqrt(Math.pow(coords.lat - latitude, 2) + Math.pow(coords.lon - longitude, 2));
                      if (dist < minDistance) {
                        minDistance = dist;
                        nearest = name;
                      }
                    });

                    if (nearest) {
                      if (!selectedAreas.includes(nearest)) {
                        const newAreas = [...selectedAreas, nearest];
                        setSelectedAreas(newAreas);

                        // Sync with Database immediately
                        if (user) {
                          const updatedUser = { ...user, selectedAreas: newAreas };
                          // Use createsProfile which is actually an UPSERT
                          const { error } = await createProfile(updatedUser);
                          if (!error) {
                            setUser(updatedUser);
                            addToast(`${nearest}をマイエリアに追加しました`, 'success');
                          } else {
                            console.error('Location Save Error:', error);
                            addToast(`${nearest}を追加しましたが、保存に失敗しました`, 'error');
                          }
                        } else {
                          addToast(`${nearest}を追加しました（ログイン後に保存されます）`, 'success');
                        }
                      } else {
                        addToast(`${nearest}は既にマイエリアです`, 'info');
                      }
                    }
                  }, (err) => {
                    console.error(err);
                    addToast('位置情報の取得に失敗しました: ' + err.message, 'error');
                  }, { enableHighAccuracy: true, timeout: 10000 });
                }}
                className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-slate-700 transition flex items-center gap-2"
              >
                <i className="fas fa-map-marker-alt"></i> 現在地から追加
              </button>
            </div>

            {/* Selected Areas Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedAreas.length === 0 && <p className="text-slate-400 text-sm font-bold">まだエリアが設定されていません</p>}
              {selectedAreas.map(area => (
                <span key={area} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-full text-sm animate-in zoom-in">
                  {area}
                  <button
                    onClick={async () => {
                      const newAreas = selectedAreas.filter(a => a !== area);
                      setSelectedAreas(newAreas);
                      // DB Sync Logic
                      if (user) {
                        const updatedUser = { ...user, selectedAreas: newAreas };
                        await createProfile(updatedUser);
                        setUser(updatedUser);
                        addToast(`${area}を解除しました`, 'info');
                      }
                    }}
                    className="w-5 h-5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-600 flex items-center justify-center transition"
                    aria-label={`${area}を削除`}
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                </span>
              ))}
            </div>

            {/* Add Area Button (Using New AreaSelectModal) */}
            <button
              onClick={() => setIsAreaModalOpen(true)}
              className="w-full bg-slate-50 p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 transition-all text-slate-500 hover:text-emerald-600 font-bold flex items-center justify-center gap-2 mb-6"
            >
              <i className="fas fa-plus-circle"></i>
              新しいエリアを追加
            </button>

            <div className="bg-emerald-50 rounded-xl p-4 mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#06C755] rounded-full flex items-center justify-center text-white text-xl">
                  <i className="fab fa-line"></i>
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-700">埼玉BASE公式アカウント</p>
                  <p className="text-[10px] text-slate-500">最新情報やクーポンを受け取る</p>
                </div>
              </div>
              <a
                href="https://line.me/R/ti/p/@357rcjnp"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#06C755] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#05b34c] transition-colors"
              >
                友だち追加
              </a>
            </div>

            {/* Notification Settings */}
            <div className="border-t border-slate-100 pt-8 mb-8">
              <h3 className="text-xl font-black text-slate-800 mb-6">通知設定</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-700">新着情報の通知</p>
                    <p className="text-xs text-slate-400">マイエリアの投稿通知をLINEで受け取る</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked onChange={() => addToast('通知設定を更新しました', 'success')} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06C755]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-700">重要なお知らせ</p>
                    <p className="text-xs text-slate-400">自治体からの防災・防犯情報</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked disabled />
                    <div className="w-11 h-6 bg-[#06C755]/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06C755] cursor-not-allowed"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <button
                onClick={() => {
                  const confirm = window.confirm('ログアウトしますか？');
                  if (confirm) {
                    if (confirm) {
                      logout();
                    }
                  }
                }}
                className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
              >
                ログアウト
              </button>
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
      onClickProfile={() => setIsEditingProfile(true)}
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

      {renderContent()}


      {isSafetyModalOpen && user && (
        <SafetyCheckModal
          currentUser={{ id: user.id, nickname: user.nickname }}
          households={households}
          onClose={() => setIsSafetyModalOpen(false)}
          onComplete={() => {
            setIsSafetyModalOpen(false);
            addToast('安否報告を送信しました', 'success');
          }}
        />
      )}

      <AreaSelectModal
        isOpen={isAreaModalOpen}
        onClose={() => setIsAreaModalOpen(false)}
        onAdd={(area) => {
          setSelectedAreas([area]);
          setIsAreaModalOpen(false);
          setPage(0);
          setHasMore(true);
          setPosts([]);
          setTimeout(() => fetchPosts(0, true), 100);
        }}
      />
    </Layout>
  );
};

export default Dashboard;

