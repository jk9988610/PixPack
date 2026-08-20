import type { CharacterMeta } from '../types';
import { DEFAULT_CHARACTER_META } from '../loader/demoData';
import type { SpritePlayer } from '../pixi/spritePlayer';

export interface MainScreenOptions {
  onSignIn: (email: string) => Promise<string>;
  onSignOut: () => Promise<void>;
  onSave: (payload: { file: File; meta: CharacterMeta; characterId?: string }) => Promise<void>;
  isConfigured: boolean;
  isSignedIn: boolean;
}

export interface MainScreenHandle {
  getCanvasMount(): HTMLElement;
  setAnimation(name: string): void;
  bindPlayer(player: SpritePlayer): void;
  setSignedIn(signedIn: boolean): void;
  showToast(message: string): void;
  setPrefetchStatus(text: string): void;
}

export function createMainScreen(root: HTMLElement, options: MainScreenOptions): MainScreenHandle {
  root.innerHTML = `
    <div class="main-layout">
      <header class="topbar">
        <div class="brand">PixPack · 素材工坊</div>
        <div class="topbar-actions">
          <span class="prefetch-badge hidden" data-prefetch></span>
          <span class="config-badge ${options.isConfigured ? 'ok' : 'warn'}" data-config-badge></span>
          <button class="btn btn-ghost" data-auth-btn>${options.isSignedIn ? '退出' : '登录'}</button>
        </div>
      </header>
      <div class="main-body">
        <aside class="sidebar">
          <h2>资源包</h2>
          <ul class="pack-list"><li class="active">▶ player</li></ul>
          <h3>角色</h3><p>默认</p>
          <h3>动作</h3>
          <label class="radio"><input type="radio" name="anim" value="idle" checked /> idle</label>
          <label class="radio"><input type="radio" name="anim" value="walk" /> walk</label>
        </aside>
        <section class="stage-panel">
          <div class="canvas-wrap" data-canvas></div>
          <div class="frame-info" data-frame-info>当前: idle  帧 1/4</div>
        </section>
      </div>
      <footer class="upload-bar">
        <label class="file-label">上传精灵图<input type="file" accept="image/png" data-file hidden /></label>
        <span class="meta-fields">帧宽 <input type="number" value="32" min="8" max="128" data-fw /> 高 <input type="number" value="32" min="8" max="128" data-fh /></span>
        <button class="btn btn-primary" data-save disabled>保存到 Supabase</button>
      </footer>
      <dialog class="auth-dialog" data-auth-dialog>
        <form data-auth-form>
          <h3>邮箱 Magic Link 登录</h3>
          <input type="email" required placeholder="your@email.com" data-email />
          <div class="dialog-actions">
            <button type="button" class="btn btn-ghost" data-auth-cancel>取消</button>
            <button type="submit" class="btn btn-primary">发送链接</button>
          </div>
          <p class="hint" data-auth-hint></p>
        </form>
      </dialog>
      <div class="toast hidden" data-toast></div>
    </div>
  `;

  const canvasWrap = root.querySelector<HTMLElement>('[data-canvas]')!;
  const frameInfo = root.querySelector<HTMLElement>('[data-frame-info]')!;
  const authBtn = root.querySelector<HTMLButtonElement>('[data-auth-btn]')!;
  const authDialog = root.querySelector<HTMLDialogElement>('[data-auth-dialog]')!;
  const authForm = root.querySelector<HTMLFormElement>('[data-auth-form]')!;
  const authHint = root.querySelector<HTMLElement>('[data-auth-hint]')!;
  const saveBtn = root.querySelector<HTMLButtonElement>('[data-save]')!;
  const fileInput = root.querySelector<HTMLInputElement>('[data-file]')!;
  const prefetchEl = root.querySelector<HTMLElement>('[data-prefetch]')!;
  const configBadge = root.querySelector<HTMLElement>('[data-config-badge]')!;
  const toastEl = root.querySelector<HTMLElement>('[data-toast]')!;

  configBadge.textContent = options.isConfigured ? 'Supabase 已连接' : 'Demo 模式（未配置 Supabase）';

  let playerRef: SpritePlayer | null = null;
  let pendingFile: File | null = null;
  let signedIn = options.isSignedIn;
  let rafId = 0;

  function buildMeta(): CharacterMeta {
    const fw = Number(root.querySelector<HTMLInputElement>('[data-fw]')!.value);
    const fh = Number(root.querySelector<HTMLInputElement>('[data-fh]')!.value);
    return {
      ...DEFAULT_CHARACTER_META,
      frameWidth: fw,
      frameHeight: fh,
      frames: DEFAULT_CHARACTER_META.frames.map((_, i) => ({ x: i * fw, y: 0 })),
    };
  }

  function updateFrameInfo(): void {
    if (!playerRef) return;
    const { index, total } = playerRef.getFrameInfo();
    frameInfo.textContent = `当前: ${playerRef.getAnimation()}  帧 ${index + 1}/${total}`;
    rafId = requestAnimationFrame(updateFrameInfo);
  }

  root.querySelectorAll<HTMLInputElement>('input[name="anim"]').forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) setAnimation(input.value);
    });
  });

  authBtn.addEventListener('click', async () => {
    if (signedIn) {
      await options.onSignOut();
      return;
    }
    authDialog.showModal();
  });

  root.querySelector('[data-auth-cancel]')?.addEventListener('click', () => authDialog.close());
  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = root.querySelector<HTMLInputElement>('[data-email]')!.value.trim();
    try {
      authHint.textContent = await options.onSignIn(email);
    } catch (error) {
      authHint.textContent = error instanceof Error ? error.message : '登录失败';
    }
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file || !playerRef) return;
    pendingFile = file;
    await playerRef.hotReload(URL.createObjectURL(file), buildMeta());
    saveBtn.disabled = !options.isConfigured;
    showToast('已本地预览新精灵图，可直接保存');
  });

  saveBtn.addEventListener('click', async () => {
    if (!pendingFile) {
      showToast('请先选择 PNG 文件');
      return;
    }
    try {
      saveBtn.disabled = true;
      await options.onSave({ file: pendingFile, meta: buildMeta() });
      showToast('保存成功');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '保存失败');
    } finally {
      saveBtn.disabled = !options.isConfigured || !pendingFile;
    }
  });

  let toastTimer: number | undefined;
  function showToast(message: string): void {
    toastEl.textContent = message;
    toastEl.classList.remove('hidden');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.add('hidden'), 3200);
  }

  function setAnimation(name: string): void {
    playerRef?.setAnimation(name);
  }

  return {
    getCanvasMount: () => canvasWrap,
    setAnimation,
    bindPlayer(player) {
      playerRef = player;
      cancelAnimationFrame(rafId);
      updateFrameInfo();
    },
    setSignedIn(value) {
      signedIn = value;
      authBtn.textContent = value ? '退出' : '登录';
      saveBtn.disabled = !options.isConfigured || !pendingFile;
    },
    showToast,
    setPrefetchStatus(text) {
      if (!text) {
        prefetchEl.classList.add('hidden');
        return;
      }
      prefetchEl.textContent = text;
      prefetchEl.classList.remove('hidden');
    },
  };
}
