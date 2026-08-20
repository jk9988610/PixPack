-- =============================================================================
-- PixPack — 素材工坊（Supabase SQL Editor · 文件 1/2）
-- =============================================================================
-- 可与 Card-World / HarmonyForge 共用同一 Supabase 项目（URL / anon key 相同，桶名不同）。
--
-- BEFORE SQL（Dashboard 手动）：
--   Storage → New bucket → Name: pixpack-assets → Public bucket: ON
--
-- RUN ORDER：
--   1) 本文件（表 + 索引 + RLS + 初始 pack 行）
--   2) supabase/schema-pixpack-storage-policies.sql
--   3) 上传初始 spritesheet 后执行 supabase/seed-player.sql（替换 YOUR_PROJECT_REF）
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

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

comment on table public.asset_packs is 'PixPack 资源包 manifest（bootstrap / player / enemy 等）';

create table if not exists public.pack_assets (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.asset_packs(id) on delete cascade,
  kind text not null check (kind in ('spritesheet','json','audio')),
  storage_path text not null,
  public_url text not null,
  byte_size int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.pack_assets is 'Pack 内文件；PNG 存 Storage bucket pixpack-assets';

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

comment on table public.characters is '角色实体；meta_json 含 idle/walk 动画定义';

create index if not exists asset_packs_slug_idx on public.asset_packs (slug);
create index if not exists asset_packs_priority_idx on public.asset_packs (priority);
create index if not exists pack_assets_pack_id_idx on public.pack_assets (pack_id);
create index if not exists characters_pack_id_idx on public.characters (pack_id);

-- ---------------------------------------------------------------------------
-- RLS（对照 Card-World：公开读 + 仅登录可写）
-- ---------------------------------------------------------------------------

alter table public.asset_packs enable row level security;
alter table public.pack_assets enable row level security;
alter table public.characters enable row level security;

-- SELECT：匿名 + 登录均可读（GitHub Pages 预览无需登录）
drop policy if exists "pixpack_packs_select" on public.asset_packs;
create policy "pixpack_packs_select"
  on public.asset_packs for select
  using (true);

drop policy if exists "pixpack_assets_select" on public.pack_assets;
create policy "pixpack_assets_select"
  on public.pack_assets for select
  using (true);

drop policy if exists "pixpack_characters_select" on public.characters;
create policy "pixpack_characters_select"
  on public.characters for select
  using (true);

-- INSERT / UPDATE / DELETE：仅 authenticated（未登录写入应被拒绝）
drop policy if exists "pixpack_packs_write_auth" on public.asset_packs;
create policy "pixpack_packs_write_auth"
  on public.asset_packs for insert
  to authenticated
  with check (true);

drop policy if exists "pixpack_packs_update_auth" on public.asset_packs;
create policy "pixpack_packs_update_auth"
  on public.asset_packs for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "pixpack_packs_delete_auth" on public.asset_packs;
create policy "pixpack_packs_delete_auth"
  on public.asset_packs for delete
  to authenticated
  using (true);

drop policy if exists "pixpack_assets_write_auth" on public.pack_assets;
create policy "pixpack_assets_write_auth"
  on public.pack_assets for insert
  to authenticated
  with check (true);

drop policy if exists "pixpack_assets_update_auth" on public.pack_assets;
create policy "pixpack_assets_update_auth"
  on public.pack_assets for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "pixpack_assets_delete_auth" on public.pack_assets;
create policy "pixpack_assets_delete_auth"
  on public.pack_assets for delete
  to authenticated
  using (true);

drop policy if exists "pixpack_characters_write_auth" on public.characters;
create policy "pixpack_characters_write_auth"
  on public.characters for insert
  to authenticated
  with check (true);

drop policy if exists "pixpack_characters_update_auth" on public.characters;
create policy "pixpack_characters_update_auth"
  on public.characters for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "pixpack_characters_delete_auth" on public.characters;
create policy "pixpack_characters_delete_auth"
  on public.characters for delete
  to authenticated
  using (true);

grant usage on schema public to anon, authenticated;
grant select on public.asset_packs to anon, authenticated;
grant select on public.pack_assets to anon, authenticated;
grant select on public.characters to anon, authenticated;
grant insert, update, delete on public.asset_packs to authenticated;
grant insert, update, delete on public.pack_assets to authenticated;
grant insert, update, delete on public.characters to authenticated;

-- ---------------------------------------------------------------------------
-- Seed：pack 行（素材文件上传后再跑 seed-player.sql）
-- ---------------------------------------------------------------------------

insert into public.asset_packs (slug, name, category, priority, version, byte_size)
values
  ('bootstrap', 'Bootstrap', 'bootstrap', 0, 1, 256),
  ('player', 'Player', 'player', 10, 1, 4096)
on conflict (slug) do nothing;
