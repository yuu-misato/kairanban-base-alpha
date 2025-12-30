-- 世帯（Household）テーブル
-- 家族や同居人、あるいは「スマホを持たない被支援者」をグループ化する単位
create table if not exists public.households (
    id uuid default gen_random_uuid() primary key,
    name text not null, -- 世帯名（例: 鈴木家、実家、〇〇さん宅）
    address text,       -- 住所（任意、配布物の配送などで将来的に使用）
    created_by uuid references auth.users(id) not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 世帯メンバー（Household Members）テーブル
-- アプリユーザー(user_idあり)と、非アプリユーザー(user_idなし)の両方を管理
create table if not exists public.household_members (
    id uuid default gen_random_uuid() primary key,
    household_id uuid references public.households(id) on delete cascade not null,
    user_id uuid references auth.users(id), -- アプリ利用者の場合
    
    -- 非アプリ利用者の場合、あるいはアプリ利用者でも家庭内での呼び名
    nickname text not null, 
    
    role text default 'member' check (role in ('head', 'member', 'dependent')),
    -- head: 世帯主（管理権限）
    -- member: 一般メンバー（自分のことのみ）
    -- dependent: 被扶養者・要支援者（スマホなし、代理操作対象）
    
    created_at timestamptz default now()
);

-- RLSポリシーの設定
alter table public.households enable row level security;
alter table public.household_members enable row level security;

-- Households: 自分がメンバーとして含まれている世帯は参照・更新可能
create policy "Users can view households they belong to"
    on public.households for select
    using (
        exists (
            select 1 from public.household_members
            where household_members.household_id = households.id
            and household_members.user_id = auth.uid()
        )
    );

create policy "Users can update households they belong to"
    on public.households for update
    using (
        exists (
            select 1 from public.household_members
            where household_members.household_id = households.id
            and household_members.user_id = auth.uid()
        )
    );

-- 作成時は誰でもOK（作成後に自分をメンバーに追加するトリガーが必要、またはクライアント側で処理）
create policy "Users can create households"
    on public.households for insert
    with check (auth.uid() = created_by);

-- Example trigger to auto-add creator as a member? 
-- クライアント側でトランザクション的にやるほうが柔軟なので一旦ポリシーのみ。

-- Members: 同じ世帯のメンバーは見れる
create policy "Users can view members of their households"
    on public.household_members for select
    using (
        exists (
            select 1 from public.household_members as my_membership
            where my_membership.household_id = household_members.household_id
            and my_membership.user_id = auth.uid()
        )
        -- または、自分が作成した世帯のメンバー追加直後の参照用
        or exists (
            select 1 from public.households
            where households.id = household_members.household_id
            and households.created_by = auth.uid()
        )
    );

create policy "Users can manage members of their households"
    on public.household_members for all
    using (
        exists (
            select 1 from public.household_members as my_membership
            where my_membership.household_id = household_members.household_id
            and my_membership.user_id = auth.uid()
            -- 将来的には role checks もここに入れる
        )
        or exists (
            select 1 from public.households
            where households.id = household_members.household_id
            and households.created_by = auth.uid()
        )
    );
