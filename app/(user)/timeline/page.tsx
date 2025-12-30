"use client";

import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { MOCK_POSTS } from '@/lib/mock';
import Link from 'next/link';
import { useLiff } from '@/components/providers/LiffProvider';

export default function TimelinePage() {
    const { profile, isLoggedIn, login, error } = useLiff();
    const [posts, setPosts] = useState(MOCK_POSTS);

    const handleRead = (postId: string) => {
        // In real app, this sends a request to Supabase
        alert(`記事ID: ${postId} を「既読」にしました (Mock)`);
    };

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <p className="text-red-500 font-bold mb-2">LIFF Error</p>
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{error}</p>
                <p className="text-xs text-muted-foreground mt-4">.env.localのNEXT_PUBLIC_LINE_LIFF_IDを確認してください</p>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-secondary/30">
                <h1 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">回覧板BASE</h1>
                <p className="mb-8 text-center text-muted-foreground">回覧板を見るにはLINEログインが必要です</p>
                <button
                    onClick={login}
                    className="bg-[#06C755] text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl hover:bg-[#05b34c] transition-all flex items-center gap-2"
                >
                    <span>LINEでログイン</span>
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-secondary/30 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                    回覧板
                </h1>
                <div className="flex items-center gap-2">
                    {profile?.pictureUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={profile.pictureUrl} alt="User" className="w-8 h-8 rounded-full border border-border" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {profile?.displayName?.[0]}
                        </div>
                    )}
                    <div className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded-full border">
                        {profile?.displayName} さん
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-6">
                {posts.map((post) => (
                    <article key={post.id} className="bg-card border rounded-xl shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-500">
                        {post.image_urls && post.image_urls.length > 0 && (
                            <div className="aspect-video w-full bg-muted relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={post.image_urls[0]}
                                    alt="Attachment"
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        )}

                        <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span>
                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">お知らせ</span>
                            </div>

                            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                                {post.content}
                            </div>

                            <div className="mt-4 pt-4 border-t flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">
                                    既読: {post.reads}人
                                </div>
                                <button
                                    onClick={() => handleRead(post.id)}
                                    className="bg-primary text-primary-foreground text-sm font-medium px-6 py-2 rounded-full hover:bg-primary/90 active:scale-95 transition-all shadow-sm shadow-green-200 dark:shadow-none"
                                >
                                    確認しました
                                </button>
                            </div>
                        </div>
                    </article>
                ))}

                <div className="text-center text-sm text-muted-foreground py-8">
                    全ての回覧を確認しました ✅
                </div>
            </main>

            {/* Bottom Nav Mock */}
            <nav className="fixed bottom-0 w-full bg-background border-t p-2 flex justify-around text-xs text-muted-foreground safe-area-bottom z-50">
                <Link href="/" className="flex flex-col items-center p-2 text-primary">
                    <span className="text-xl">🏠</span>
                    <span>ホーム</span>
                </Link>
                <div className="flex flex-col items-center p-2 opacity-50">
                    <span className="text-xl">🔔</span>
                    <span>通知</span>
                </div>
                <div className="flex flex-col items-center p-2 opacity-50">
                    <span className="text-xl">👤</span>
                    <span>設定</span>
                </div>
            </nav>
        </div>
    );
}
