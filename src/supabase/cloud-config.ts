/**
 * Supabase 凭证 — 与 Card-World / HarmonyForge 共用同一项目（URL / anon key 相同，桶名不同）。
 * 对照 Card-World：js/cloud-config.js
 */
export interface CloudConfig {
  url: string;
  anonKey: string;
}

/** 与 Card-World DEFAULT_CLOUD_CONFIG 相同项目 */
export const DEFAULT_CLOUD_CONFIG: CloudConfig = {
  url: 'https://yjqkotqmglxjhlrhynsu.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcWtvdHFtZ2x4amhscmh5bnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTMzNDQsImV4cCI6MjA5NTc2OTM0NH0.Cm4WjiR4NXS4RrA15frLVMZPbGUyGyjaIYQXSRua8Ew',
};

/** Storage bucket（Card-World 用 art，PixPack 用 pixpack-assets） */
export const PIXPACK_ASSETS_BUCKET = 'pixpack-assets';

const LS_CLOUD = 'pixpack-cloud-config';

export function getCloudConfig(): CloudConfig {
  try {
    const raw = localStorage.getItem(LS_CLOUD);
    if (raw) {
      const parsed = JSON.parse(raw) as CloudConfig;
      if (parsed?.url && parsed?.anonKey) return parsed;
    }
  } catch {
    /* ignore */
  }
  if (DEFAULT_CLOUD_CONFIG.url && DEFAULT_CLOUD_CONFIG.anonKey) {
    return { ...DEFAULT_CLOUD_CONFIG };
  }
  return { url: '', anonKey: '' };
}

export function isCloudEnabled(): boolean {
  const cfg = getCloudConfig();
  return Boolean(cfg.url && cfg.anonKey);
}
