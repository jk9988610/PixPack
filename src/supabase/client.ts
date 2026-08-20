import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getCloudConfig } from './cloud-config';

function isValidConfig(candidateUrl?: string, candidateKey?: string): boolean {
  return Boolean(
    candidateUrl &&
      candidateKey &&
      !candidateUrl.includes('your-project') &&
      !candidateKey.includes('your-anon-key') &&
      candidateUrl.startsWith('https://'),
  );
}

function resolveConfig(): { url: string; anonKey: string } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
  if (isValidConfig(envUrl, envKey)) {
    return { url: envUrl!, anonKey: envKey! };
  }
  const cloud = getCloudConfig();
  if (isValidConfig(cloud.url, cloud.anonKey)) {
    return cloud;
  }
  return { url: '', anonKey: '' };
}

export function isSupabaseConfigured(): boolean {
  const cfg = resolveConfig();
  return isValidConfig(cfg.url, cfg.anonKey);
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase 未配置');
  }
  if (!client) {
    const cfg = resolveConfig();
    client = createClient(cfg.url, cfg.anonKey);
  }
  return client;
}

export function resetSupabaseClient(): void {
  client = null;
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
