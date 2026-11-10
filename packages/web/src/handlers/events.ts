import {
  DesktopAppId,
  DesktopEnvId,
  DockerAppId,
  getDesktopApp,
  getDockerApp,
  Question,
  QuestionFlow,
  RecommendationOutput,
  UserCriteria
} from '@distro-tailor/core';
import { getAddonCombos } from '../components/app-suites.js';
import { triggerDeviceShare } from '../components/share-modal.js';
import { router } from '../state/router.js';
import { store } from '../state/store.js';
import { EventBinder } from '../types.js';
import { copyToClipboard, scrollToQuestionCard, showToast } from '../utils/dom.js';
import { generateMarkdownSummary } from '../utils/formatters.js';

let keyboardHandlerRegistered = false;

export const attachEventHandlers: EventBinder = (nextQuestion, evaluation, flow) => {
  const state = store.getState();

  const resetAll = (notice?: string) => {
    store.reset();
    router.resetLoopGuard();
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch (err) {
      console.warn('Failed to clean URL on reset:', err);
    }
    if (notice) showToast(notice, '⚠️');
  };

  // Brand click -> reset
  document.getElementById('nav-brand')?.addEventListener('click', () => {
    resetAll();
  });

  // Navigation tabs
  document.getElementById('btn-toggle-wizard')?.addEventListener('click', () => {
    store.setTab('wizard');
    router.saveStateToUrl(store.getState(), true);
    scrollToQuestionCard();
  });

  document.getElementById('btn-toggle-expert')?.addEventListener('click', () => {
    store.setTab('expert');
    router.saveStateToUrl(store.getState(), true);
  });

  document.getElementById('btn-view-results')?.addEventListener('click', () => {
    store.setTab('results');
    router.saveStateToUrl(store.getState(), true);
  });

  // Toggle All 31 Contenders in Leaderboard
  document.getElementById('btn-toggle-all-contenders')?.addEventListener('click', () => {
    store.toggleAllContenders();
  });
  document.getElementById('btn-header-distros-count')?.addEventListener('click', () => {
    store.toggleAllContenders();
  });
  document.getElementById('btn-quick-matrix')?.addEventListener('click', () => {
    store.setTab('expert');
    router.saveStateToUrl(store.getState(), true);
  });

  // Reset triggers
  document.getElementById('btn-reset')?.addEventListener('click', () => resetAll('Reset to fresh start'));
  document.getElementById('btn-start-fresh')?.addEventListener('click', () => resetAll('Reset to fresh start'));
  document.getElementById('btn-fallback-fresh')?.addEventListener('click', () => resetAll());
  document.getElementById('btn-fallback-expert')?.addEventListener('click', () => {
    store.update({ unsupportedSchemaNotice: undefined, activeTab: 'expert' });
    router.saveStateToUrl(store.getState(), true);
  });

  // Tweak choices from shared banner
  document.getElementById('btn-tweak-shared')?.addEventListener('click', () => {
    store.setTab('expert');
    router.saveStateToUrl(store.getState(), true);
  });

  // Share actions
  const openShareModal = () => {
    store.setShareModal(true);
  };

  document.getElementById('btn-share-header')?.addEventListener('click', openShareModal);
  document.getElementById('btn-share-match')?.addEventListener('click', openShareModal);
  document.getElementById('btn-share-sidebar')?.addEventListener('click', openShareModal);
  document.getElementById('btn-share-recipe')?.addEventListener('click', openShareModal);

  // Close Share Modal
  document.getElementById('btn-close-share-modal')?.addEventListener('click', () => {
    store.setShareModal(false);
  });

  document.getElementById('share-modal-backdrop')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'share-modal-backdrop') {
      store.setShareModal(false);
    }
  });

  // Share Modal copy buttons
  document.getElementById('btn-copy-share-url')?.addEventListener('click', () => {
    copyToClipboard(window.location.href, 'Direct permalink copied to clipboard!', '🔗');
  });

  document.getElementById('btn-copy-markdown-summary')?.addEventListener('click', () => {
    const md = generateMarkdownSummary(evaluation, state.criteria, window.location.href);
    copyToClipboard(md, 'Markdown summary copied! Ready to paste into Reddit, Discord, or GitHub.', '📋');
  });

  document.getElementById('btn-native-share')?.addEventListener('click', () => {
    triggerDeviceShare(evaluation, state.criteria);
  });

  // Remove choice chip
  document.querySelectorAll<HTMLButtonElement>('.btn-remove-choice').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = btn.getAttribute('data-remove-key');
      if (key) {
        store.removeChoice(key);
        router.saveStateToUrl(store.getState(), true);
        showToast(`Removed filter: ${key}`, '🗑️');
      }
    });
  });

  // Toggle Flow Mode
  document.getElementById('btn-toggle-flow-mode')?.addEventListener('click', () => {
    const isBeginner = state.criteria.experienceLevel === 'beginner' || !state.criteria.experienceLevel;
    const newMode = isBeginner ? 'expert' : 'smart';
    store.setFlowMode(newMode);
    store.update({
      criteria: {
        ...store.getState().criteria,
        experienceLevel: isBeginner ? 'intermediate' : 'beginner'
      }
    });
    router.saveStateToUrl(store.getState(), true);
  });

  // Wizard option selection buttons
  document.querySelectorAll<HTMLButtonElement>('.option-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const optId = btn.getAttribute('data-option-id');
      const opt = nextQuestion?.options.find((o) => o.id === optId);
      if (opt && nextQuestion) {
        btn.classList.remove('bg-slate-950/70', 'border-slate-700/60');
        btn.classList.add('bg-emerald-500/20', 'border-emerald-400', 'ring-2', 'ring-emerald-400', 'scale-[0.985]');

        setTimeout(() => {
          store.pushHistory();
          store.update({
            criteria: {
              ...store.getState().criteria,
              ...opt.appliesCriteria
            },
            answeredQuestionIds: new Set([...store.getState().answeredQuestionIds, nextQuestion.id])
          });
          router.saveStateToUrl(store.getState(), true);
          scrollToQuestionCard();
        }, 80);
      }
    });
  });

  // Back button
  document.getElementById('btn-back')?.addEventListener('click', () => {
    router.stepBack(() => {
      const popped = store.popHistory();
      if (popped) {
        router.saveStateToUrl(store.getState(), false);
        scrollToQuestionCard();
      }
    });
  });

  // Skip question button
  document.getElementById('btn-skip')?.addEventListener('click', () => {
    if (nextQuestion) {
      store.pushHistory();
      store.update({
        answeredQuestionIds: new Set([...store.getState().answeredQuestionIds, nextQuestion.id])
      });
      router.saveStateToUrl(store.getState(), true);
      scrollToQuestionCard();
    }
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

  // 1-Click Desktop Apps
  document.querySelectorAll<HTMLElement>('.btn-toggle-desktop-app').forEach((card) => {
    card.addEventListener('click', (e) => {
      const appId = (e.currentTarget as HTMLElement).getAttribute('data-app-id') as DesktopAppId;
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
      const appId = (e.currentTarget as HTMLElement).getAttribute('data-docker-id') as DockerAppId;
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

  // Expert Matrix inputs
  const bindExpertSelect = <K extends keyof UserCriteria>(id: string, key: K) => {
    document.getElementById(id)?.addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value;
      const newCrit = { ...store.getState().criteria };
      if (val) {
        newCrit[key] = val as UserCriteria[K];
      } else {
        delete newCrit[key];
      }
      store.update({ criteria: newCrit });
    });
  };

  bindExpertSelect('expert-arch', 'architecture');
  bindExpertSelect('expert-footprint', 'footprint');
  bindExpertSelect('expert-init', 'initPreference');
  bindExpertSelect('expert-clib', 'cLibPreference');
  bindExpertSelect('expert-state', 'statePreference');
  bindExpertSelect('expert-role', 'useCase');

  document.getElementById('btn-apply-expert')?.addEventListener('click', () => {
    store.setTab('results');
    router.saveStateToUrl(store.getState(), true);
  });

  // Keyboard navigation (registered once)
  if (!keyboardHandlerRegistered) {
    window.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target?.tagName)) return;

      const currentState = store.getState();
      if (currentState.activeTab === 'wizard') {
        const currentNext = flow.getNextQuestion(currentState.criteria, currentState.answeredQuestionIds);
        if (currentNext) {
          const num = parseInt(e.key, 10);
          if (!isNaN(num) && num >= 1 && num <= currentNext.options.length) {
            const opt = currentNext.options[num - 1];
            if (opt) {
              store.pushHistory();
              store.update({
                criteria: { ...store.getState().criteria, ...opt.appliesCriteria },
                answeredQuestionIds: new Set([...store.getState().answeredQuestionIds, currentNext.id])
              });
              router.saveStateToUrl(store.getState(), true);
              scrollToQuestionCard();
              return;
            }
          }
        }

        if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
          router.stepBack(() => {
            const popped = store.popHistory();
            if (popped) {
              router.saveStateToUrl(store.getState(), false);
              scrollToQuestionCard();
            }
          });
        }
      }

      if (e.key === 'Escape' && currentState.showShareModal) {
        store.setShareModal(false);
      }
    });
    keyboardHandlerRegistered = true;
  }
}
