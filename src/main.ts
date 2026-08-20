import { initSupabaseConfig } from './supabase/client';
import { startApp } from './app/app';
import './styles.css';

const root = document.querySelector<HTMLElement>('#app');
if (!root) {
  throw new Error('#app 未找到');
}

void initSupabaseConfig().then(() => startApp(root));
