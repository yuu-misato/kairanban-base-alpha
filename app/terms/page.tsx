import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-700">
            <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] p-8 md:p-16 shadow-xl shadow-slate-200/50">
                <div className="flex items-center gap-4 mb-10 border-b border-slate-100 pb-8">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl">
                        <i className="fas fa-file-contract"></i>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">利用規約</h1>
                        <p className="text-slate-400 font-bold text-sm">最終更新日: 2026年1月1日</p>
                    </div>
                </div>

                <div className="space-y-10 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                            <span className="text-emerald-500">01.</span> はじめに
                        </h2>
                        <p className="mb-4">
                            この利用規約（以下，「本規約」といいます。）は，回覧板BASE（以下，「当社」といいます。）がこのウェブサイト上で提供するサービス（以下，「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下，「ユーザー」といいます。）には，本規約に従って，本サービスをご利用いただきます。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                            <span className="text-emerald-500">02.</span> 利用登録
                        </h2>
                        <ul className="list-disc pl-5 space-y-2 marker:text-emerald-500">
                            <li>登録希望者が当社の定める方法によって利用登録を申請し，当社がこれを承認することによって，利用登録が完了するものとします。</li>
                            <li>当社は，利用登録の申請者に以下の事由があると判断した場合，利用登録の申請を承認しないことがあり，その理由については一切の開示義務を負わないものとします。
                                <ul className="list-circle pl-5 mt-2 space-y-1 text-sm text-slate-500">
                                    <li>虚偽の事項を届け出た場合</li>
                                    <li>本規約に違反したことがある者からの申請である場合</li>
                                    <li>その他，当社が利用登録を相当でないと判断した場合</li>
                                </ul>
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                            <span className="text-emerald-500">03.</span> 禁止事項
                        </h2>
                        <p className="mb-4">ユーザーは，本サービスの利用にあたり，以下の行為をしてはなりません。</p>
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-bold">
                                <li className="flex items-center gap-2"><i className="fas fa-times text-rose-400"></i> 法令または公序良俗に違反する行為</li>
                                <li className="flex items-center gap-2"><i className="fas fa-times text-rose-400"></i> 犯罪行為に関連する行為</li>
                                <li className="flex items-center gap-2"><i className="fas fa-times text-rose-400"></i> 本サービスの内容等，本サービスに含まれる著作権，商標権ほか知的財産権を侵害する行為</li>
                                <li className="flex items-center gap-2"><i className="fas fa-times text-rose-400"></i> 当社，ほかのユーザー，またはその他第三者のサーバーまたはネットワークの機能を破壊したり，妨害したりする行為</li>
                                <li className="flex items-center gap-2"><i className="fas fa-times text-rose-400"></i> 他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                                <li className="flex items-center gap-2"><i className="fas fa-times text-rose-400"></i> 不正な目的を持って本サービスを利用する行為</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                            <span className="text-emerald-500">04.</span> 保証の否認および免責事項
                        </h2>
                        <p>
                            当社は，本サービスに事実上または法律上の瑕疵（安全性，信頼性，正確性，完全性，有効性，特定の目的への適合性，セキュリティなどに関する欠陥，エラーやバグ，権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
                        </p>
                        <p className="mt-4">
                            当社は，本サービスに起因してユーザーに生じたあらゆる損害について、当社の故意又は重過失による場合を除き、一切の責任を負いません。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                            <span className="text-emerald-500">05.</span> サービス内容の変更等
                        </h2>
                        <p>
                            当社は，ユーザーに通知することなく，本サービスの内容を変更し，または本サービスの提供を中止することができるものとし，これによってユーザーに生じた損害について一切の責任を負いません。
                        </p>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-slate-100 flex justify-center">
                    <Link href="/dashboard" className="px-8 py-4 bg-slate-800 text-white font-black rounded-2xl hover:bg-slate-700 transition-all flex items-center gap-3 shadow-lg shadow-slate-300">
                        <i className="fas fa-arrow-left"></i>
                        ダッシュボードに戻る
                    </Link>
                </div>
            </div>
        </div>
    );
}
