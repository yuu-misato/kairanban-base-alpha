import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

export const Terms: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Layout
      userRole={user?.role}
      score={user?.score}
      userNickname={user?.nickname}
      userAvatar={user?.avatar}
      selectedAreas={user?.selectedAreas}
    >
      <div className="max-w-3xl mx-auto p-4 md:p-0 pb-24">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors">
          <i className="fas fa-arrow-left"></i> 戻る
        </button>

        <h1 className="text-2xl font-black text-slate-800 mb-8">利用規約・プライバシーポリシー</h1>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">1. 利用規約</h2>
            <div className="text-sm text-slate-600 leading-relaxed space-y-4">
              <p>この利用規約（以下，「本規約」といいます。）は，回覧板BASE（以下，「当社」といいます。）がこのウェブサイト上で提供するサービス（以下，「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下，「ユーザー」といいます。）には，本規約に従って，本サービスをご利用いただきます。</p>

              <h3 className="font-bold text-slate-700">第1条（適用）</h3>
              <p>本規約は，ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。</p>

              <h3 className="font-bold text-slate-700">第2条（禁止事項）</h3>
              <p>ユーザーは，本サービスの利用にあたり，以下の行為をしてはなりません。</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>当社のサーバーまたはネットワークの機能を破壊したり，妨害したりする行為</li>
                <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                <li>他のユーザーに成りすます行為</li>
                <li>当社のサービスに関連して，反社会的勢力に対して直接または間接に利益を供与する行為</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">2. プライバシーポリシー</h2>
            <div className="text-sm text-slate-600 leading-relaxed space-y-4">
              <p>当社は，本サービスの利用によって取得する個人情報については，当社「プライバシーポリシー」に従い適切に取り扱うものとします。</p>

              <h3 className="font-bold text-slate-700">第1条（個人情報の収集）</h3>
              <p>当社は、ユーザーが利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレスなどの個人情報をお尋ねすることがあります。</p>

              <h3 className="font-bold text-slate-700">第2条（個人情報の利用目的）</h3>
              <p>当社が個人情報を収集・利用する目的は，以下のとおりです。</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>当社サービスの提供・運営のため</li>
                <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
                <li>メンテナンス，重要なお知らせなど必要に応じたご連絡のため</li>
              </ul>
            </div>
          </section>

          <div className="pt-8 text-center text-xs text-slate-400">
            最終更新日: 2024年1月1日
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Terms;
