import {
  createArtHistory,
  pushArtHistory,
  redoArtHistory,
  resetArtHistory,
  undoArtHistory,
} from '../editor/history';
import {
  BONE_OPTIONS,
  createDefaultSkinGrid,
  fillBoneOnFrame,
  floodFillBone,
  getSkeletonGuideColor,
  isPaintable,
  mergeAllSkinWithSkeleton,
  type BoneId,
} from '../editor/skeleton';
import {
  CANVAS_ZOOM,
  FRAME_COUNT,
  FRAME_H,
  FRAME_W,
  PRESET_PALETTE,
  gridIndex,
  gridToPngBlob,
  loadGridFromImageUrl,
  localToGlobal,
  type Tool,
} from '../editor/spriteSheetEditor';

export interface StudioPanelOptions {
  initialImageUrl?: string;
  onPreview: (objectUrl: string) => Promise<void>;
  onSave: (file: File) => Promise<void>;
  canSave: boolean;
  showToast: (msg: string) => void;
}

export interface StudioPanelHandle {
  loadFromUrl(url: string): Promise<void>;
}

export function createStudioPanel(
  root: HTMLElement,
  options: StudioPanelOptions,
): StudioPanelHandle {
  root.innerHTML = `
    <div class="studio-layout">
      <div class="studio-toolbar">
        <div class="studio-group">
          <span class="studio-label">帧</span>
          <div class="frame-tabs" data-frame-tabs></div>
        </div>
        <div class="studio-group">
          <span class="studio-label">工具</span>
          <button type="button" class="btn btn-ghost studio-tool active" data-tool="brush">画笔</button>
          <button type="button" class="btn btn-ghost studio-tool" data-tool="eraser">橡皮</button>
          <button type="button" class="btn btn-ghost studio-tool" data-tool="fill">填充</button>
          <button type="button" class="btn btn-ghost studio-tool" data-tool="picker">吸管</button>
          <button type="button" class="btn btn-ghost" data-undo>撤销</button>
          <button type="button" class="btn btn-ghost" data-redo>重做</button>
        </div>
        <div class="studio-group">
          <span class="studio-label">骨骼</span>
          <div class="bone-tabs" data-bone-tabs></div>
        </div>
        <div class="studio-group palette-row" data-palette></div>
        <input type="color" data-color value="#e94560" class="color-input" />
      </div>
      <div class="studio-canvas-wrap">
        <canvas width="${FRAME_W * CANVAS_ZOOM}" height="${FRAME_H * CANVAS_ZOOM}" data-pixel-canvas class="pixel-canvas"></canvas>
        <p class="studio-hint">16×16 单帧 · 骨骼蒙皮 · 放大 ${CANVAS_ZOOM}× · idle 0–3 · walk 4–9</p>
      </div>
      <div class="studio-actions">
        <button type="button" class="btn btn-ghost" data-apply-preview>应用到预览</button>
        <button type="button" class="btn btn-primary" data-save-studio>保存到 Supabase</button>
      </div>
    </div>
  `;

  const canvas = root.querySelector<HTMLCanvasElement>('[data-pixel-canvas]')!;
  const ctx = canvas.getContext('2d')!;
  const frameTabs = root.querySelector<HTMLElement>('[data-frame-tabs]')!;
  const boneTabs = root.querySelector<HTMLElement>('[data-bone-tabs]')!;
  const paletteEl = root.querySelector<HTMLElement>('[data-palette]')!;
  const colorInput = root.querySelector<HTMLInputElement>('[data-color]')!;
  const saveBtn = root.querySelector<HTMLButtonElement>('[data-save-studio]')!;

  let grid = createDefaultSkinGrid();
  const history = createArtHistory();
  resetArtHistory(history, grid);

  let currentFrame = 0;
  let tool: Tool = 'brush';
  let color = colorInput.value;
  let drawing = false;
  let strokeDirty = false;
  let previewTimer: number | undefined;

  for (let i = 0; i < FRAME_COUNT; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `frame-tab${i === 0 ? ' active' : ''}`;
    btn.textContent = String(i);
    btn.title = i < 4 ? `idle ${i}` : `walk ${i - 4}`;
    btn.addEventListener('click', () => selectFrame(i));
    frameTabs.appendChild(btn);
  }

  BONE_OPTIONS.forEach(({ id, label }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bone-btn';
    btn.textContent = label;
    btn.title = `用当前颜色填充「${label}」`;
    btn.addEventListener('click', () => fillBone(id));
    boneTabs.appendChild(btn);
  });

  PRESET_PALETTE.forEach((swatch, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `swatch${idx === 2 ? ' active' : ''}`;
    btn.style.background = swatch === 'transparent' ? 'repeating-conic-gradient(#444 0% 25%, #222 0% 50%) 50% / 12px 12px' : swatch;
    btn.title = swatch;
    btn.addEventListener('click', () => {
      if (swatch !== 'transparent') colorInput.value = swatch;
      color = swatch;
      paletteEl.querySelectorAll('.swatch').forEach((el) => el.classList.remove('active'));
      btn.classList.add('active');
    });
    paletteEl.appendChild(btn);
  });

  colorInput.addEventListener('input', () => {
    color = colorInput.value;
    tool = 'brush';
    updateToolButtons();
  });

  root.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((btn) => {
    btn.addEventListener('click', () => {
      tool = btn.dataset.tool as Tool;
      updateToolButtons();
    });
  });

  root.querySelector('[data-undo]')?.addEventListener('click', () => {
    const prev = undoArtHistory(history);
    if (prev) {
      grid = prev;
      redraw();
    }
  });

  root.querySelector('[data-redo]')?.addEventListener('click', () => {
    const next = redoArtHistory(history);
    if (next) {
      grid = next;
      redraw();
    }
  });

  root.querySelector('[data-apply-preview]')?.addEventListener('click', () => {
    void applyPreview();
  });

  saveBtn.addEventListener('click', () => {
    void saveToCloud();
  });

  saveBtn.disabled = !options.canSave;

  function updateToolButtons(): void {
    root.querySelectorAll<HTMLButtonElement>('.studio-tool').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
  }

  function selectFrame(index: number): void {
    currentFrame = index;
    frameTabs.querySelectorAll('.frame-tab').forEach((el, i) => {
      el.classList.toggle('active', i === index);
    });
    redraw();
  }

  function cellFromEvent(e: PointerEvent): { lx: number; ly: number } | null {
    const rect = canvas.getBoundingClientRect();
    const lx = Math.floor(((e.clientX - rect.left) / rect.width) * FRAME_W);
    const ly = Math.floor(((e.clientY - rect.top) / rect.height) * FRAME_H);
    if (lx < 0 || ly < 0 || lx >= FRAME_W || ly >= FRAME_H) return null;
    return { lx, ly };
  }

  function getCellColor(lx: number, ly: number): string {
    const { x, y } = localToGlobal(currentFrame, lx, ly);
    return grid[gridIndex(x, y)] ?? 'transparent';
  }

  function setCellColor(lx: number, ly: number, value: string): void {
    if (!isPaintable(currentFrame, lx, ly)) return;
    const { x, y } = localToGlobal(currentFrame, lx, ly);
    grid[gridIndex(x, y)] = value;
  }

  function fillBone(bone: BoneId): void {
    fillBoneOnFrame(grid, currentFrame, bone, color);
    pushArtHistory(history, grid);
    redraw();
    schedulePreview();
  }

  function applyTool(lx: number, ly: number): void {
    if (!isPaintable(currentFrame, lx, ly)) return;

    if (tool === 'picker') {
      const picked = getCellColor(lx, ly);
      if (picked !== 'transparent') {
        color = picked;
        colorInput.value = picked;
      }
      return;
    }
    if (tool === 'fill') {
      if (floodFillBone(grid, currentFrame, lx, ly, color)) strokeDirty = true;
      redraw();
      return;
    }
    const value = tool === 'eraser' ? 'transparent' : color;
    setCellColor(lx, ly, value);
    strokeDirty = true;
    redraw();
  }

  function commitStroke(): void {
    if (!strokeDirty) return;
    pushArtHistory(history, grid);
    strokeDirty = false;
    schedulePreview();
  }

  function schedulePreview(): void {
    window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(() => {
      void applyPreview();
    }, 400);
  }

  function redraw(): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = canvas.width / FRAME_W;

    for (let ly = 0; ly < FRAME_H; ly++) {
      for (let lx = 0; lx < FRAME_W; lx++) {
        const guide = getSkeletonGuideColor(currentFrame, lx, ly);
        if (guide) {
          ctx.fillStyle = guide;
          ctx.fillRect(lx * scale, ly * scale, scale, scale);
        }
      }
    }

    for (let ly = 0; ly < FRAME_H; ly++) {
      for (let lx = 0; lx < FRAME_W; lx++) {
        const c = getCellColor(lx, ly);
        if (c === 'transparent') continue;
        ctx.fillStyle = c;
        ctx.fillRect(lx * scale, ly * scale, scale, scale);
      }
    }

    ctx.strokeStyle = '#e9456088';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
  }

  function prepareGridForExport(): string[] {
    const copy = [...grid];
    mergeAllSkinWithSkeleton(copy);
    return copy;
  }

  async function applyPreview(): Promise<void> {
    const blob = await gridToPngBlob(prepareGridForExport());
    await options.onPreview(URL.createObjectURL(blob));
  }

  async function saveToCloud(): Promise<void> {
    if (!options.canSave) {
      options.showToast('Supabase 未连接');
      return;
    }
    try {
      saveBtn.disabled = true;
      saveBtn.textContent = '保存中…';
      const blob = await gridToPngBlob(prepareGridForExport());
      const file = new File([blob], 'spritesheet.png', { type: 'image/png' });
      await options.onSave(file);
      options.showToast('已保存到 Supabase，刷新后加载云端版本');
    } catch (error) {
      options.showToast(error instanceof Error ? error.message : '保存失败');
    } finally {
      saveBtn.disabled = !options.canSave;
      saveBtn.textContent = '保存到 Supabase';
    }
  }

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    drawing = true;
    const cell = cellFromEvent(e);
    if (cell) applyTool(cell.lx, cell.ly);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const cell = cellFromEvent(e);
    if (cell && tool !== 'fill' && tool !== 'picker') applyTool(cell.lx, cell.ly);
  });

  canvas.addEventListener('pointerup', () => {
    drawing = false;
    commitStroke();
  });

  canvas.addEventListener('pointerleave', () => {
    if (drawing) {
      drawing = false;
      commitStroke();
    }
  });

  async function loadFromUrl(url: string): Promise<void> {
    grid = await loadGridFromImageUrl(url);
    mergeAllSkinWithSkeleton(grid);
    resetArtHistory(history, grid);
    redraw();
  }

  redraw();
  void applyPreview();

  if (options.initialImageUrl) {
    void loadFromUrl(options.initialImageUrl).catch(() => undefined);
  }

  return { loadFromUrl };
}
