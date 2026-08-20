import { fetchManifestPacks } from '../supabase/manifest';
import { isSupabaseConfigured, getSupabase } from '../supabase/client';
import type { LoadedPack, ProgressCallback } from '../types';

const STAGE_WEIGHTS: Array<{ key: string; label: string; weight: number }> = [
  { key: 'init', label: '初始化 PixiJS…', weight: 10 },
  { key: 'auth', label: '恢复登录会话…', weight: 10 },
  { key: 'manifest', label: '拉取 manifest…', weight: 10 },
  { key: 'bootstrap', label: '正在加载启动资源…', weight: 15 },
  { key: 'required', label: '正在加载玩家资源…', weight: 25 },
];

const ENTRY_THRESHOLD = 70;

function computePercent(completedWeight: number, partialRatio = 0): number {
  const total = STAGE_WEIGHTS.reduce((sum, s) => sum + s.weight, 0);
  return Math.min(99, Math.round(((completedWeight + partialRatio) / total) * 100));
}

async function downloadAsset(
  url: string,
  onChunk?: (loaded: number, total: number) => void,
): Promise<Blob> {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`下载失败 (${response.status}): ${url}`);
  }
  const total = Number(response.headers.get('content-length') ?? 0);
  if (!response.body || !total) {
    return response.blob();
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onChunk?.(loaded, total);
  }

  return new Blob(chunks as BlobPart[], { type: response.headers.get('content-type') ?? undefined });
}

async function loadSinglePack(
  slug: string,
  onProgress?: (ratio: number, label: string) => void,
): Promise<LoadedPack> {
  const [manifest] = await fetchManifestPacks([slug]);
  if (!manifest) throw new Error(`资源包 ${slug} 不存在`);

  const totalBytes = manifest.assets.reduce((sum, a) => sum + (a.byte_size || 1), 0) || 1;
  let loadedBytes = 0;

  const assets = await Promise.all(
    manifest.assets.map(async (asset) => {
      const blob = await downloadAsset(asset.public_url, (loaded, total) => {
        const prev = loadedBytes;
        loadedBytes = prev - (asset.byte_size || 0) + Math.min(loaded, total);
        onProgress?.(loadedBytes / totalBytes, `正在加载 ${slug}…`);
      });
      return {
        asset,
        blob,
        objectUrl: URL.createObjectURL(blob),
      };
    }),
  );

  onProgress?.(1, `${slug} 就绪`);
  return { manifest, assets };
}

export interface LoadPacksResult {
  packs: LoadedPack[];
  playerCharacterId: string | null;
}

export async function loadPacks(
  slugs: string[],
  onProgress?: ProgressCallback,
): Promise<LoadPacksResult> {
  let completedWeight = 0;
  const emit = (stage: string, partialRatio = 0) => {
    onProgress?.({
      percent: computePercent(completedWeight, partialRatio),
      stage,
      loadedBytes: 0,
      totalBytes: 0,
    });
  };

  emit(STAGE_WEIGHTS[0]!.label);
  await new Promise((r) => setTimeout(r, 120));
  completedWeight += STAGE_WEIGHTS[0]!.weight;

  emit(STAGE_WEIGHTS[1]!.label);
  if (isSupabaseConfigured()) {
    await getSupabase().auth.getSession();
  }
  completedWeight += STAGE_WEIGHTS[1]!.weight;

  emit(STAGE_WEIGHTS[2]!.label);
  await fetchManifestPacks(slugs);
  completedWeight += STAGE_WEIGHTS[2]!.weight;

  const loaded: LoadedPack[] = [];
  let playerCharacterId: string | null = null;

  for (const slug of slugs) {
    const stage =
      slug === 'bootstrap'
        ? STAGE_WEIGHTS[3]!
        : slug === 'player' || slug.includes('player')
          ? STAGE_WEIGHTS[4]!
          : STAGE_WEIGHTS[4]!;

    emit(stage.label);
    const partialStart = completedWeight;

    try {
      const pack = await loadSinglePack(slug, (_ratio, label) => {
        emit(label, stage.weight * _ratio);
      });
      loaded.push(pack);
      const character = pack.manifest.characters[0];
      if (character && slug === 'player') {
        playerCharacterId = character.id;
      }
    } catch (error) {
      throw error;
    }

    completedWeight = partialStart + stage.weight;
    emit(stage.label, stage.weight);
  }

  onProgress?.({
    percent: Math.max(ENTRY_THRESHOLD, computePercent(completedWeight)),
    stage: '资源就绪',
    loadedBytes: 0,
    totalBytes: 0,
  });

  return { packs: loaded, playerCharacterId };
}

const prefetchQueue: string[] = [];
let prefetchRunning = false;

export function prefetchPacks(slugs: string[]): void {
  for (const slug of slugs) {
    if (!prefetchQueue.includes(slug)) prefetchQueue.push(slug);
  }
  void runPrefetchQueue();
}

async function runPrefetchQueue(): Promise<void> {
  if (prefetchRunning) return;
  prefetchRunning = true;
  while (prefetchQueue.length) {
    const slug = prefetchQueue.shift();
    if (!slug) continue;
    try {
      await loadSinglePack(slug);
    } catch {
      // 后台预取失败不阻塞主流程
    }
  }
  prefetchRunning = false;
}

export function getEntryThreshold(): number {
  return ENTRY_THRESHOLD;
}

export function findPlayerPack(packs: LoadedPack[]): LoadedPack | undefined {
  return packs.find((p) => p.manifest.pack.slug === 'player');
}
