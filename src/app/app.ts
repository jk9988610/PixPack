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

      const main = createMainScreen(root, {
        isConfigured: isSupabaseConfigured(),
        isSignedIn: signedIn,
        onSignIn: signInWithEmail,
        onSignOut: async () => {
          await signOut();
          main.setSignedIn(false);
        },
        onSave: async (payload: { file: File; meta: CharacterMeta; characterId?: string }) => {
          await saveCharacterSheet({
            file: payload.file,
            meta: payload.meta,
            characterId: payload.characterId,
            packSlug: 'player',
            name: '默认',
          });
        },
      });

      const playerPack = findPlayerPack(result.packs);
      if (!playerPack) throw new Error('player 资源包未加载');

      const player = new SpritePlayer(main.getCanvasMount());
      await player.init();
      await player.loadFromPack(playerPack);
      main.bindPlayer(player);

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
