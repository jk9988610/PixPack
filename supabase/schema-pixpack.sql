-- =============================================================================
-- PixPack — 素材工坊（Supabase SQL Editor · 文件 1/3）
-- =============================================================================
-- RLS：完全公开（对照 Card-World art_shop_works / art 桶 — anon 可读写）
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

alter table public.asset_packs enable row level security;
alter table public.pack_assets enable row level security;
alter table public.characters enable row level security;

-- 清理旧版「仅 authenticated 可写」策略（若曾执行过）
drop policy if exists "pixpack_packs_write_auth" on public.asset_packs;
drop policy if exists "pixpack_packs_update_auth" on public.asset_packs;
drop policy if exists "pixpack_packs_delete_auth" on public.asset_packs;
drop policy if exists "pixpack_assets_write_auth" on public.pack_assets;
drop policy if exists "pixpack_assets_update_auth" on public.pack_assets;
drop policy if exists "pixpack_assets_delete_auth" on public.pack_assets;
drop policy if exists "pixpack_characters_write_auth" on public.characters;
drop policy if exists "pixpack_characters_update_auth" on public.characters;
drop policy if exists "pixpack_characters_delete_auth" on public.characters;

-- 公开读写（Card-World 同款 open RLS）
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

insert into public.asset_packs (slug, name, category, priority, version, byte_size)
values
  ('bootstrap', 'Bootstrap', 'bootstrap', 0, 1, 256),
  ('player', 'Player', 'player', 10, 1, 4096)
on conflict (slug) do nothing;
