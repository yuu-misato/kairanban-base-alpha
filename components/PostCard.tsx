
import React, { useState } from 'react';
import { Post } from '../types';

interface PostCardProps {
  post: Post;
  onLike: (id: string) => void;
}

const PostCard: React.FC<PostCardProps & { currentUser?: { id: string, avatar: string, nickname: string }; onAddComment?: (postId: string, content: string) => Promise<any> }> = ({ post, onLike, currentUser, onAddComment }) => {
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState(post.comments || []);

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'notice': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'safety': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'event': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'marketplace': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'notice': return 'お知らせ';
      case 'safety': return '防犯・安全';
      case 'event': return 'イベント';
      case 'marketplace': return '商店街';
      default: return '全般';
    }
  };

  const handleLike = () => {
    setIsLikeAnimating(true);
    onLike(post.id);
    setTimeout(() => setIsLikeAnimating(false), 300);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !onAddComment || !currentUser) return;

    // Optimistic Update
    const tempComment = {
      id: Math.random().toString(),
      userId: currentUser.id,
      userName: currentUser.nickname,
      content: commentText,
      createdAt: new Date().toISOString()
    };

    setLocalComments([...localComments, tempComment]);
    setCommentText('');

    // Actual API Call
    await onAddComment(post.id, tempComment.content);
  };

  return (
    <article className="bg-white rounded-2xl md:rounded-3xl shadow-sm md:border border-slate-100/50 overflow-hidden mb-3 md:mb-6 transition-all hover:shadow-md">
      <div className="p-3 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
            <img src={post.userAvatar} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-800 text-sm">{post.userName}</h3>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">一般ユーザー</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold">{new Date(post.createdAt).toLocaleDateString('ja-JP')} ・ {post.area}</p>
          </div>
          <div className="ml-auto">
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border ${getCategoryStyles(post.category)}`}>
              {getCategoryLabel(post.category)}
            </span>
          </div>
        </div>

        {/* Content */}
        <h4 className="text-lg font-black mb-2 text-slate-800 leading-tight">{post.title}</h4>
        <p className="text-slate-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap font-medium">{post.content}</p>

        {post.imageUrl && (
          <div className="rounded-2xl overflow-hidden mb-4 border border-slate-100">
            <img src={post.imageUrl} alt="Post content" className="w-full h-auto object-cover max-h-[400px]" />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
          <button
            onClick={handleLike}
            className="flex items-center gap-2 text-slate-400 hover:text-pink-500 transition-colors group"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-pink-50 transition-colors ${isLikeAnimating ? 'animate-ping' : ''}`}>
              <i className={`${post.isLiked ? 'fas fa-heart text-pink-500' : 'far fa-heart'} ${isLikeAnimating ? 'text-pink-500 font-bold' : ''}`}></i>
            </div>
            <span className={`text-xs font-black transition-transform ${isLikeAnimating || post.isLiked ? 'scale-125 text-pink-500' : ''}`}>{post.likes}</span>
          </button>

          <button
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className={`flex items-center gap-2 transition-colors group ${isCommentsOpen ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-600'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isCommentsOpen ? 'bg-emerald-50' : 'group-hover:bg-emerald-50'}`}>
              <i className="far fa-comment-dots"></i>
            </div>
            <span className="text-xs font-black">{localComments.length}</span>
          </button>

          <button className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 ml-auto transition-colors group">
            <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
              <i className="far fa-share-square"></i>
            </div>
          </button>
        </div>

        {/* Comments Section */}
        {isCommentsOpen && (
          <div className="mt-4 pt-4 border-t border-slate-50 animate-in slide-in-from-top-2 fade-in duration-200">
            {/* List */}
            <div className="space-y-4 mb-4">
              {localComments.map((comment, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId}`} alt="" className="w-full h-full" />
                  </div>
                  <div className="bg-slate-50 rounded-2xl rounded-tl-none p-3 px-4 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-slate-800">{comment.userName}</span>
                      <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))}
              {localComments.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-2">まだコメントはありません。一番乗りしましょう！</p>
              )}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="コメントを書く..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim()}
                className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200"
              >
                <i className="fas fa-paper-plane text-xs translate-x-[-1px] translate-y-[1px]"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

export default PostCard;
