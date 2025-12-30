# 回覧板BASE - セットアップ & デプロイガイド

このガイドでは、実装したアプリケーションを動作させるために必要な **Supabase** と **LINE Developers** の設定手順を詳細に解説します。

---

## 1. Supabase の設定

### 1-1. プロジェクトの作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセスし、ログインします。
2. **"New Project"** をクリックします。
3. 以下の情報を入力して **"Create new project"** をクリックします。
    * **Name**: `Kairanban-BASE` (任意の名前でOK)
    * **Database Password**: 強力なパスワードを設定し、必ず控えておいてください。
    * **Region**: `Tokyo (North East Asia)` を推奨。
    * **Pricing Plan**: FreeプランでOK。

### 1-2. 環境変数の取得と設定

プロジェクトが作成されるまで数分待ちます。完了したら：

1. Dashboardのサイドバーから **Project Settings (歯車アイコン)** > **API** を選択します。
2. 以下の値をコピーし、ローカルの `.env.local` ファイル（`.env.example`をコピーして作成）に貼り付けます。
    * `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
    * `anon` / `public` キー -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`

```bash
# Terminalでのコマンド例
cp .env.example .env.local
# その後、.env.local をエディタで開き、上記URLとKeyを貼り付けて保存
```

### 1-3. データベーススキーマの反映 (DB Push)

ローカルで作成したテーブル定義を、クラウド上のSupabaseに反映させます。

1. ターミナルでSupabaseにログインします。

   ```bash
   npx supabase login
   ```

   (ブラウザが開くので承認してください)

2. プロジェクトをリンクします。

   ```bash
   npx supabase link --project-ref kypnapwqarggnamgeeza
   ```

   * `<PROJECT_ID>` は、Supabase URLの `https://<PROJECT_ID>.supabase.co` の部分、またはDashboardのURL `https://supabase.com/dashboard/project/<PROJECT_ID>` から取得できます。
   * 聞かれた場合、データベースのパスワードを入力します。

3. スキーマをプッシュします。

   ```bash
   npx supabase db push
   ```

   これで `communities`, `posts` などのテーブルが作成されます。

### 1-4. Edge Function のデプロイ

通知機能 (`notify-line`) をデプロイします。

1. デプロイコマンドを実行します。

   ```bash
   npx supabase functions deploy notify-line
   ```

   （初回はDockerなどが不要なBundled deploymentが自動選択されるはずです）

2. Dashboardの **Edge Functions** セクションに `notify-line` が表示されていることを確認します。

---

## 2. LINE Developers の設定

### 2-1. プロバイダーの作成

1. [LINE Developers Console](https://developers.line.biz/console/) にログインします。
2. **"新規プロバイダー作成"** をクリックし、名前（例: `My Community App`）を入力して作成します。

### 2-2. LINE Login チャネル (LIFF用) の作成

住民がアプリケーションにログインするために使用します。

1. 作成したプロバイダー内で **"新規チャネル作成"** > **"LINEログイン"** を選択。
2. 必須項目を入力して作成します。
    * **チャネル名**: `回覧板BASE` など
    * **アプリタイプ**: ウェブアプリ
3. 作成後、**LIFF** タブを開き、**"追加"** をクリック。
    * **LIFFアプリ名**: `Kairanban App`
    * **サイズ**: Full, Tall, Compact から選択（Full推奨）。
    * **エンドポイントURL**:
        * 開発中: `https://localhost:3000` (LINEの仕様によりHTTPSが必須です。ローカル開発サーバーもHTTPSモードで起動します)
        * **注意**: 初回起動時にSSL証明書インストールのためにMacのパスワード入力が求められます。ブラウザの警告は「詳細設定」から許可して進んでください。
    * **Scope**: `profile`, `openid` にチェック。
4. 作成された **LIFF ID** (例: `12345678-abcdefgh`) をコピーし、`.env.local` の `NEXT_PUBLIC_LINE_LIFF_ID` に設定します。

### 2-3. Messaging API チャネル (通知用) の作成

更新通知を送るBot用です。

1. 同じプロバイダー内で **"新規チャネル作成"** > **"Messaging API"** を選択し、作成します。
2. **Messaging API設定** タブを開きます。
3. 一番下の **チャネルアクセストークン (長期)** で発行ボタンを押します。
4. 発行された長い文字列をコピーします。

---

## 3. 連携設定 (Supabase Secrets)

最後に、LINEのトークンをSupabaseのEdge Functionが使えるように設定します。

1. ターミナルで以下のコマンドを実行します（またはDashboardの Settings > Edge Functions から設定可能）。

```bash
npx supabase secrets set LINE_CHANNEL_ACCESS_TOKEN="birC1OCVJlObhdVBm4Qb0JBclH48xUIPCGjkZ94T7vFGRNC2G4mLiwNQQ0PGXKwEJL6mZzFA6yh5bo2SctOMpDpHABMoF4zeoCPO/CQuvMJYiX/bWcDXpUQUrntmRiKVL6bnE0nnkWVfOa9eQMrTswdB04t89/1O/w1cDnyilFU=
npx supabase secrets set SUPABASE_URL=https://kypnapwqarggnamgeeza.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5cG5hcHdxYXJnZ25hbWdlZXphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxNTI2NCwiZXhwIjoyMDgyNTkxMjY0fQ.KN6CpCBLD_eZtzzW3TGhKBYJkmEWErMjzQWHl_EhX6E
```

**注意**: `SUPABASE_SERVICE_ROLE_KEY` は `anon` キーではなく、**`service_role`** キーを使用してください（管理者権限でDB操作をするため）。

---

## 4. 動作確認

1. `.env.local` が正しく設定されていることを確認し、アプリを起動します。

   ```bash
   npm run dev
   ```

2. `http://localhost:3000/timeline` にアクセスし、LINEログインボタンを押してログインできるか確認します。
3. **通知のテスト**は、Supabase Dashboardの `Table Editor` から `posts` テーブルに手動で行を追加することでテストできます（本番では管理者画面から行います）。
    * `SQL Editor` で以下を実行してもOK:

    ```sql
    INSERT INTO public.posts (community_id, author_id, content)
    VALUES ('<community_id>', '<your_user_id>', 'テスト投稿です！LINE通知は届きましたか？');
    ```

    * ただし、通知を受け取るには `profiles` テーブルにあなたの `line_user_id` が登録されている必要があります（LIFFでログインすると自動登録されるロジックはまだ要調整かもしれません。現状のコードではLIFFログイン時にSupabaseへユーザー登録する処理を追加実装するとよりスムーズです）。

以上でセットアップは完了です！
