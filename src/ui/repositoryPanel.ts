import type { RepositoryItem } from '../supabase/repository';

export interface RepositoryPanelOptions {
  items: RepositoryItem[];
  activeId: string | null;
  canEdit: boolean;
  onLoad: (item: RepositoryItem) => void;
  onEdit: (item: RepositoryItem) => void;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCreate: () => void;
}

export interface RepositoryPanelHandle {
  render(items: RepositoryItem[], activeId: string | null): void;
}

export function createRepositoryPanel(
  root: HTMLElement,
  options: RepositoryPanelOptions,
): RepositoryPanelHandle {
  root.innerHTML = `
    <div class="repo-layout">
      <div class="repo-header">
        <h2>素材仓库</h2>
        <button type="button" class="btn btn-primary" data-create ${options.canEdit ? '' : 'disabled'}>新建角色</button>
      </div>
      <p class="repo-hint">从 Supabase 加载角色；选中后可预览或进入画室编辑。无条目时不显示精灵。</p>
      <ul class="repo-list" data-repo-list></ul>
    </div>
  `;

  const listEl = root.querySelector<HTMLElement>('[data-repo-list]')!;
  root.querySelector('[data-create]')?.addEventListener('click', () => options.onCreate());

  function render(items: RepositoryItem[], activeId: string | null): void {
    listEl.innerHTML = '';
    if (!items.length) {
      listEl.innerHTML = '<li class="repo-empty">仓库为空，点击「新建角色」或在画室保存</li>';
      return;
    }

    items.forEach((item) => {
      const li = document.createElement('li');
      li.className = `repo-item${item.id === activeId ? ' active' : ''}`;

      const thumb = document.createElement('img');
      thumb.className = 'repo-thumb';
      thumb.src = item.sheetUrl;
      thumb.alt = item.name;
      thumb.width = 36;
      thumb.height = 72;

      const body = document.createElement('div');
      body.className = 'repo-body';

      const nameInput = document.createElement('input');
      nameInput.className = 'repo-name-input';
      nameInput.value = item.name;
      nameInput.disabled = !options.canEdit;
      nameInput.addEventListener('change', () => {
        void options.onRename(item.id, nameInput.value.trim() || item.name);
      });

      const meta = document.createElement('p');
      meta.className = 'repo-meta';
      meta.textContent = `${item.packName} · ${item.meta.frameWidth}×${item.meta.frameHeight}`;

      const actions = document.createElement('div');
      actions.className = 'repo-actions';

      const loadBtn = document.createElement('button');
      loadBtn.type = 'button';
      loadBtn.className = 'btn btn-ghost';
      loadBtn.textContent = '加载';
      loadBtn.addEventListener('click', () => options.onLoad(item));

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-ghost';
      editBtn.textContent = '编辑';
      editBtn.addEventListener('click', () => options.onEdit(item));

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn btn-ghost repo-delete';
      deleteBtn.textContent = '删除';
      deleteBtn.disabled = !options.canEdit;
      deleteBtn.addEventListener('click', () => {
        if (!confirm(`确定删除「${item.name}」？此操作不可恢复。`)) return;
        void options.onDelete(item.id);
      });

      actions.append(loadBtn, editBtn, deleteBtn);
      body.append(nameInput, meta, actions);
      li.append(thumb, body);
      listEl.appendChild(li);
    });
  }

  render(options.items, options.activeId);

  return {
    render,
  };
}
