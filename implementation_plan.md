# 回覧板BASE (Kairanban BASE) - MVP 実装計画書

## 1. プロジェクト概要

**目的**: 物理的な回覧板を代替する地域限定デジタル回覧板システムの構築。
**主要技術**: Next.js (App Router), Supabase (Auth, DB, Storage, Edge Functions), LINE LIFF。

## 2. ディレクトリ構造設計

```
/
├── app/
│   ├── (admin)/             # 管理者用ルート (自治会長)
│   ├── (user)/              # 住民用ルート (LIFF経由)
│   ├── api/                 # Next.js API Routes (必要な場合)
│   ├── layout.tsx           # ルートレイアウト
│   └── page.tsx             # LP / 役割による振り分け
├── components/
│   ├── ui/                  # 汎用UIコンポーネント (ボタン, カード等)
│   ├── hooks/               # カスタムフック (Auth, データ取得)
│   └── contexts/            # React Contexts
├── lib/
│   ├── supabase/            # Supabaseクライアント設定 (Client/Server)
│   ├── line/                # LINE Messaging API ヘルパー
│   └── utils.ts             # ユーティリティ関数
├── supabase/
│   ├── functions/           # Edge Functions (Deno)
│   │   └── notify-line/     # 通知トリガー用関数
│   └── migrations/          # SQLスキーママイグレーション
└── public/                  # 静的アセット
```

## 3. データベーススキーマ設計 (Supabase)

### テーブル構成

1. **public.communities**
    * `id`: UUID (Primary Key)
    * `name`: Text (自治会名)
    * `created_at`: Timestamptz

2. **public.profiles** (auth.users 拡張)
    * `id`: UUID (FK to auth.users, PK)
    * `role`: Text ('admin' | 'user')
    * `community_id`: UUID (FK to communities.id)
    * `display_name`: Text
    * `avatar_url`: Text
    * `line_user_id`: Text (Unique, LINEユーザー識別用)
    * `updated_at`: Timestamptz

3. **public.posts**
    * `id`: UUID (PK)
    * `community_id`: UUID (FK to communities.id)
    * `author_id`: UUID (FK to profiles.id)
    * `content`: Text
    * `image_urls`: Text[] (画像URL配列)
    * `created_at`: Timestamptz

4. **public.read_receipts**
    * `id`: UUID (PK)
    * `post_id`: UUID (FK to posts.id)
    * `user_id`: UUID (FK to profiles.id)
    * `read_at`: Timestamptz

### RLSポリシー (セキュリティ設計)

* **profiles**: 同じコミュニティ内のユーザーは閲覧可能。本人のみ更新可能。
* **posts**: 管理者(admin)のみ作成可能。同じコミュニティのユーザーは閲覧可能。
* **read_receipts**: ユーザーは自身の既読を作成可能。管理者は自コミュニティの既読状況を閲覧可能。

## 4. 実装ステップ

### フェーズ 1: セットアップ & スキーマ (現在のタスク)

1. **環境構築**: Next.jsの初期化、依存ライブラリ(`@supabase/supabase-js`, `@line/liff`)のインストール。
2. **DB初期化**: スキーマとRLSポリシーのマイグレーションファイル作成、ローカルSupabaseへの適用。

### フェーズ 2: コア機能実装

1. **認証 & 基盤**: Supabase Auth実装 (管理者はEmail, 住民はLINE/匿名)。レイアウト作成。
2. **管理者機能**: 記事投稿フォーム (テキスト + Supabase Storageへの画像アップロード)。
3. **住民機能**: タイムライン表示 (RLS準拠) と既読ボタン機能。

### フェーズ 3: 通知 & 仕上げ

1. **Edge Function**: `posts`テーブルへのINSERTをトリガーに`notify-line`関数を実行。
2. **LINE連携**: Messaging APIを用いてコミュニティメンバーへプッシュ通知を一斉送信。
3. **UI/UX改善**: Tailwind CSSを用いたモダンでプレミアムなデザイン適用。

## 5. 次のアクション

1. `create-next-app` の実行。
2. ライブラリのインストール。
3. Supabaseマイグレーションファイルの作成。
4. ローカルSupabaseの起動と適用。
