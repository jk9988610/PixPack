import {
  findPlayerPack,
  loadPacks,
  prefetchPacks,
} from '../loader/packLoader';
import { SpritePlayer } from '../pixi/spritePlayer';
import {
  getSupabase,
  isSupabaseConfigured,
  onAuthStateChange,
  signInWithEmail,
  signOut,
} from '../supabase/client';
import { saveCharacterSheet } from '../supabase/upload';
import { isPlaceholderCharacter } from '../supabase/manifest';
import { createLoadingScreen } from '../ui/loadingScreen';
import { createMainScreen } from '../ui/mainScreen';
import type { CharacterMeta } from '../types';

export async function startApp(root: HTMLElement): Promise<void> {
  const loading = createLoadingScreen(root);
  let signedIn = false;

  if (isSupabaseConfigured()) {
    const { data } = await getSupabase().auth.getSession();
    signedIn = Boolean(data.session);
  }

  const runBootstrap = async () => {
    try {
      const result = await loadPacks(['bootstrap', 'player'], (p) => loading.update(p));
      loading.hide();

      const playerPack = findPlayerPack(result.packs);
      if (!playerPack) throw new Error('player 资源包未加载');

      const characterId = playerPack.manifest.characters[0]?.id ?? null;
      const placeholderPreview = isPlaceholderCharacter(characterId ?? undefined);
      const sheetAsset = playerPack.assets.find(
        (a) => a.asset.kind === 'spritesheet' || a.asset.id === playerPack.manifest.characters[0]?.sheet_asset_id,
      );
      const initialSheetUrl = sheetAsset?.objectUrl;

      const main = createMainScreen(root, {
        isConfigured: isSupabaseConfigured(),
        isSignedIn: signedIn,
        placeholderPreview,
        initialSheetUrl,
        onSignIn: signInWithEmail,
        onSignOut: async () => {
          await signOut();
          main.setSignedIn(false);
        },
        onSave: async (payload: { file: File; meta: CharacterMeta; characterId?: string }) => {
          await saveCharacterSheet({
            file: payload.file,
            meta: payload.meta,
            characterId: placeholderPreview ? undefined : payload.characterId,
            packSlug: 'player',
            name: '默认',
          });
          main.showToast('保存成功，刷新页面后加载云端角色');
        },
      });

      const player = new SpritePlayer(main.getCanvasMount());
      await player.init();
      await player.loadFromPack(playerPack);
      main.bindPlayer(player);

      if (placeholderPreview && isSupabaseConfigured()) {
        main.showToast('可进入「画室」绘制角色，画完点保存');
      } else {
        main.showToast('左侧「画室」可绘制精灵并保存到 Supabase');
      }

      prefetchPacks([]);
      main.setPrefetchStatus('');

      onAuthStateChange((isIn) => {
        signedIn = isIn;
        main.setSignedIn(isIn);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载失败';
      loading.showError(`${message}，点击重试`, () => {
        root.innerHTML = '';
        void startApp(root);
      });
    }
  };

  await runBootstrap();
}
