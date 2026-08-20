-- PixPack 第 2 段：Storage 策略 + 初始 pack + 验证（第 1 段成功后 Run）

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

insert into public.asset_packs (slug, name, category, priority, version, byte_size)
values
  ('bootstrap', 'Bootstrap', 'bootstrap', 0, 1, 256),
  ('player', 'Player', 'player', 10, 1, 4096)
on conflict (slug) do nothing;

select slug, name, category, version from public.asset_packs order by priority;
