import { createClient, type SupabaseClient } from '@supabase/supabase-js';

interface RuntimeSupabaseConfig {
  url?: string;
  anonKey?: string;
}

let url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
let anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
let configLoaded = false;

function isValidConfig(candidateUrl?: string, candidateKey?: string): boolean {
  return Boolean(
    candidateUrl &&
      candidateKey &&
      !candidateUrl.includes('your-project') &&
      !candidateKey.includes('your-anon-key') &&
      candidateUrl.startsWith('https://'),
  );
}

export function isSupabaseConfigured(): boolean {
  return isValidConfig(url, anonKey);
}

/** 构建时 env 为空时，尝试加载 public/supabase-config.json（GitHub Pages 免 Secrets 方案） */
export async function initSupabaseConfig(): Promise<void> {
  if (configLoaded || isSupabaseConfigured()) {
    configLoaded = true;
    return;
  }

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}supabase-config.json`, {
      cache: 'no-cache',
    });
    if (!response.ok) return;

    const cfg = (await response.json()) as RuntimeSupabaseConfig;
    const nextUrl = cfg.url?.trim();
    const nextKey = cfg.anonKey?.trim();
    if (isValidConfig(nextUrl, nextKey)) {
      url = nextUrl;
      anonKey = nextKey;
      client = null;
    }
  } catch {
    // 无 runtime 配置时保持 Demo 模式
  } finally {
    configLoaded = true;
  }
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase 未配置：请设置 GitHub Secrets（VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY）或 public/supabase-config.json',
    );
  }
  if (!client) {
    client = createClient(url!, anonKey!);
  }
  return client;
}

export async function getSessionUserEmail(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session?.user.email ?? null;
}

export async function signInWithEmail(email: string): Promise<string> {
  const supabase = getSupabase();
  const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
  return '登录链接已发送到邮箱，请查收后点击链接完成登录。';
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await getSupabase().auth.signOut();
}

export function onAuthStateChange(callback: (signedIn: boolean) => void): () => void {
  if (!isSupabaseConfigured()) {
    callback(false);
    return () => undefined;
  }
  const supabase = getSupabase();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(Boolean(session));
  });
  return () => subscription.unsubscribe();
}
