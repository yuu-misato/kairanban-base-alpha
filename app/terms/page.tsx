import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 shadow-sm">
                <h1 className="text-2xl font-black text-slate-800 mb-6">利用規約</h1>
                <div className="prose prose-slate">
                    <p>ここに利用規約が入ります。</p>
                    <p>
                        1. 当サービスの目的...<br />
                        2. ユーザーの責任...<br />
                        3. 禁止事項...
                    </p>
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
