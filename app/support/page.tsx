import React from 'react';
import Link from 'next/link';

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-700">
            <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] p-8 md:p-16 shadow-xl shadow-slate-200/50">
                <div className="flex items-center gap-4 mb-10 border-b border-slate-100 pb-8">
                    <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl">
                        <i className="fas fa-headset"></i>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">お問い合わせ</h1>
                        <p className="text-slate-400 font-bold text-sm">ご不明な点やご要望はこちらから</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <section>
                            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                                <span className="text-indigo-500">Q&A.</span> よくあるご質問
                            </h2>
                            <div className="space-y-4">
                                <details className="group bg-slate-50 rounded-2xl p-4 cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                                    <summary className="flex items-center justify-between font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                        ログインができません
                                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-slate-400 group-open:rotate-180 transition-transform">
                                            <i className="fas fa-chevron-down text-xs"></i>
                                        </div>
                                    </summary>
                                    <p className="mt-4 text-sm text-slate-600 leading-relaxed animate-in fade-in slide-in-from-top-2">
                                        LINEログインが正常に動かない場合は、一度ブラウザのキャッシュを削除するか、プライベートブラウジングモード（シークレットモード）でお試しください。それでも解決しない場合は、下記よりお問い合わせください。
                                    </p>
                                </details>

                                <details className="group bg-slate-50 rounded-2xl p-4 cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                                    <summary className="flex items-center justify-between font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                        通知設定を変更したい
                                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-slate-400 group-open:rotate-180 transition-transform">
                                            <i className="fas fa-chevron-down text-xs"></i>
                                        </div>
                                    </summary>
                                    <p className="mt-4 text-sm text-slate-600 leading-relaxed animate-in fade-in slide-in-from-top-2">
                                        ダッシュボードの「設定」メニューから、LINE通知やメール通知の受信設定を変更することができます。
                                    </p>
                                </details>

                                <details className="group bg-slate-50 rounded-2xl p-4 cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                                    <summary className="flex items-center justify-between font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                        退会したい
                                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-slate-400 group-open:rotate-180 transition-transform">
                                            <i className="fas fa-chevron-down text-xs"></i>
                                        </div>
                                    </summary>
                                    <p className="mt-4 text-sm text-slate-600 leading-relaxed animate-in fade-in slide-in-from-top-2">
                                        設定画面の最下部にある「アカウント削除」ボタンからお手続きいただけます。一度削除されたデータは復元できませんのでご注意ください。
                                    </p>
                                </details>
                            </div>
                        </section>
                    </div>

                    <div className="bg-indigo-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-200">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-black mb-4">お問い合わせ窓口</h2>
                            <p className="text-indigo-100 text-sm mb-8 leading-relaxed">
                                上記のQ&Aで解決しない場合や、ご意見・ご要望がございましたら、以下のメールアドレスまで直接ご連絡ください。
                            </p>

                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-6">
                                <p className="text-xs font-bold text-indigo-200 mb-1">サポートメールアドレス</p>
                                <p className="font-mono text-lg font-bold select-all">support@kairanban-base.com</p>
                            </div>

                            <a
                                href="mailto:support@kairanban-base.com"
                                className="w-full bg-white text-indigo-600 font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors shadow-lg active:scale-95"
                            >
                                <i className="fas fa-envelope"></i>
                                メールを起動する
                            </a>
                        </div>

                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-50"></div>
                    </div>
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
