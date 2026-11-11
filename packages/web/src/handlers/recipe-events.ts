import { DesktopAppId, DesktopEnvId, DockerAppId, getDesktopApp, getDockerApp } from '@distro-tailor/core';
import { getAddonCombos } from '../components/app-suites.js';
import { router } from '../state/router.js';
import { store } from '../state/store.js';
import { copyToClipboard, showToast } from '../utils/dom.js';
import { HandlerContext } from './context.js';

/** Recipe file tabs, add-on layers (Distrobox, Nix, Flatpak, desktop env, apps, Docker), combos, and copy buttons. */
export function bindRecipeEvents(ctx: HandlerContext): void {
  const { evaluation } = ctx;

  // Recipe Tabs
  document.querySelectorAll<HTMLButtonElement>('.recipe-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const idx = Number(tab.getAttribute('data-file-idx'));
      store.setActiveFileIndex(idx);
    });
  });

  // Distrobox toggle
  document.getElementById('btn-toggle-distrobox')?.addEventListener('click', () => {
    const nextVal = !store.getState().criteria.enableDistrobox;
    store.update({
      criteria: { ...store.getState().criteria, enableDistrobox: nextVal }
    });
    router.saveStateToUrl(store.getState());
    showToast(nextVal ? '✨ Distrobox enabled in Makefile!' : 'Distrobox disabled in Makefile', '🏛️');
  });

  // Desktop env selector
  document.querySelectorAll<HTMLButtonElement>('.btn-select-desktop-env').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const env = (e.currentTarget as HTMLElement).getAttribute('data-desktop-env') as DesktopEnvId;
      store.update({
        criteria: { ...store.getState().criteria, desktopEnv: env }
      });
      router.saveStateToUrl(store.getState());
      showToast(`✨ Desktop compositor set to ${env.toUpperCase()} in Makefile!`, '🖼️');
    });
  });

  // Nix & Flatpak toggles
  document.getElementById('btn-toggle-nix')?.addEventListener('click', () => {
    const nextVal = !store.getState().criteria.enableNix;
    store.update({
      criteria: { ...store.getState().criteria, enableNix: nextVal }
    });
    router.saveStateToUrl(store.getState());
    showToast(nextVal ? '✨ Nix package manager layer enabled!' : 'Nix package layer disabled', '❄️');
  });

  document.getElementById('btn-toggle-flatpak')?.addEventListener('click', () => {
    const nextVal = !store.getState().criteria.enableFlatpak;
    store.update({
      criteria: { ...store.getState().criteria, enableFlatpak: nextVal }
    });
    router.saveStateToUrl(store.getState());
    showToast(nextVal ? '✨ Flatpak sandbox layer enabled!' : 'Flatpak disabled', '📦');
  });

  // 1-Click Desktop Apps
  document.querySelectorAll<HTMLElement>('.btn-toggle-desktop-app').forEach((card) => {
    card.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const blocker = target.getAttribute('data-incompatible-reason');
      if (blocker) {
        showToast(blocker, '🚫');
        return;
      }

      const appId = target.getAttribute('data-app-id') as DesktopAppId;
      const list = store.getState().criteria.desktopApps || [];
      const newList = list.includes(appId) ? list.filter((id) => id !== appId) : [...list, appId];
      store.update({
        criteria: { ...store.getState().criteria, desktopApps: newList }
      });
      router.saveStateToUrl(store.getState());
      if (list.includes(appId)) {
        showToast(`Removed ${appId} from bootstrap-apps.sh`, '📦');
      } else {
        const app = getDesktopApp(appId);
        showToast(`✨ Added ${app?.name || appId} to bootstrap-apps.sh!`, app?.icon || '📦');
      }
    });
  });

  // Turnkey Docker App Layer
  document.querySelectorAll<HTMLElement>('.btn-select-docker-app').forEach((card) => {
    card.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const blocker = target.getAttribute('data-incompatible-reason');
      if (blocker) {
        showToast(blocker, '🚫');
        return;
      }

      const appId = target.getAttribute('data-docker-id') as DockerAppId;
      if (appId === 'none' || store.getState().criteria.dockerApp === appId) {
        store.update({
          criteria: { ...store.getState().criteria, dockerApp: undefined },
          activeFileIndex: 0
        });
        showToast('Set to pure minimal OS (no background containers)', '🚫');
      } else {
        store.update({
          criteria: { ...store.getState().criteria, dockerApp: appId },
          activeFileIndex: 1
        });
        const appDef = getDockerApp(appId);
        showToast(`✨ Configured ${appDef?.name || appId} in Makefile & docker-compose.yml!`, appDef?.icon || '🐳');
      }
      router.saveStateToUrl(store.getState());
    });
  });

  // Mix & Match Combos
  const combos = getAddonCombos(evaluation.bestMatch.distro.id);
  document.querySelectorAll<HTMLButtonElement>('.btn-toggle-combo').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = Number((e.currentTarget as HTMLElement).getAttribute('data-combo-idx'));
      const combo = combos[idx];
      if (!combo) return;

      const newCriteria = { ...store.getState().criteria };
      let newFileIndex = store.getState().activeFileIndex;

      if (combo.appliesDockerApp) {
        newCriteria.dockerApp =
          newCriteria.dockerApp === combo.appliesDockerApp ? undefined : combo.appliesDockerApp;
        newFileIndex = newCriteria.dockerApp ? 1 : 0;
      }
      if (combo.appliesDesktopEnv) {
        newCriteria.desktopEnv =
          newCriteria.desktopEnv === combo.appliesDesktopEnv ? undefined : combo.appliesDesktopEnv;
      }
      if (combo.appliesDistrobox) {
        newCriteria.enableDistrobox = !newCriteria.enableDistrobox;
      }

      store.update({
        criteria: newCriteria,
        activeFileIndex: newFileIndex
      });
      router.saveStateToUrl(store.getState());
      showToast(`✨ Updated build recipe with ${combo.title}!`, combo.icon || '🧩');
    });
  });

  // Copy Recipe Button
  document.getElementById('btn-copy-recipe')?.addEventListener('click', async () => {
    const file = evaluation.recommendedRecipe?.files[store.getState().activeFileIndex];
    if (file) {
      await copyToClipboard(file.content, 'Recipe file copied to clipboard!', '📋');
    }
  });

  // Copy Terminal CLI Command Button
  document.getElementById('btn-copy-cli')?.addEventListener('click', async () => {
    await copyToClipboard('npx @distro-tailor/cli', 'Copied "npx @distro-tailor/cli" to clipboard!', '💻');
  });
}
