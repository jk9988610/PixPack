import type { CharacterMeta } from '../types';
import { DIRECTION_IDS, DIRECTION_LABELS, buildCharacterMeta } from '../editor/directions';
import type { RepositoryItem } from '../supabase/repository';
import type { SpritePlayer } from '../pixi/spritePlayer';
import { createRepositoryPanel, type RepositoryPanelHandle } from './repositoryPanel';
import { createStudioPanel, type StudioPanelHandle } from './studioPanel';

export type MainView = 'preview' | 'studio' | 'repository';

export interface MainScreenOptions {
  onSignIn: (email: string) => Promise<string>;
  onSignOut: () => Promise<void>;
  onSave: (payload: {
    file: File;
    meta: CharacterMeta;
    characterId?: string;
    name: string;
  }) => Promise<string>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefreshRepository: () => Promise<RepositoryItem[]>;
  isConfigured: boolean;
  isSignedIn: boolean;
  repositoryItems: RepositoryItem[];
}

export interface MainScreenHandle {
  getCanvasMount(): HTMLElement;
  bindPlayer(player: SpritePlayer): void;
  setSignedIn(signedIn: boolean): void;
  showToast(message: string): void;
  setPrefetchStatus(text: string): void;
  switchView(view: MainView): void;
  setRepositoryItems(items: RepositoryItem[]): void;
  loadCharacter(item: RepositoryItem, objectUrl: string): Promise<void>;
  clearCharacter(): void;
  startNewCharacter(name?: string): void;
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
            <button type="button" class="view-tab" data-view="repository">仓库</button>
            <button type="button" class="view-tab active" data-view="preview">预览</button>
            <button type="button" class="view-tab" data-view="studio">画室</button>
          </div>
          <div data-preview-only>
            <h3>当前角色</h3>
            <p data-role-name>未加载</p>
            <h3>动作</h3>
            <label class="radio"><input type="radio" name="anim" value="idle" checked /> idle</label>
            <label class="radio"><input type="radio" name="anim" value="walk" /> walk</label>
            <h3>朝向</h3>
            <div class="direction-pad" data-direction-pad></div>
          </div>
        </aside>
        <section class="repo-panel hidden" data-repo-panel>
          <div data-repo-root></div>
        </section>
        <section class="stage-panel" data-preview-panel>
          <div class="canvas-wrap" data-canvas></div>
          <div class="frame-info" data-frame-info>未加载角色</div>
        </section>
        <section class="studio-panel hidden" data-studio-panel>
          <div data-studio-root></div>
        </section>
      </div>
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

  const roleNameEl = root.querySelector<HTMLElement>('[data-role-name]')!;
  const frameInfo = root.querySelector<HTMLElement>('[data-frame-info]')!;
  const previewPanel = root.querySelector<HTMLElement>('[data-preview-panel]')!;
  const repoPanel = root.querySelector<HTMLElement>('[data-repo-panel]')!;
  const studioPanel = root.querySelector<HTMLElement>('[data-studio-panel]')!;
  const studioRoot = root.querySelector<HTMLElement>('[data-studio-root]')!;
  const repoRoot = root.querySelector<HTMLElement>('[data-repo-root]')!;
  const authBtn = root.querySelector<HTMLButtonElement>('[data-auth-btn]')!;
  const authDialog = root.querySelector<HTMLDialogElement>('[data-auth-dialog]')!;
  const authForm = root.querySelector<HTMLFormElement>('[data-auth-form]')!;
  const authHint = root.querySelector<HTMLElement>('[data-auth-hint]')!;
  const prefetchEl = root.querySelector<HTMLElement>('[data-prefetch]')!;
  const configBadge = root.querySelector<HTMLElement>('[data-config-badge]')!;
  const toastEl = root.querySelector<HTMLElement>('[data-toast]')!;

  configBadge.textContent = options.isConfigured ? 'Supabase 已连接' : 'Supabase 未连接';

  let playerRef: SpritePlayer | null = null;
  let signedIn = options.isSignedIn;
  let rafId = 0;
  let currentView: MainView = 'repository';
  let repositoryItems = options.repositoryItems;
  let activeItem: RepositoryItem | null = null;
  let activeMeta: CharacterMeta = buildCharacterMeta();
  let newCharacterName = '新角色';

  const studio: StudioPanelHandle = createStudioPanel(studioRoot, {
    canSave: options.isConfigured,
    showToast,
    onDirectionChange: (direction) => playerRef?.setDirection(direction),
    onPreview: async (objectUrl) => {
      if (!playerRef) return;
      await playerRef.hotReload(objectUrl, activeMeta);
    },
    onSave: async (file) => {
      const savedId = await options.onSave({
        file,
        meta: activeMeta,
        characterId: activeItem?.id,
        name: activeItem?.name ?? newCharacterName,
      });
      const items = await options.onRefreshRepository();
      setRepositoryItems(items);
      const saved = items.find((i) => i.id === savedId) ?? items[0];
      if (saved) {
        await loadCharacterRecord(saved);
      }
      showToast('已保存到仓库');
    },
  });

  const repo: RepositoryPanelHandle = createRepositoryPanel(repoRoot, {
    items: repositoryItems,
    activeId: null,
    canEdit: options.isConfigured,
    onLoad: (item) => {
      void loadCharacterRecord(item).then(() => switchView('preview'));
    },
    onEdit: (item) => {
      void loadCharacterRecord(item).then(() => switchView('studio'));
    },
    onRename: options.onRename,
    onDelete: async (id) => {
      await options.onDelete(id);
      if (activeItem?.id === id) {
        clearCharacter();
      }
      setRepositoryItems(await options.onRefreshRepository());
      showToast('已删除');
    },
    onCreate: () => startNewCharacter(),
  });

  function setRepositoryItems(items: RepositoryItem[]): void {
    repositoryItems = items;
    repo.render(items, activeItem?.id ?? null);
  }

  async function loadCharacterRecord(item: RepositoryItem): Promise<void> {
    activeItem = item;
    activeMeta = item.meta;
    roleNameEl.textContent = item.name;
    const response = await fetch(item.sheetUrl, { cache: 'no-cache' });
    if (!response.ok) throw new Error('下载精灵图失败');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    await playerRef?.loadCharacter(item.meta, objectUrl);
    await studio.loadFromUrl(objectUrl);
    repo.render(repositoryItems, item.id);
  }

  function clearCharacter(): void {
    activeItem = null;
    activeMeta = buildCharacterMeta();
    roleNameEl.textContent = '未加载';
    frameInfo.textContent = '未加载角色';
    playerRef?.clear();
    void studio.resetGrid();
    repo.render(repositoryItems, null);
  }

  function startNewCharacter(name = '新角色'): void {
    newCharacterName = name;
    activeItem = null;
    activeMeta = buildCharacterMeta();
    roleNameEl.textContent = `${name}（未保存）`;
    playerRef?.clear();
    void studio.resetGrid();
    switchView('studio');
    showToast('新建角色：画完后点保存写入仓库');
  }

  function updateFrameInfo(): void {
    if (!playerRef || currentView !== 'preview') return;
    if (!playerRef.isLoaded()) {
      frameInfo.textContent = '未加载角色';
    } else {
      const { index, total, direction } = playerRef.getFrameInfo();
      const dirId = DIRECTION_IDS[direction] ?? 'e';
      const dirLabel = DIRECTION_LABELS[dirId] ?? dirId;
      frameInfo.textContent = `当前: ${playerRef.getAnimation()} · ${dirLabel} · 帧 ${index + 1}/${total}`;
    }
    rafId = requestAnimationFrame(updateFrameInfo);
  }

  const directionPad = root.querySelector<HTMLElement>('[data-direction-pad]')!;
  const padOrder = [1, 3, 2, 0] as const;
  padOrder.forEach((index) => {
    const id = DIRECTION_IDS[index]!;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `direction-pad-btn${index === 2 ? ' active' : ''}`;
    btn.textContent = DIRECTION_LABELS[id];
    btn.dataset.direction = String(index);
    btn.addEventListener('click', () => {
      playerRef?.setDirection(index);
      studio.setDirection(index);
      directionPad.querySelectorAll('.direction-pad-btn').forEach((el) => {
        el.classList.toggle('active', (el as HTMLElement).dataset.direction === String(index));
      });
    });
    directionPad.appendChild(btn);
  });

  root.querySelectorAll<HTMLButtonElement>('.view-tab').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view as MainView));
  });

  root.querySelectorAll<HTMLInputElement>('input[name="anim"]').forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) playerRef?.setAnimation(input.value);
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

  let toastTimer: number | undefined;
  function showToast(message: string): void {
    toastEl.textContent = message;
    toastEl.classList.remove('hidden');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.add('hidden'), 3200);
  }

  function switchView(view: MainView): void {
    currentView = view;
    root.querySelectorAll('.view-tab').forEach((el) => {
      el.classList.toggle('active', (el as HTMLElement).dataset.view === view);
    });
    repoPanel.classList.toggle('hidden', view !== 'repository');
    previewPanel.classList.toggle('hidden', view !== 'preview');
    studioPanel.classList.toggle('hidden', view !== 'studio');
    if (view === 'preview') updateFrameInfo();
  }

  switchView('repository');

  return {
    getCanvasMount: () => root.querySelector<HTMLElement>('[data-canvas]')!,
    bindPlayer(player) {
      playerRef = player;
      cancelAnimationFrame(rafId);
      updateFrameInfo();
    },
    setSignedIn(value) {
      signedIn = value;
      authBtn.textContent = value ? '退出' : '登录';
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
    setRepositoryItems,
    loadCharacter: loadCharacterRecord,
    clearCharacter,
    startNewCharacter,
  };
}
