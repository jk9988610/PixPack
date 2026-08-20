-- PixPack Supabase schema (MVP)
-- Run in Supabase SQL Editor after creating project

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
  byte_size int not null default 0
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

alter table public.asset_packs enable row level security;
alter table public.pack_assets enable row level security;
alter table public.characters enable row level security;

-- MVP: authenticated users can read; only authenticated can write (single-owner project)
create policy "packs_select_authenticated" on public.asset_packs
  for select to authenticated using (true);
create policy "packs_write_authenticated" on public.asset_packs
  for all to authenticated using (true) with check (true);

create policy "assets_select_authenticated" on public.pack_assets
  for select to authenticated using (true);
create policy "assets_write_authenticated" on public.pack_assets
  for all to authenticated using (true) with check (true);

create policy "characters_select_authenticated" on public.characters
  for select to authenticated using (true);
create policy "characters_write_authenticated" on public.characters
  for all to authenticated using (true) with check (true);

-- Anonymous read for GitHub Pages demo (optional — remove if you want auth-only read)
create policy "packs_select_anon" on public.asset_packs
  for select to anon using (true);
create policy "assets_select_anon" on public.pack_assets
  for select to anon using (true);
create policy "characters_select_anon" on public.characters
  for select to anon using (true);

-- Storage bucket (create in Dashboard: pixpack-assets, public read)
-- Policies: authenticated insert/update; public select

insert into public.asset_packs (slug, name, category, priority, version, byte_size)
values
  ('bootstrap', 'Bootstrap', 'bootstrap', 0, 1, 256),
  ('player', 'Player', 'player', 10, 1, 4096)
on conflict (slug) do nothing;

-- After uploading initial spritesheet to Storage, run seed-player.sql or use in-app upload
