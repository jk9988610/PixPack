import type { LoadProgress } from '../types';

export interface LoadingScreenHandle {
  update(progress: LoadProgress): void;
  showError(message: string, onRetry: () => void): void;
  hide(): void;
}

export function createLoadingScreen(root: HTMLElement): LoadingScreenHandle {
  root.innerHTML = `
    <div class="loading-screen">
      <div class="loading-card">
        <div class="logo">PixPack</div>
        <p class="loading-subtitle">素材工坊</p>
        <div class="progress-track">
          <div class="progress-bar" data-progress-bar></div>
        </div>
        <div class="progress-text">
          <span data-progress-percent>0%</span>
          <span data-progress-stage>准备中…</span>
        </div>
        <button class="btn btn-secondary hidden" data-retry>重试</button>
      </div>
    </div>
  `;

  const bar = root.querySelector<HTMLElement>('[data-progress-bar]')!;
  const percentEl = root.querySelector<HTMLElement>('[data-progress-percent]')!;
  const stageEl = root.querySelector<HTMLElement>('[data-progress-stage]')!;
  const retryBtn = root.querySelector<HTMLButtonElement>('[data-retry]')!;

  return {
    update({ percent, stage }) {
      bar.style.width = `${percent}%`;
      percentEl.textContent = `${percent}%`;
      stageEl.textContent = stage;
      retryBtn.classList.add('hidden');
    },
    showError(message, onRetry) {
      stageEl.textContent = message;
      retryBtn.classList.remove('hidden');
      retryBtn.onclick = onRetry;
    },
    hide() {
      root.innerHTML = '';
    },
  };
}
