import {
  DesktopAppId,
  DesktopEnvId,
  DockerAppId,
  EmulatorAppId,
  NavigationAppId,
  getDesktopApp,
  getDockerApp,
  getEmulatorApp,
  getNavigationApp
} from '@distro-tailor/core';
import { getAddonCombos } from '../components/app-suites.js';
import { router } from '../state/router.js';
import { store } from '../state/store.js';
import { copyToClipboard, showToast } from '../utils/dom.js';
import { generateRecipeBundleScript } from '../utils/recipe-bundle.js';
import { HandlerContext } from './context.js';

/** Recipe file tabs, add-on layers (Distrobox, Nix, Flatpak, desktop env, apps, Docker), combos, and copy buttons. */
export function bindRecipeEvents(ctx: HandlerContext): void {
  const { evaluation } = ctx;

  // Live filename sync for Prebuilt Verification Ladder commands
  const prebuiltInput = document.getElementById('input-prebuilt-filename') as HTMLInputElement | null;
  prebuiltInput?.addEventListener('input', () => {
    const fallback = prebuiltInput.getAttribute('data-default-filename') || 'distro.iso';
    const nextName = prebuiltInput.value.trim() || fallback;
    document.querySelectorAll<HTMLElement>('[data-iso-filename]').forEach((el) => {
      el.textContent = nextName;
    });
  });

  // Download All Recipe Files as a ready-to-run .sh bundle
  document.getElementById('btn-download-recipe-bundle')?.addEventListener('click', () => {
    const recipe = evaluation.recommendedRecipe;
    if (!recipe) return;
    const script = generateRecipeBundleScript(recipe);
    const blob = new Blob([script], { type: 'text/x-shellscript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipe.id}-bundle.sh`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${recipe.id}-bundle.sh (${recipe.files.length} files). Run: bash ${recipe.id}-bundle.sh`, '⬇️');
  });

  // Copy buttons inside Verification Ladder command boxes
  document.querySelectorAll<HTMLButtonElement>('.btn-copy-command').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cmd = btn.closest('[data-copy-box]')?.querySelector('code')?.textContent?.trim();
      if (cmd) {
        copyToClipboard(cmd, 'Command copied to clipboard!', '📋');
      }
    });
  });

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

  // Category Filter Pills & Live Search inside App/Service/Emulator Suites
  document.querySelectorAll<HTMLElement>('[data-suite-container]').forEach((container) => {
    let activePill = 'all';
    const searchInput = container.querySelector<HTMLInputElement>('[data-suite-search]');
    const pills = container.querySelectorAll<HTMLButtonElement>('[data-suite-pill]');
    const groups = container.querySelectorAll<HTMLElement>('[data-category-group]');
    const cards = container.querySelectorAll<HTMLElement>('[data-app-card]');
    const emptyMsg = container.querySelector<HTMLElement>('[data-suite-empty]');

    const applyFilter = () => {
      const query = (searchInput?.value || '').trim().toLowerCase();
      let totalVisible = 0;

      cards.forEach((card) => {
        const cat = card.getAttribute('data-app-category') || '';
        const selected = card.getAttribute('data-app-selected') === '1';
        const haystack = card.getAttribute('data-app-search') || '';
        const matchesPill = activePill === 'all' || (activePill === 'selected' ? selected : cat === activePill);
        const matchesQuery = !query || haystack.includes(query);
        const visible = matchesPill && matchesQuery;
        card.classList.toggle('hidden', !visible);
        if (visible) totalVisible++;
      });

      groups.forEach((group) => {
        const hasVisibleCard = Array.from(group.querySelectorAll<HTMLElement>('[data-app-card]')).some(
          (c) => !c.classList.contains('hidden')
        );
        group.classList.toggle('hidden', !hasVisibleCard);
      });

      if (emptyMsg) {
        emptyMsg.classList.toggle('hidden', totalVisible > 0);
      }
    };

    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        activePill = pill.getAttribute('data-suite-pill') || 'all';
        pills.forEach((p) => {
          const isCurrent = p === pill;
          p.classList.toggle('bg-emerald-500/20', isCurrent);
          p.classList.toggle('text-emerald-300', isCurrent);
          p.classList.toggle('border-emerald-500/40', isCurrent);
          p.classList.toggle('font-semibold', isCurrent);
          p.classList.toggle('bg-transparent', !isCurrent);
          p.classList.toggle('text-slate-400', !isCurrent);
          p.classList.toggle('border-transparent', !isCurrent);
        });
        applyFilter();
      });
    });

    searchInput?.addEventListener('input', applyFilter);
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

  // 1-Click Gaming & Retro Emulators
  document.querySelectorAll<HTMLElement>('.btn-toggle-emulator-app').forEach((card) => {
    card.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const blocker = target.getAttribute('data-incompatible-reason');
      if (blocker) {
        showToast(blocker, '🚫');
        return;
      }

      const appId = target.getAttribute('data-app-id') as EmulatorAppId;
      const list = store.getState().criteria.emulatorApps || [];
      const newList = list.includes(appId) ? list.filter((id) => id !== appId) : [...list, appId];
      store.update({
        criteria: { ...store.getState().criteria, emulatorApps: newList }
      });
      router.saveStateToUrl(store.getState());
      if (list.includes(appId)) {
        showToast(`Removed ${appId} from bootstrap-emulators.sh`, '🎮');
      } else {
        const app = getEmulatorApp(appId);
        showToast(`✨ Added ${app?.name || appId} to bootstrap-emulators.sh!`, app?.icon || '🎮');
      }
    });
  });

  // 1-Click Offline GPS & Navigation Apps
  document.querySelectorAll<HTMLElement>('.btn-toggle-navigation-app').forEach((card) => {
    card.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const blocker = target.getAttribute('data-incompatible-reason');
      if (blocker) {
        showToast(blocker, '🚫');
        return;
      }

      const appId = target.getAttribute('data-app-id') as NavigationAppId;
      const list = store.getState().criteria.navigationApps || [];
      const newList = list.includes(appId) ? list.filter((id) => id !== appId) : [...list, appId];
      store.update({
        criteria: { ...store.getState().criteria, navigationApps: newList }
      });
      router.saveStateToUrl(store.getState());
      if (list.includes(appId)) {
        showToast(`Removed ${appId} from bootstrap-navigation.sh`, '🧭');
      } else {
        const app = getNavigationApp(appId);
        showToast(`✨ Added ${app?.name || appId} to bootstrap-navigation.sh!`, app?.icon || '🧭');
      }
    });
  });

  // Turnkey Docker App Layer (Multi-Stack)
  document.querySelectorAll<HTMLElement>('.btn-select-docker-app').forEach((card) => {
    card.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const blocker = target.getAttribute('data-incompatible-reason');
      if (blocker) {
        showToast(blocker, '🚫');
        return;
      }

      const appId = target.getAttribute('data-docker-id') as DockerAppId;
      const current = store.getState().criteria;
      const existing = new Set<DockerAppId>(
        [...(current.dockerApps || []), ...(current.dockerApp && current.dockerApp !== 'none' ? [current.dockerApp] : [])]
      );

      if (appId === 'none') {
        store.update({
          criteria: { ...current, dockerApp: undefined, dockerApps: undefined },
          activeFileIndex: 0
        });
        showToast('Set to pure minimal OS (no background containers)', '🚫');
      } else {
        const wasSelected = existing.has(appId);
        if (wasSelected) {
          existing.delete(appId);
        } else {
          existing.add(appId);
        }
        const nextList = Array.from(existing);
        store.update({
          criteria: {
            ...current,
            dockerApp: nextList.length === 1 ? nextList[0] : undefined,
            dockerApps: nextList.length > 0 ? nextList : undefined
          },
          activeFileIndex: nextList.length > 0 ? 1 : 0
        });
        const appDef = getDockerApp(appId);
        if (wasSelected) {
          showToast(`Removed ${appDef?.name || appId} stack`, '🐳');
        } else {
          showToast(
            nextList.length > 1
              ? `✨ Added ${appDef?.name || appId} (stacks/${appId}/docker-compose.yml)`
              : `✨ Configured ${appDef?.name || appId} in Makefile & docker-compose.yml!`,
            appDef?.icon || '🐳'
          );
        }
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
