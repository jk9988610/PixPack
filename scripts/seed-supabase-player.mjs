#!/usr/bin/env node
/**
 * 一次性种子：上传 demo 精灵图并在 Supabase 创建默认角色
 * 用法：node scripts/seed-supabase-player.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const URL = 'https://yjqkotqmglxjhlrhynsu.supabase.co';
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcWtvdHFtZ2x4amhscmh5bnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTMzNDQsImV4cCI6MjA5NTc2OTM0NH0.Cm4WjiR4NXS4RrA15frLVMZPbGUyGyjaIYQXSRua8Ew';
const BUCKET = 'pixpack-assets';
const STORAGE_PATH = 'assets/packs/player/v1/spritesheet.png';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pngPath = join(__dirname, '../public/demo/spritesheet.png');
const png = readFileSync(pngPath);

const headers = {
  apikey: ANON,
  Authorization: `Bearer ${ANON}`,
};

const FRAME_W = 8;
const FRAMES_PER_DIRECTION = 2;
const DIRECTION_COUNT = 4;
const TOTAL_FRAMES = FRAMES_PER_DIRECTION * DIRECTION_COUNT;

async function main() {
  const packRes = await fetch(
    `${URL}/rest/v1/asset_packs?slug=eq.player&select=id,version`,
    { headers: { ...headers, Accept: 'application/json' } },
  );
  const [pack] = await packRes.json();
  if (!pack) throw new Error('player pack 不存在，请先跑 SQL part1/part2');

  console.log('Uploading spritesheet…');
  const uploadRes = await fetch(`${URL}/storage/v1/object/${BUCKET}/${STORAGE_PATH}`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'image/png',
      'x-upsert': 'true',
    },
    body: png,
  });
  if (!uploadRes.ok) {
    throw new Error(`Upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
  }

  const publicUrl = `${URL}/storage/v1/object/public/${BUCKET}/${STORAGE_PATH}?v=1`;
  const meta = {
    frameWidth: FRAME_W,
    frameHeight: FRAME_W,
    scale: 6,
    filter: 'nearest',
    directions: ['s', 'n', 'e', 'w'],
    framesPerDirection: FRAMES_PER_DIRECTION,
    animations: {
      idle: { frames: [0], fps: 2, loop: true },
      walk: { frames: [1], fps: 4, loop: true },
    },
    frames: Array.from({ length: TOTAL_FRAMES }, (_, i) => ({
      x: (i % FRAMES_PER_DIRECTION) * FRAME_W,
      y: Math.floor(i / FRAMES_PER_DIRECTION) * FRAME_W,
    })),
  };

  await fetch(`${URL}/rest/v1/characters?pack_id=eq.${pack.id}`, {
    method: 'DELETE',
    headers,
  });
  await fetch(`${URL}/rest/v1/pack_assets?pack_id=eq.${pack.id}`, {
    method: 'DELETE',
    headers,
  });

  const assetRes = await fetch(`${URL}/rest/v1/pack_assets`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({
      pack_id: pack.id,
      kind: 'spritesheet',
      storage_path: STORAGE_PATH,
      public_url: publicUrl,
      byte_size: png.length,
    }),
  });
  const [asset] = await assetRes.json();
  if (!assetRes.ok) throw new Error(JSON.stringify(asset));

  const charRes = await fetch(`${URL}/rest/v1/characters`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({
      pack_id: pack.id,
      name: '默认',
      role: 'player',
      meta_json: meta,
      sheet_asset_id: asset.id,
    }),
  });
  const [character] = await charRes.json();
  if (!charRes.ok) throw new Error(JSON.stringify(character));

  await fetch(`${URL}/rest/v1/asset_packs?id=eq.${pack.id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ version: 1, byte_size: png.length }),
  });

  console.log('Done. character:', character.id);
  console.log('public_url:', publicUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
