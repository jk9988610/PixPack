import type { CharacterMeta } from '../types';
import { DIRECTION_IDS, DIRECTION_LABELS } from '../editor/directions';
import { DEFAULT_CHARACTER_META } from '../loader/demoData';
import type { SpritePlayer } from '../pixi/spritePlayer';
import { createStudioPanel, type StudioPanelHandle } from './studioPanel';

export type MainView = 'preview' | 'studio';

export interface MainScreenOptions {
  onSignIn: (email: string) => Promise<string>;
  onSignOut: () => Promise<void>;
  onSave: (payload: { file: File; meta: CharacterMeta; characterId?: string }) => Promise<void>;
  isConfigured: boolean;
  isSignedIn: boolean;
  placeholderPreview?: boolean;
  initialSheetUrl?: string;
}

export interface MainScreenHandle {
  getCanvasMount(): HTMLElement;
  setAnimation(name: string): void;
  setDirection(direction: number): void;
  bindPlayer(player: SpritePlayer): void;
  setSignedIn(signedIn: boolean): void;
  showToast(message: string): void;
  setPrefetchStatus(text: string): void;
  switchView(view: MainView): void;
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
          <h2>视图</h2>
          <div class="view-tabs">
            <button type="button" class="view-tab active" data-view="preview">预览</button>
            <button type="button" class="view-tab" data-view="studio">画室</button>
          </div>
          <h2>资源包</h2>
          <ul class="pack-list"><li class="active">▶ player</li></ul>
          <h3>角色</h3>
          <p data-role-name>${options.placeholderPreview ? '（预览占位，请保存）' : '默认'}</p>
          <div data-preview-only>
            <h3>动作</h3>
            <label class="radio"><input type="radio" name="anim" value="idle" checked /> idle</label>
            <label class="radio"><input type="radio" name="anim" value="walk" /> walk</label>
            <h3>朝向</h3>
            <div class="direction-pad" data-direction-pad></div>
          </div>
        </aside>
        <section class="stage-panel" data-preview-panel>
          <div class="canvas-wrap" data-canvas></div>
          <div class="frame-info" data-frame-info>当前: idle · 东 · 帧 1/4</div>
        </section>
        <section class="studio-panel hidden" data-studio-panel>
          <div data-studio-root></div>
        </section>
      </div>
      <footer class="upload-bar" data-preview-footer>
        <span class="upload-hint">也可在「画室」绘制并一键保存</span>
        <label class="file-label">上传 PNG<input type="file" accept="image/png" data-file hidden /></label>
        <button class="btn btn-primary" data-save-file disabled>保存文件</button>
      </footer>
    </div>
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
  `;

  const canvasWrap = root.querySelector<HTMLElement>('[data-canvas]')!;
  const frameInfo = root.querySelector<HTMLElement>('[data-frame-info]')!;
  const previewPanel = root.querySelector<HTMLElement>('[data-preview-panel]')!;
  const studioPanel = root.querySelector<HTMLElement>('[data-studio-panel]')!;
  const previewFooter = root.querySelector<HTMLElement>('[data-preview-footer]')!;
  const studioRoot = root.querySelector<HTMLElement>('[data-studio-root]')!;
  const authBtn = root.querySelector<HTMLButtonElement>('[data-auth-btn]')!;
  const authDialog = root.querySelector<HTMLDialogElement>('[data-auth-dialog]')!;
  const authForm = root.querySelector<HTMLFormElement>('[data-auth-form]')!;
  const authHint = root.querySelector<HTMLElement>('[data-auth-hint]')!;
  const saveFileBtn = root.querySelector<HTMLButtonElement>('[data-save-file]')!;
  const fileInput = root.querySelector<HTMLInputElement>('[data-file]')!;
  const prefetchEl = root.querySelector<HTMLElement>('[data-prefetch]')!;
  const configBadge = root.querySelector<HTMLElement>('[data-config-badge]')!;
  const toastEl = root.querySelector<HTMLElement>('[data-toast]')!;

  configBadge.textContent = options.isConfigured ? 'Supabase 已连接' : 'Supabase 未连接';

  let playerRef: SpritePlayer | null = null;
  let pendingFile: File | null = null;
  let signedIn = options.isSignedIn;
  let rafId = 0;
  let currentView: MainView = 'preview';

  const studio: StudioPanelHandle = createStudioPanel(studioRoot, {
    initialImageUrl: options.initialSheetUrl,
    canSave: options.isConfigured,
    showToast,
    onDirectionChange: (direction) => {
      playerRef?.setDirection(direction);
    },
    onPreview: async (objectUrl) => {
      if (!playerRef) return;
      await playerRef.hotReload(objectUrl, buildMeta());
    },
    onSave: async (file) => {
      await options.onSave({ file, meta: buildMeta() });
      pendingFile = file;
    },
  });

  function buildMeta(): CharacterMeta {
    return { ...DEFAULT_CHARACTER_META };
  }

  function updateFrameInfo(): void {
    if (!playerRef || currentView !== 'preview') return;
    const { index, total, direction } = playerRef.getFrameInfo();
    const dirId = DIRECTION_IDS[direction] ?? 'e';
    const dirLabel = DIRECTION_LABELS[dirId] ?? dirId;
    frameInfo.textContent = `当前: ${playerRef.getAnimation()} · ${dirLabel} · 帧 ${index + 1}/${total}`;
    rafId = requestAnimationFrame(updateFrameInfo);
  }

  const directionPad = root.querySelector<HTMLElement>('[data-direction-pad]')!;
  DIRECTION_IDS.forEach((id, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `direction-pad-btn${index === 6 ? ' active' : ''}`;
    btn.textContent = DIRECTION_LABELS[id];
    btn.title = id;
    btn.addEventListener('click', () => {
      setDirection(index);
      directionPad.querySelectorAll('.direction-pad-btn').forEach((el) => {
        el.classList.toggle('active', el === btn);
      });
      studio.setDirection(index);
    });
    directionPad.appendChild(btn);
  });

  root.querySelectorAll<HTMLButtonElement>('.view-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      switchView(btn.dataset.view as MainView);
    });
  });

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
    saveFileBtn.disabled = !options.isConfigured;
    void studio.loadFromUrl(URL.createObjectURL(file));
    showToast('已加载到预览与画室');
  });

  saveFileBtn.addEventListener('click', async () => {
    if (!pendingFile) {
      showToast('请先选择 PNG');
      return;
    }
    try {
      saveFileBtn.disabled = true;
      await options.onSave({ file: pendingFile, meta: buildMeta() });
      showToast('保存成功');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '保存失败');
    } finally {
      saveFileBtn.disabled = !options.isConfigured || !pendingFile;
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

  function setDirection(direction: number): void {
    playerRef?.setDirection(direction);
  }

  function switchView(view: MainView): void {
    currentView = view;
    root.querySelectorAll('.view-tab').forEach((el) => {
      el.classList.toggle('active', (el as HTMLElement).dataset.view === view);
    });
    previewPanel.classList.toggle('hidden', view !== 'preview');
    studioPanel.classList.toggle('hidden', view !== 'studio');
    previewFooter.classList.toggle('hidden', view !== 'preview');
    if (view === 'preview') updateFrameInfo();
  }

  return {
    getCanvasMount: () => canvasWrap,
    setAnimation,
    setDirection,
    bindPlayer(player) {
      playerRef = player;
      cancelAnimationFrame(rafId);
      updateFrameInfo();
    },
    setSignedIn(value) {
      signedIn = value;
      authBtn.textContent = value ? '退出' : '登录';
      saveFileBtn.disabled = !options.isConfigured || !pendingFile;
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
    switchView,
  };
}
