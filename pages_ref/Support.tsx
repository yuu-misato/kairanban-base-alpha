import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../services/supabaseService';
import { useAuth } from '../hooks/useAuth';

export const Support: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('question');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.from('support_tickets').insert({
      user_id: user?.id,
      email: email || 'anonymous',
      category,
      subject,
      message,
      status: 'open'
    });

    setIsSubmitting(false);

    if (error) {
      alert('送信に失敗しました。');
    } else {
      setIsSent(true);
    }
  };

  if (isSent) {
    return (
      <Layout
        userRole={user?.role}
        score={user?.score}
        userNickname={user?.nickname}
        userAvatar={user?.avatar}
        selectedAreas={user?.selectedAreas}
      >
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-emerald-100">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
              <i className="fas fa-check"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-4">送信完了</h2>
            <p className="text-slate-600 mb-8">
              お問い合わせありがとうございます。<br />
              内容を確認の上、担当者よりご連絡いたします。
            </p>
            <button onClick={() => navigate('/dashboard')} className="px-8 py-3 bg-slate-800 text-white rounded-full font-bold">
              ホームに戻る
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      userRole={user?.role}
      score={user?.score}
      userNickname={user?.nickname}
      userAvatar={user?.avatar}
      selectedAreas={user?.selectedAreas}
    >
      <div className="max-w-2xl mx-auto p-4 md:p-0 pb-24">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors">
          <i className="fas fa-arrow-left"></i> 戻る
        </button>

        <h1 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
          <span className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fas fa-headset"></i>
          </span>
          お問い合わせ・サポート
        </h1>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">カテゴリ</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-indigo-500 font-bold text-slate-700"
              >
                <option value="question">一般的なご質問</option>
                <option value="bug">不具合の報告</option>
                <option value="violation">違反報告・通報</option>
                <option value="request">機能リクエスト</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">件名</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="例：ログインができない"
                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-indigo-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">返信先メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="返信をご希望の場合は入力してください"
                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">お問い合わせ内容</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                placeholder="詳細な内容をご記入ください..."
                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-indigo-500 font-medium resize-none"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {isSubmitting ? '送信中...' : '送信する'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400 font-bold">
            ※ 不適切な投稿の通報は、各投稿のメニューからも行えます。<br />
            ※ 通常3営業日以内に回答させていただきます。
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Support;
