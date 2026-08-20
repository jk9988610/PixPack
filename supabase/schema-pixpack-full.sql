-- =============================================================================
-- PixPack — 完整初始化（Supabase SQL Editor · 一次粘贴执行）
-- =============================================================================
-- 包含：建桶 → 建表 → 公开 RLS → Storage 策略 → 初始 pack 行
-- 完全公开（anon 可读写），对照 Card-World
--
-- 执行后：
--   1) GitHub Secrets 填入 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
--   2) 打开 https://jk9988610.github.io/PixPack/ 直接上传保存（无需登录）
--   3) 可选：上传 spritesheet 到 Storage 后执行文末 seed-player 段（替换 YOUR_PROJECT_REF）
-- =============================================================================

-- =============================================================================
-- 1) Storage Bucket
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pixpack-assets',
  'pixpack-assets',
  true,
  52428800,
  array['image/png', 'image/jpeg', 'image/webp', 'application/json']::text[]
)
on conflict (id) do update set
  public = true,
  name = excluded.name,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- =============================================================================
-- 2) Tables
-- =============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.asset_packs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null check (category in ('bootstrap','player','npc','enemy','vfx','ui')),
  priority int not null default 100,
  version int not null default 1,
  zone_id text,
  byte_size int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pack_assets (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.asset_packs(id) on delete cascade,
  kind text not null check (kind in ('spritesheet','json','audio')),
  storage_path text not null,
  public_url text not null,
  byte_size int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.asset_packs(id) on delete cascade,
  name text not null,
  role text not null check (role in ('player','npc','enemy')),
  meta_json jsonb not null,
  sheet_asset_id uuid references public.pack_assets(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists asset_packs_slug_idx on public.asset_packs (slug);
create index if not exists asset_packs_priority_idx on public.asset_packs (priority);
create index if not exists pack_assets_pack_id_idx on public.pack_assets (pack_id);
create index if not exists characters_pack_id_idx on public.characters (pack_id);

-- =============================================================================
-- 3) Table RLS（完全公开）
-- =============================================================================

alter table public.asset_packs enable row level security;
alter table public.pack_assets enable row level security;
alter table public.characters enable row level security;

drop policy if exists "pixpack_packs_write_auth" on public.asset_packs;
drop policy if exists "pixpack_packs_update_auth" on public.asset_packs;
drop policy if exists "pixpack_packs_delete_auth" on public.asset_packs;
drop policy if exists "pixpack_assets_write_auth" on public.pack_assets;
drop policy if exists "pixpack_assets_update_auth" on public.pack_assets;
drop policy if exists "pixpack_assets_delete_auth" on public.pack_assets;
drop policy if exists "pixpack_characters_write_auth" on public.characters;
drop policy if exists "pixpack_characters_update_auth" on public.characters;
drop policy if exists "pixpack_characters_delete_auth" on public.characters;

drop policy if exists "pixpack_packs_select" on public.asset_packs;
create policy "pixpack_packs_select" on public.asset_packs for select using (true);
drop policy if exists "pixpack_packs_insert" on public.asset_packs;
create policy "pixpack_packs_insert" on public.asset_packs for insert with check (true);
drop policy if exists "pixpack_packs_update" on public.asset_packs;
create policy "pixpack_packs_update" on public.asset_packs for update using (true) with check (true);
drop policy if exists "pixpack_packs_delete" on public.asset_packs;
create policy "pixpack_packs_delete" on public.asset_packs for delete using (true);

drop policy if exists "pixpack_assets_select" on public.pack_assets;
create policy "pixpack_assets_select" on public.pack_assets for select using (true);
drop policy if exists "pixpack_assets_insert" on public.pack_assets;
create policy "pixpack_assets_insert" on public.pack_assets for insert with check (true);
drop policy if exists "pixpack_assets_update" on public.pack_assets;
create policy "pixpack_assets_update" on public.pack_assets for update using (true) with check (true);
drop policy if exists "pixpack_assets_delete" on public.pack_assets;
create policy "pixpack_assets_delete" on public.pack_assets for delete using (true);

drop policy if exists "pixpack_characters_select" on public.characters;
create policy "pixpack_characters_select" on public.characters for select using (true);
drop policy if exists "pixpack_characters_insert" on public.characters;
create policy "pixpack_characters_insert" on public.characters for insert with check (true);
drop policy if exists "pixpack_characters_update" on public.characters;
create policy "pixpack_characters_update" on public.characters for update using (true) with check (true);
drop policy if exists "pixpack_characters_delete" on public.characters;
create policy "pixpack_characters_delete" on public.characters for delete using (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.asset_packs to anon, authenticated;
grant select, insert, update, delete on public.pack_assets to anon, authenticated;
grant select, insert, update, delete on public.characters to anon, authenticated;

-- =============================================================================
-- 4) Storage RLS（完全公开）
-- =============================================================================

drop policy if exists "pixpack_assets_auth_insert" on storage.objects;
drop policy if exists "pixpack_assets_auth_update" on storage.objects;
drop policy if exists "pixpack_assets_auth_delete" on storage.objects;

drop policy if exists "pixpack_assets_public_read" on storage.objects;
create policy "pixpack_assets_public_read"
  on storage.objects for select
  using (bucket_id = 'pixpack-assets');

drop policy if exists "pixpack_assets_anon_insert" on storage.objects;
create policy "pixpack_assets_anon_insert"
  on storage.objects for insert
  with check (bucket_id = 'pixpack-assets');

drop policy if exists "pixpack_assets_anon_update" on storage.objects;
create policy "pixpack_assets_anon_update"
  on storage.objects for update
  using (bucket_id = 'pixpack-assets');

drop policy if exists "pixpack_assets_anon_delete" on storage.objects;
create policy "pixpack_assets_anon_delete"
  on storage.objects for delete
  using (bucket_id = 'pixpack-assets');

-- =============================================================================
-- 5) Seed：bootstrap + player pack 行
-- =============================================================================

insert into public.asset_packs (slug, name, category, priority, version, byte_size)
values
  ('bootstrap', 'Bootstrap', 'bootstrap', 0, 1, 256),
  ('player', 'Player', 'player', 10, 1, 4096)
on conflict (slug) do nothing;

-- =============================================================================
-- 6) 验证
-- =============================================================================

select id, name, public from storage.buckets where id = 'pixpack-assets';
select slug, name, category, version from public.asset_packs order by priority;

-- =============================================================================
-- 7) 可选：初始 player 角色（需先上传 PNG 到 Storage）
-- =============================================================================
-- 路径：pixpack-assets / assets/packs/player/v1/spritesheet.png
-- 将 YOUR_PROJECT_REF 换成 Project Settings → General → Reference ID
-- 取消下方注释后单独选中执行：
--
-- delete from public.characters where pack_id in (select id from public.asset_packs where slug = 'player');
-- delete from public.pack_assets where pack_id in (select id from public.asset_packs where slug = 'player');
--
-- with player as (select id from public.asset_packs where slug = 'player'),
-- asset as (
--   insert into public.pack_assets (pack_id, kind, storage_path, public_url, byte_size)
--   select player.id, 'spritesheet',
--     'assets/packs/player/v1/spritesheet.png',
--     'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/pixpack-assets/assets/packs/player/v1/spritesheet.png?v=1',
--     4096
--   from player returning id, pack_id
-- )
-- insert into public.characters (pack_id, name, role, meta_json, sheet_asset_id)
-- select asset.pack_id, '默认', 'player',
--   '{"frameWidth":32,"frameHeight":32,"scale":3,"filter":"nearest",
--     "animations":{"idle":{"frames":[0,1,2,3],"fps":4,"loop":true},"walk":{"frames":[4,5,6,7,8,9],"fps":8,"loop":true}},
--     "frames":[{"x":0,"y":0},{"x":32,"y":0},{"x":64,"y":0},{"x":96,"y":0},{"x":128,"y":0},{"x":160,"y":0},{"x":192,"y":0},{"x":224,"y":0},{"x":256,"y":0},{"x":288,"y":0}]}'::jsonb,
--   asset.id from asset;
