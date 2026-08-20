import { loadPacks } from '../loader/packLoader';
import { SpritePlayer } from '../pixi/spritePlayer';
import {
  getSupabase,
  isSupabaseConfigured,
  onAuthStateChange,
  signInWithEmail,
  signOut,
} from '../supabase/client';
import {
  deleteRepositoryItem,
  listRepositoryItems,
  updateRepositoryItemName,
} from '../supabase/repository';
import { saveCharacterSheet } from '../supabase/upload';
import { createLoadingScreen } from '../ui/loadingScreen';
import { createMainScreen } from '../ui/mainScreen';

export async function startApp(root: HTMLElement): Promise<void> {
  const loading = createLoadingScreen(root);
  let signedIn = false;

  if (isSupabaseConfigured()) {
    const { data } = await getSupabase().auth.getSession();
    signedIn = Boolean(data.session);
  }

  const runBootstrap = async () => {
    try {
      await loadPacks(['bootstrap'], (p) => loading.update(p));
      loading.hide();

      let repositoryItems = isSupabaseConfigured() ? await listRepositoryItems() : [];

      const main = createMainScreen(root, {
        isConfigured: isSupabaseConfigured(),
        isSignedIn: signedIn,
        repositoryItems,
        onSignIn: signInWithEmail,
        onSignOut: async () => {
          await signOut();
          main.setSignedIn(false);
        },
        onSave: async (payload) => {
          return saveCharacterSheet({
            file: payload.file,
            meta: payload.meta,
            characterId: payload.characterId,
            packSlug: 'player',
            name: payload.name,
          });
        },
        onRename: updateRepositoryItemName,
        onDelete: deleteRepositoryItem,
        onRefreshRepository: listRepositoryItems,
      });

      const player = new SpritePlayer(main.getCanvasMount());
      await player.init();
      main.bindPlayer(player);

      if (!isSupabaseConfigured()) {
        main.showToast('Supabase 未连接，无法使用仓库');
      } else if (!repositoryItems.length) {
        main.showToast('仓库为空，请新建或在画室保存角色');
      } else {
        main.showToast('打开「仓库」选择角色加载');
      }

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
