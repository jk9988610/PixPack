export interface ArtHistory {
  stack: string[][];
  index: number;
  max: number;
}

export function createArtHistory(max = 40): ArtHistory {
  return { stack: [], index: -1, max };
}

export function pushArtHistory(hist: ArtHistory, grid: string[]): void {
  const snap = grid.slice();
  if (hist.index < hist.stack.length - 1) {
    hist.stack = hist.stack.slice(0, hist.index + 1);
  }
  hist.stack.push(snap);
  if (hist.stack.length > hist.max) hist.stack.shift();
  hist.index = hist.stack.length - 1;
}

export function canUndo(hist: ArtHistory): boolean {
  return hist.index > 0;
}

export function canRedo(hist: ArtHistory): boolean {
  return hist.index >= 0 && hist.index < hist.stack.length - 1;
}

export function undoArtHistory(hist: ArtHistory): string[] | null {
  if (!canUndo(hist)) return null;
  hist.index -= 1;
  return hist.stack[hist.index]!.slice();
}

export function redoArtHistory(hist: ArtHistory): string[] | null {
  if (!canRedo(hist)) return null;
  hist.index += 1;
  return hist.stack[hist.index]!.slice();
}

export function resetArtHistory(hist: ArtHistory, grid: string[]): void {
  hist.stack = [grid.slice()];
  hist.index = 0;
}
