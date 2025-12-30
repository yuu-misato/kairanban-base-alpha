import React from 'react';
import Link from 'next/link';

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 shadow-sm">
                <h1 className="text-2xl font-black text-slate-800 mb-6">お問い合わせ</h1>
                <div className="prose prose-slate">
                    <p>ご質問やご要望は以下のフォーム、またはメールアドレスまでご連絡ください。</p>
                    <p className="font-bold p-4 bg-slate-100 rounded-xl">support@example.com</p>
                </div>
                <div className="mt-8">
                    <Link href="/dashboard" className="text-emerald-600 font-bold hover:underline">
                        ダッシュボードに戻る
                    </Link>
                </div>
            </div>
        </div>
    );
}
