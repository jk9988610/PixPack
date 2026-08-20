import { Application, Assets, Container, Rectangle, Sprite, Texture } from 'pixi.js';
import {
  DIRECTION_COUNT,
  directionIndex,
  isEightDirectionMeta,
  resolveTextureIndex,
  type DirectionId,
} from '../editor/directions';
import type { CharacterMeta, LoadedPack } from '../types';

export class SpritePlayer {
  private app: Application | null = null;
  private sprite: Sprite | null = null;
  private meta: CharacterMeta | null = null;
  private animation = 'idle';
  private direction = 6;
  private frameIndex = 0;
  private elapsed = 0;
  private textures: Texture[] = [];
  private mountEl: HTMLElement;

  constructor(mountEl: HTMLElement) {
    this.mountEl = mountEl;
  }

  async init(): Promise<void> {
    this.app = new Application();
    await this.app.init({
      background: '#1b1b2f',
      antialias: false,
      resizeTo: this.mountEl,
    });
    this.mountEl.replaceChildren(this.app.canvas);
    this.drawCheckerboard();
  }

  private drawCheckerboard(): void {
    if (!this.app) return;
    const grid = new Container();
    const tile = 16;
    const cols = Math.ceil(this.app.screen.width / tile) + 1;
    const rows = Math.ceil(this.app.screen.height / tile) + 1;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const g = new Sprite(Texture.WHITE);
        g.width = tile;
        g.height = tile;
        g.x = x * tile;
        g.y = y * tile;
        g.tint = (x + y) % 2 === 0 ? 0x25253a : 0x2f2f45;
        grid.addChild(g);
      }
    }
    this.app.stage.addChildAt(grid, 0);
  }

  async loadFromPack(pack: LoadedPack): Promise<void> {
    const character = pack.manifest.characters[0];
    const sheetAsset = pack.assets.find(
      (a) => a.asset.id === character?.sheet_asset_id || a.asset.kind === 'spritesheet',
    );
    if (!character || !sheetAsset) {
      throw new Error('player pack 缺少角色或精灵图');
    }

    this.meta = character.meta_json;
    const baseTexture = await Assets.load<Texture>({
      src: sheetAsset.objectUrl,
      parser: 'texture',
    });
    baseTexture.source.scaleMode = 'nearest';

    this.textures = this.meta.frames.map((frame) => {
      return new Texture({
        source: baseTexture.source,
        frame: new Rectangle(
          frame.x,
          frame.y,
          this.meta!.frameWidth,
          this.meta!.frameHeight,
        ),
      });
    });

    if (this.sprite) {
      this.sprite.destroy();
    }
    this.sprite = new Sprite(this.textures[0]!);
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(this.meta.scale);
    this.sprite.x = this.app!.screen.width / 2;
    this.sprite.y = this.app!.screen.height / 2;
    this.app!.stage.addChild(this.sprite);

    this.direction = isEightDirectionMeta(this.meta) ? 6 : 0;
    this.setAnimation('idle');
    this.app!.ticker.add(this.tick, this);
  }

  setAnimation(name: string): void {
    if (!this.meta?.animations[name]) return;
    this.animation = name;
    this.frameIndex = 0;
    this.elapsed = 0;
    this.applyFrame();
  }

  setDirection(id: DirectionId | number): void {
    if (!this.meta) return;
    const next = typeof id === 'number' ? id : directionIndex(id);
    if (next < 0 || next >= DIRECTION_COUNT) return;
    this.direction = next;
    this.applyFrame();
  }

  getDirection(): number {
    return this.direction;
  }

  getAnimation(): string {
    return this.animation;
  }

  getFrameInfo(): { index: number; total: number; direction: number } {
    const anim = this.meta?.animations[this.animation];
    return {
      index: this.frameIndex,
      total: anim?.frames.length ?? 0,
      direction: this.direction,
    };
  }

  async hotReload(objectUrl: string, meta: CharacterMeta): Promise<void> {
    if (!this.app) return;
    this.meta = meta;
    if (!isEightDirectionMeta(meta)) {
      this.direction = 0;
    }
    const baseTexture = await Assets.load<Texture>({ src: objectUrl, parser: 'texture' });
    baseTexture.source.scaleMode = 'nearest';
    this.textures = meta.frames.map(
      (frame) =>
        new Texture({
          source: baseTexture.source,
          frame: new Rectangle(frame.x, frame.y, meta.frameWidth, meta.frameHeight),
        }),
    );
    this.applyFrame();
  }

  private tick = (): void => {
    if (!this.meta || !this.sprite) return;
    const anim = this.meta.animations[this.animation];
    if (!anim) return;
    this.elapsed += this.app!.ticker.deltaMS / 1000;
    const frameDuration = 1 / anim.fps;
    if (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;
      this.frameIndex += 1;
      if (this.frameIndex >= anim.frames.length) {
        this.frameIndex = anim.loop ? 0 : anim.frames.length - 1;
      }
      this.applyFrame();
    }
  };

  private applyFrame(): void {
    if (!this.meta || !this.sprite) return;
    const anim = this.meta.animations[this.animation];
    const frameInDirection = anim.frames[this.frameIndex] ?? anim.frames[0] ?? 0;
    const textureIndex = resolveTextureIndex(this.meta, this.direction, frameInDirection);
    const texture = this.textures[textureIndex];
    if (texture) this.sprite.texture = texture;
  }

  destroy(): void {
    this.app?.ticker.remove(this.tick, this);
    this.app?.destroy(true);
    this.app = null;
  }
}
