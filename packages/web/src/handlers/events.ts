import {
  DesktopAppId,
  DesktopEnvId,
  DockerAppId,
  getDesktopApp,
  getDockerApp,
  PeripheralNeed,
  Question,
  QuestionFlow,
  QUESTIONS,
  RecommendationOutput,
  UserCriteria
} from '@distro-tailor/core';
import { getAddonCombos } from '../components/app-suites.js';
import { triggerDeviceShare } from '../components/share-modal.js';
import { EXPERT_FIELDS } from '../data/expert-options.js';
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
    router.saveStateToUrl(store.getState(), false);
    scrollToQuestionCard();
  });

  document.getElementById('btn-toggle-expert')?.addEventListener('click', () => {
    store.setTab('expert');
    router.saveStateToUrl(store.getState(), false);
  });

  document.getElementById('btn-view-results')?.addEventListener('click', () => {
    store.setTab('results');
    router.saveStateToUrl(store.getState(), false);
  });

  // Early high-confidence match fast-track button
  document.getElementById('btn-early-results')?.addEventListener('click', () => {
    store.setTab('results');
    router.saveStateToUrl(store.getState(), false);
  });

  // Return to wizard from results to review or modify choices
  const returnToWizard = () => {
    const eligible = flow.getEligibleQuestions(store.getState().criteria);
    const answeredEligible = eligible.filter((q) => store.getState().answeredQuestionIds.has(q.id));
    const targetQ = answeredEligible.length > 0 ? answeredEligible[answeredEligible.length - 1] : eligible[0];
    if (targetQ) {
      store.setViewingQuestion(targetQ.id);
    }
    store.setTab('wizard');
    router.saveStateToUrl(store.getState(), false);
    scrollToQuestionCard();
  };
  document.getElementById('btn-modify-answers')?.addEventListener('click', returnToWizard);
  document.getElementById('btn-tweak-blueprint')?.addEventListener('click', returnToWizard);
  document.getElementById('btn-tweak-shared')?.addEventListener('click', returnToWizard);

  // Individual blueprint chip click to directly modify a specific constraint
  document.querySelectorAll<HTMLButtonElement>('.blueprint-chip-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = btn.getAttribute('data-remove-key');
      if (key) {
        const q = QUESTIONS.find((question) =>
          question.options.some((opt) => opt.appliesCriteria && key in opt.appliesCriteria)
        );
        if (q) {
          store.setViewingQuestion(q.id);
        }
        store.setTab('wizard');
        router.saveStateToUrl(store.getState(), false);
        showToast(`Review choice: ${key}`, '✏️');
        scrollToQuestionCard();
      }
    });
  });

  // Track download interactions and record client-side metrics counter
  document.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]').forEach((el) => {
    el.addEventListener('click', () => {
      try {
        const count = Number(localStorage.getItem('dt_downloads_count') || '0') + 1;
        localStorage.setItem('dt_downloads_count', String(count));
      } catch {}
    });
  });

  // Toggle Theme (Dark / Light)
  document.getElementById('btn-toggle-theme')?.addEventListener('click', () => {
    store.toggleTheme();
  });

  // Distro Preview Modal Trigger (Leaderboard cards and catalog badges)
  document.querySelectorAll<HTMLElement>('[data-distro-id]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('button, a')) return;
      const id = el.getAttribute('data-distro-id');
      if (id) {
        store.setSelectedDistro(id);
      }
    });
  });

  const closeDistroModal = () => {
    store.setSelectedDistro(null);
  };
  document.getElementById('btn-close-distro-modal')?.addEventListener('click', closeDistroModal);
  document.getElementById('btn-modal-dismiss')?.addEventListener('click', closeDistroModal);
  document.getElementById('distro-modal-backdrop')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'distro-modal-backdrop') {
      closeDistroModal();
    }
  });

  // Live Search in Leaderboard
  const searchInput = document.getElementById('input-search-leaderboard') as HTMLInputElement | null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = (e.target as HTMLInputElement).value;
      store.setSearchQuery(val);
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        store.setSearchQuery('');
      }
    });
  }
  document.getElementById('btn-clear-search')?.addEventListener('click', () => {
    store.setSearchQuery('');
  });
  document.getElementById('btn-reset-filter')?.addEventListener('click', () => {
    store.setSearchQuery('');
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
        if (nextQuestion.isMultiSelect) {
          // Toggle item in multi-select list
          const { peripherals, peripheralNeed } = store.getState().criteria;
          const currentPeripherals: PeripheralNeed[] = [
            ...(peripherals || (peripheralNeed && peripheralNeed !== 'standard' ? [peripheralNeed] : []))
          ];

          if (opt.id === 'standard_peripherals') {
            store.update({
              criteria: {
                ...store.getState().criteria,
                peripherals: ['standard'],
                peripheralNeed: 'standard'
              }
            });
          } else {
            const pKey = opt.appliesCriteria.peripherals?.[0] ?? opt.appliesCriteria.peripheralNeed;
            if (!pKey) return;
            const withoutStandard: PeripheralNeed[] = currentPeripherals.filter((p) => p !== 'standard');
            const exists = withoutStandard.includes(pKey);
            const nextList = exists
              ? withoutStandard.filter((p) => p !== pKey)
              : [...withoutStandard, pKey];

            if (nextList.length === 0) {
              store.update({
                criteria: {
                  ...store.getState().criteria,
                  peripherals: ['standard'],
                  peripheralNeed: 'standard'
                }
              });
            } else {
              store.update({
                criteria: {
                  ...store.getState().criteria,
                  peripherals: nextList,
                  peripheralNeed: nextList[0]
                }
              });
            }
          }
          router.saveStateToUrl(store.getState(), false);
          return;
        }

        btn.classList.remove('bg-slate-950/70', 'border-slate-700/60');
        btn.classList.add('bg-emerald-500/20', 'border-emerald-400', 'ring-2', 'ring-emerald-400', 'scale-[0.985]');

        setTimeout(() => {
          store.answerQuestion(nextQuestion.id, opt.appliesCriteria);
          router.saveStateToUrl(store.getState(), false);
          scrollToQuestionCard();
        }, 80);
      }
    });
  });

  // Back button (top and bottom)
  const handleBack = () => {
    const stepped = store.stepBackQuestion();
    if (stepped) {
      router.saveStateToUrl(store.getState(), false);
      scrollToQuestionCard();
    }
  };
  document.getElementById('btn-back')?.addEventListener('click', handleBack);
  document.getElementById('btn-back-top')?.addEventListener('click', handleBack);

  // Next Question forward button (top and bottom)
  const handleNext = () => {
    if (nextQuestion) {
      store.stepForwardQuestion(nextQuestion.id);
      router.saveStateToUrl(store.getState(), false);
      scrollToQuestionCard();
    }
  };
  document.getElementById('btn-next')?.addEventListener('click', handleNext);
  document.getElementById('btn-next-top')?.addEventListener('click', handleNext);

  // Skip question button (top and bottom)
  const handleSkip = () => {
    if (nextQuestion) {
      const defaultOpt = nextQuestion.options.find((o) => o.isDefault);
      if (nextQuestion.isOptional && defaultOpt && Object.keys(defaultOpt.appliesCriteria).length > 0) {
        store.answerQuestion(nextQuestion.id, defaultOpt.appliesCriteria);
      }
      store.stepForwardQuestion(nextQuestion.id);
      router.saveStateToUrl(store.getState(), false);
      scrollToQuestionCard();
    }
  };
  document.getElementById('btn-skip')?.addEventListener('click', handleSkip);
  document.getElementById('btn-skip-top')?.addEventListener('click', handleSkip);

  // Multi-select confirm & next (top and bottom)
  const handleMultiSelectConfirm = () => {
    if (nextQuestion) {
      store.stepForwardQuestion(nextQuestion.id);
      router.saveStateToUrl(store.getState(), false);
      scrollToQuestionCard();
    }
  };
  document.getElementById('btn-multiselect-confirm')?.addEventListener('click', handleMultiSelectConfirm);
  document.getElementById('btn-multiselect-confirm-top')?.addEventListener('click', handleMultiSelectConfirm);

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

  EXPERT_FIELDS.forEach((field) => {
    bindExpertSelect(field.id, field.criteriaKey);
  });

  const closeExpertMatrix = () => {
    store.setTab('wizard');
    router.saveStateToUrl(store.getState(), true);
  };

  document.getElementById('btn-close-expert')?.addEventListener('click', closeExpertMatrix);
  document.getElementById('btn-cancel-expert')?.addEventListener('click', closeExpertMatrix);

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
        if (nextQuestion) {
          const num = parseInt(e.key, 10);
          if (!isNaN(num) && num >= 1 && num <= nextQuestion.options.length) {
            const opt = nextQuestion.options[num - 1];
            if (opt) {
              store.answerQuestion(nextQuestion.id, opt.appliesCriteria);
              router.saveStateToUrl(store.getState(), false);
              scrollToQuestionCard();
              return;
            }
          }
        }

        if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
          const stepped = store.stepBackQuestion();
          if (stepped) {
            router.saveStateToUrl(store.getState(), false);
            scrollToQuestionCard();
          }
        }

        if (e.key === 'ArrowRight') {
          if (nextQuestion) {
            store.stepForwardQuestion(nextQuestion.id);
            router.saveStateToUrl(store.getState(), false);
            scrollToQuestionCard();
          }
        }
      }

      if (e.key === 'Escape') {
        if (currentState.selectedDistroId) {
          store.setSelectedDistro(null);
          return;
        }
        if (currentState.showShareModal) {
          store.setShareModal(false);
          return;
        }
        if (currentState.activeTab === 'expert') {
          closeExpertMatrix();
          return;
        }
      }
    });
    keyboardHandlerRegistered = true;
  }
}
