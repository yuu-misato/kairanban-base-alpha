
export type PostCategory = 'general' | 'safety' | 'event' | 'marketplace' | 'notice' | 'chokai';

export interface User {
  id: string;
  nickname: string;
  role: 'resident' | 'business' | 'admin' | 'chokai_leader';
  avatar: string;
  score: number;
  level: number;
  selectedAreas: string[];
  isVerified?: boolean;
  isLineConnected: boolean; // LINE登録必須フラグ
  lineId?: string;
  shopName?: string; // 事業者用
}

export interface Kairanban {
  id: string;
  title: string;
  content: string;
  area: string;
  author: string;
  points: number;
  readCount: number;
  isRead: boolean;
  createdAt: string;
  sentToLine: boolean;
  // UI helpers
  date?: string;
  category?: string;
  communityId?: string;
}

export interface VolunteerMission {
  id: string;
  title: string;
  description: string;
  points: number;
  area: string;
  date: string;
  currentParticipants: number;
  maxParticipants: number;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  category: PostCategory;
  area: string;
  title: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: Comment[];
  createdAt: string;
  // UI helpers
  timestamp?: string;
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface LocalEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  area: string;
  imageUrl: string;
  points: number;
}

export interface Coupon {
  id: string;
  shopName: string;
  title: string;
  requiredScore: number;
  discount: string;
  imageUrl: string;
  area: string;
  isUsed: boolean;
  // UI helpers (mapped from discount)
  discountRate?: string;
  description?: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  inviteCode: string; // URLシェア用
  membersCount: number;
  imageUrl?: string;
  isSecret: boolean; // 非公開モード
  region?: string;
  role?: 'admin' | 'sub_admin' | 'member'; // Current user's role
}

export interface CommunityMember {
  communityId: string;
  userId: string;
  joinedAt: string;
  role: 'admin' | 'sub_admin' | 'member';
  // Joined User details
  nickname?: string;
  avatar?: string;
}

