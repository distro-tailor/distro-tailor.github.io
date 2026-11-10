import {
  evaluateCriteria,
  QuestionFlow,
  QUESTIONS,
  UserCriteria,
  RecommendationOutput,
  DISTRO_REGISTRY,
  CURRENT_SCHEMA_VERSION,
  migrateUrlParameters,
  DOCKER_APPS_REGISTRY,
  DESKTOP_APPS_REGISTRY,
  getDockerApp,
  getDesktopApp,
  DockerAppId,
  DesktopEnvId,
  DesktopAppId
} from '@distro-tailor/core';

interface AppState {
  criteria: UserCriteria;
  answeredQuestionIds: Set<string>;
  history: UserCriteria[];
  activeTab: 'wizard' | 'expert' | 'results';
  activeFileIndex: number;
  isSharedView: boolean;
  showShareModal: boolean;
  unsupportedSchemaNotice?: string;
  transitionDirection: 'forward' | 'backward';
}

const state: AppState = {
  criteria: {},
  answeredQuestionIds: new Set(),
  history: [],
  activeTab: 'wizard',
  activeFileIndex: 0,
  isSharedView: false,
  showShareModal: false,
  unsupportedSchemaNotice: undefined,
  transitionDirection: 'forward'
};

const flow = new QuestionFlow(QUESTIONS);

// --- URL STATE PERSISTENCE, SAFEGUARDS & BROWSER HISTORY ---

let isSyncingUrl = false;
const LOOP_WINDOW_MS = 2000;
const MAX_TRANSITIONS_IN_WINDOW = 25;
let transitionTimestamps: number[] = [];

function checkLoopSafeguard(): boolean {
  const now = Date.now();
  transitionTimestamps = transitionTimestamps.filter((t) => now - t < LOOP_WINDOW_MS);
  transitionTimestamps.push(now);

  if (transitionTimestamps.length > MAX_TRANSITIONS_IN_WINDOW) {
    console.error('[DistroTailor Safeguard] Infinite history/state loop detected. Resetting to clean homepage.');
    fallbackToHomePage('A rapid state loop was intercepted. Resetting to clean start to protect your browser.');
    return false;
  }
  return true;
}

function fallbackToHomePage(notice?: string): void {
  state.criteria = {};
  state.answeredQuestionIds.clear();
  state.history = [];
  state.activeTab = 'wizard';
  state.activeFileIndex = 0;
  state.isSharedView = false;
  state.transitionDirection = 'forward';
  state.unsupportedSchemaNotice = undefined;
  transitionTimestamps = [];

  if (notice) {
    showToast(notice, '⚠️');
  }

  try {
    const cleanUrl = window.location.pathname;
    window.history.replaceState(null, '', cleanUrl);
  } catch (err) {
    console.warn('Failed to clean URL on fallback:', err);
  }
  render();
}

function saveStateToUrl(push = false): void {
  if (isSyncingUrl) return;
  if (!checkLoopSafeguard()) return;

  const params = new URLSearchParams();

  // Always write schema version first to guarantee backward-compatibility across releases
  params.set('v', String(CURRENT_SCHEMA_VERSION));

  if (state.activeTab !== 'wizard') {
    params.set('tab', state.activeTab);
  }

  if (state.activeFileIndex > 0) {
    params.set('file', String(state.activeFileIndex));
  }

  if (state.answeredQuestionIds.size > 0) {
    params.set('ans', Array.from(state.answeredQuestionIds).join(','));
  }

  // Serialize criteria keys into clean query parameters
  for (const [key, value] of Object.entries(state.criteria)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }

  const queryString = params.toString();
  const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;

  // Don't modify history if URL hasn't changed
  const currentUrl = window.location.pathname + window.location.search;
  if (currentUrl === newUrl) {
    return;
  }

  try {
    if (push) {
      window.history.pushState({ ...state.criteria }, '', newUrl);
    } else {
      window.history.replaceState({ ...state.criteria }, '', newUrl);
    }
  } catch (err) {
    console.warn('Failed to update browser history:', err);
  }
}

function loadStateFromUrl(): void {
  // Read from query string, or fallback to hash if query is empty (supports both ?... and #...)
  const rawParams =
    window.location.search ||
    (window.location.hash.includes('?')
      ? window.location.hash.slice(window.location.hash.indexOf('?'))
      : window.location.hash.replace(/^#\/?/, ''));

  if (!rawParams) {
    state.criteria = {};
    state.answeredQuestionIds.clear();
    state.activeTab = 'wizard';
    state.activeFileIndex = 0;
    state.isSharedView = false;
    state.unsupportedSchemaNotice = undefined;
    return;
  }

  try {
    const urlSearchParams = new URLSearchParams(rawParams.startsWith('?') ? rawParams.slice(1) : rawParams);
    const rawRecord: Record<string, string> = {};
    for (const [k, v] of urlSearchParams.entries()) {
      rawRecord[k] = v;
    }

    // Run URL schema migration to normalize historical, unversioned, or alias parameters
    const migration = migrateUrlParameters(rawRecord);

    if (!migration.supported) {
      state.unsupportedSchemaNotice = migration.fallbackNotice;
      state.criteria = {};
      state.answeredQuestionIds.clear();
      return;
    }
    state.unsupportedSchemaNotice = undefined;

    const params = new Map(Object.entries(migration.params));

    if (migration.migrated && migration.warnings.length > 0) {
      console.info('[DistroTailor] Migrated URL parameters to schema v' + migration.version, migration.warnings);
    }

    const tab = params.get('tab');
    state.activeTab = tab === 'wizard' || tab === 'expert' || tab === 'results' ? tab : 'wizard';

    const file = params.get('file');
    state.activeFileIndex = file && !isNaN(Number(file)) ? Number(file) : 0;

    const nextAnswered = new Set<string>();
    const ans = params.get('ans');
    if (ans) {
      ans.split(',').filter(Boolean).forEach((id) => nextAnswered.add(id));
    }

    const nextCriteria: UserCriteria = {};
    const knownCriteriaKeys: (keyof UserCriteria)[] = [
      'useCase',
      'platform',
      'architecture',
      'footprint',
      'statePreference',
      'cLibPreference',
      'initPreference',
      'experienceLevel',
      'maxRamMb',
      'prefersGui',
      'requiresCustomBuild',
      'desktopEnv',
      'enableDistrobox',
      'enableNix',
      'enableFlatpak',
      'dockerApp',
      'desktopApps'
    ];

    for (const key of knownCriteriaKeys) {
      const val = params.get(key);
      if (val !== undefined && val !== null) {
        if (key === 'maxRamMb') {
          nextCriteria[key] = Number(val);
        } else if (key === 'desktopApps') {
          nextCriteria[key] = val.split(',').filter(Boolean) as DesktopAppId[];
        } else if (
          key === 'prefersGui' ||
          key === 'requiresCustomBuild' ||
          key === 'enableDistrobox' ||
          key === 'enableNix' ||
          key === 'enableFlatpak'
        ) {
          nextCriteria[key] = val === 'true' || val === '1';
        } else {
          (nextCriteria as any)[key] = val;
        }
      }
    }

    state.criteria = nextCriteria;
    state.answeredQuestionIds = nextAnswered;
    state.isSharedView = Object.keys(nextCriteria).length > 0;

    // If criteria are present and all questions answered, default to results view unless tab was explicitly set
    if (Object.keys(nextCriteria).length > 0 && !params.has('tab')) {
      const nextQ = flow.getNextQuestion(nextCriteria, nextAnswered);
      if (!nextQ) {
        state.activeTab = 'results';
      }
    }
  } catch (err) {
    console.error('[DistroTailor] Failed to parse URL parameters:', err);
    fallbackToHomePage('Malformed URL state detected. Returning to start.');
  }
}

window.addEventListener('popstate', () => {
  if (isSyncingUrl) return;
  if (!checkLoopSafeguard()) return;

  isSyncingUrl = true;
  try {
    const prevAnsweredCount = state.answeredQuestionIds.size;
    loadStateFromUrl();
    const newAnsweredCount = state.answeredQuestionIds.size;

    // Transition smoothly backward if fewer questions answered, otherwise forward
    state.transitionDirection = newAnsweredCount < prevAnsweredCount ? 'backward' : 'forward';

    render();
    scrollToQuestionCard();
  } catch (err) {
    console.error('Error handling popstate:', err);
    fallbackToHomePage('Navigation error. Returning to start.');
  } finally {
    isSyncingUrl = false;
  }
});

function getAppElement(): HTMLElement {
  const el = document.getElementById('app');
  if (!el) throw new Error('Missing #app root element');
  return el;
}

// --- SHARING & NOTIFICATION UTILITIES ---

function showToast(message: string, icon = '✅'): void {
  const existing = document.getElementById('distro-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'distro-toast';
  toast.className = 'fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900/95 text-slate-100 border border-emerald-500/40 shadow-2xl backdrop-blur-md text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200';
  toast.innerHTML = `<span class="text-base">${icon}</span><span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

async function copyToClipboard(text: string, successMsg = 'Copied to clipboard!', icon = '✅'): Promise<void> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
    showToast(successMsg, icon);
  } catch {
    prompt('Copy this shareable link:', text);
  }
}

function generateMarkdownSummary(evaluation: RecommendationOutput): string {
  const best = evaluation.bestMatch;
  const url = window.location.href;
  const constraintsList = Object.entries(state.criteria)
    .map(([k, v]) => `• ${formatConstraint(k, v).icon} ${formatConstraint(k, v).label}`)
    .join('\n');

  return `🐧 **DistroTailor Recommendation: ${best.distro.name} (${best.score}% Match)**
*${best.distro.tagline}*

**Tailored Configuration:**
${constraintsList || '• Default profile'}

**Key Highlights:**
${best.distro.highlights.map((h) => `• ${h}`).join('\n')}

🔗 **View or customize this Linux build:**
${url}`;
}

async function triggerDeviceShare(evaluation: RecommendationOutput): Promise<void> {
  const best = evaluation.bestMatch;
  const shareData = {
    title: `DistroTailor: ${best.distro.name} (${best.score}% Match)`,
    text: `Found my tailored Linux match: ${best.distro.name} - ${best.distro.tagline}`,
    url: window.location.href
  };

  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      showToast('Shared successfully!', '🚀');
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        copyToClipboard(window.location.href, 'Link copied to clipboard!', '🔗');
      }
    }
  } else {
    copyToClipboard(window.location.href, 'Link copied to clipboard!', '🔗');
  }
}

function formatConstraint(key: string, value: any): { label: string; icon: string } {
  const map: Record<string, Record<string, { label: string; icon: string }>> = {
    experienceLevel: {
      beginner: { label: 'Beginner / Goal-Oriented', icon: '🌱' },
      intermediate: { label: 'Comfortable Tinkerer', icon: '🌿' },
      'systems-engineer': { label: 'Systems Hacker', icon: '🌳' }
    },
    useCase: {
      'media-center': { label: 'Living Room Media Center', icon: '📺' },
      gaming: { label: 'Retro Gaming Console', icon: '🕹️' },
      'education-kids': { label: 'Kid-Safe School & Coding', icon: '🎓' },
      'nas-storage': { label: 'Family Photo & Video NAS', icon: '📦' },
      'smart-home': { label: 'Smart Home Hub', icon: '🏡' },
      'appliance-product': { label: 'Dedicated Single-App Appliance', icon: '🛠️' },
      'ai-gpu-compute': { label: 'AI, LLM & GPU Compute', icon: '🧠' },
      'hypervisor-vms': { label: 'Homelab Virtualization & Hypervisor', icon: '🖧' },
      'home-office': { label: 'Home Office & Freelancer Workstation', icon: '💼' },
      'creative-studio': { label: 'Creative Studio (Art, 3D & Video)', icon: '🎨' },
      'router-networking': { label: 'Home Router & Firewall', icon: '📡' },
      'kiosk-signage': { label: 'Store Display & Kiosk', icon: '🏪' },
      desktop: { label: 'Everyday Desktop', icon: '💻' },
      'browser-wasm': { label: 'In-Browser Linux (WASM)', icon: '🌐' },
      server: { label: 'Home Server & Cloud', icon: '🏠' },
      'container-base': { label: 'Container Base Image', icon: '🐳' },
      'k8s-cluster': { label: 'Kubernetes Cluster Node', icon: '☸️' },
      'iot-embedded': { label: 'IoT & Microcontrollers', icon: '🤖' }
    },
    platform: {
      'bare-metal': { label: 'Physical PC / Laptop', icon: '💻' },
      'embedded-sbc': { label: 'Raspberry Pi / Mini Board', icon: '🍓' },
      kiosk: { label: 'Locked Kiosk', icon: '🔒' },
      'browser-wasm': { label: 'Web Browser VM', icon: '🌐' },
      'router-firewall': { label: 'Router Appliance', icon: '📡' },
      vm: { label: 'Virtual Machine', icon: '🖧' },
      wsl2: { label: 'Windows Subsystem for Linux (WSL2)', icon: '🪟' },
      container: { label: 'Docker Container', icon: '🐳' }
    },
    architecture: {
      x86_64: { label: 'Standard 64-bit PC', icon: '💻' },
      arm64: { label: 'ARM64 (Raspberry Pi 4/5 / Apple Silicon / Snapdragon)', icon: '📱' },
      armv7: { label: '32-bit ARM (Older Pi)', icon: '📟' },
      riscv64: { label: 'RISC-V 64-bit Board', icon: '📐' },
      nommu: { label: 'Microcontroller (NOMMU)', icon: '🔌' }
    },
    footprint: {
      micro: { label: 'Extreme Micro (<16MB)', icon: '🪶' },
      minimal: { label: 'Ultra-Light (<1GB RAM)', icon: '⚡' },
      lean: { label: 'Lean (1-2GB RAM)', icon: '📦' },
      standard: { label: 'Standard (4-8GB RAM)', icon: '🚀' },
      full: { label: 'Full Workstation', icon: '🎮' }
    },
    statePreference: {
      'traditional-mutable': { label: 'Standard Mutable (apt/dnf)', icon: '✏️' },
      'read-only-rootfs': { label: 'Read-Only RootFS (OverlayFS)', icon: '🔒' },
      'immutable-ostree': { label: 'Atomic / Immutable (OSTree)', icon: '🛡️' }
    },
    cLibPreference: {
      glibc: { label: 'GNU C Library (glibc)', icon: '📚' },
      musl: { label: 'musl libc (Lean & Fast)', icon: '🪶' },
      uclibc: { label: 'uClibc-ng (Embedded)', icon: '🔌' }
    },
    initPreference: {
      systemd: { label: 'systemd (Standard)', icon: '⚙️' },
      openrc: { label: 'OpenRC (Lightweight)', icon: '⚡' },
      runit: { label: 'runit (Minimalist)', icon: '⏱️' },
      busybox: { label: 'BusyBox Init (Embedded)', icon: '🧰' }
    }
  };

  if (key === 'maxRamMb') {
    return { label: `${value} MB RAM`, icon: '🧠' };
  }
  if (key === 'prefersGui') {
    return { label: value ? 'Graphical Desktop (GUI)' : 'Headless / Terminal Only', icon: value ? '🖼️' : '⌨️' };
  }
  if (key === 'requiresCustomBuild') {
    return { label: value ? 'Custom Build Recipe Required' : 'Prebuilt ISO Preferred', icon: '🛠️' };
  }
  if (key === 'dockerApp') {
    const app = getDockerApp(value);
    return { label: app ? `Docker: ${app.name}` : `Docker: ${value}`, icon: app ? app.icon : '🐳' };
  }
  if (key === 'desktopApps') {
    const list = Array.isArray(value) ? value : String(value).split(',').filter(Boolean);
    return { label: `Desktop Apps: ${list.length} selected`, icon: '📦' };
  }
  if (key === 'desktopEnv') {
    return { label: `Desktop: ${String(value).toUpperCase()}`, icon: '🖼️' };
  }
  if (key === 'enableDistrobox') {
    return { label: value ? 'Distrobox (Arch AUR)' : 'Native Only', icon: '🏛️' };
  }
  if (key === 'enableNix') {
    return { label: value ? 'Nix Package Layer' : 'No Nix', icon: '❄️' };
  }
  if (key === 'enableFlatpak') {
    return { label: value ? 'Flatpak Sandbox' : 'No Flatpak', icon: '📦' };
  }

  if (map[key] && map[key][value]) {
    return map[key][value];
  }
  return { label: `${key}: ${value}`, icon: '📌' };
}

function scrollToQuestionCard(): void {
  // Wait for the next animation frame so DOM is hydrated
  requestAnimationFrame(() => {
    const card = document.getElementById('wizard-question-card');
    if (card) {
      const rect = card.getBoundingClientRect();
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      const targetY = Math.max(0, currentScroll + rect.top - 16);
      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

function render() {
  saveStateToUrl();
  const app = getAppElement();
  const evaluation: RecommendationOutput = evaluateCriteria(state.criteria);
  const nextQuestion = flow.getNextQuestion(state.criteria, state.answeredQuestionIds);
  const progress = flow.getProgress(state.criteria, state.answeredQuestionIds);

  // Dynamic Browser Tab Title
  if (state.activeTab === 'results') {
    document.title = `DistroTailor — ${evaluation.bestMatch.distro.name} (${evaluation.bestMatch.score}% Match)`;
  } else if (state.activeTab === 'expert') {
    document.title = 'DistroTailor — Expert Architecture Matrix';
  } else {
    document.title = `DistroTailor — 20 Questions (${progress.current + 1}/${progress.total})`;
  }

  app.innerHTML = `
    <!-- Top Header Navigation -->
    <header class="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50 px-3.5 sm:px-6 py-2.5 sm:py-3.5 max-w-full overflow-hidden">
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        
        <!-- Brand Identity -->
        <div class="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none min-w-0 w-full sm:w-auto justify-start" id="nav-brand">
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0">
            🐧
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-base sm:text-lg font-bold tracking-tight text-slate-100">DistroTailor</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">20 Questions</span>
            </div>
            <p class="text-[11px] sm:text-xs text-slate-400 truncate sm:whitespace-normal">Think of a project. Find your dream Linux match.</p>
          </div>
        </div>

        <!-- Mode Buttons -->
        <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center sm:justify-end w-full sm:w-auto">
          <button id="btn-toggle-wizard" class="px-2.5 sm:px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${state.activeTab === 'wizard' ? 'bg-slate-100 text-slate-950 font-semibold shadow' : 'text-slate-300 hover:bg-slate-800/70 border border-transparent'}">
            20 Questions
          </button>
          <button id="btn-toggle-expert" class="px-2.5 sm:px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${state.activeTab === 'expert' ? 'bg-slate-100 text-slate-950 font-semibold shadow' : 'text-slate-300 hover:bg-slate-800/70 border border-transparent'}">
            Expert Matrix
          </button>
          ${Object.keys(state.criteria).length > 0 ? `
            <button id="btn-view-results" class="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${state.activeTab === 'results' ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950/40' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-700/60 hover:bg-emerald-900/60'}">
              🎯 Match (${evaluation.bestMatch.score}%)
            </button>
            <button id="btn-share-header" class="px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/50 flex items-center gap-1 transition-all shadow-sm shrink-0" title="Share this configuration via link">
              <span>🔗</span> Share
            </button>
            <button id="btn-reset" class="px-2 py-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors shrink-0" title="Start over">
              Restart
            </button>
          ` : ''}
        </div>
      </div>
    </header>

    <!-- Main Workspace -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-3.5 py-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 min-w-0 max-w-full overflow-hidden">
      
      <!-- Primary Left Column: Wizard Cards or Results -->
      <section class="lg:col-span-8 flex flex-col gap-6 min-w-0 w-full max-w-full overflow-hidden">
        ${renderPrimarySection(nextQuestion, progress, evaluation)}
      </section>

      <!-- Right Column: Live Standings Leaderboard -->
      <aside class="lg:col-span-4 flex flex-col gap-4 min-w-0 w-full max-w-full">
        <div class="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 sm:p-5 sticky top-24 shadow-xl min-w-0 overflow-hidden">
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 gap-2">
            <div class="min-w-0">
              <h3 class="text-sm font-bold text-slate-200 truncate">The Contenders</h3>
              <p class="text-[11px] text-slate-400 truncate">Updates live as you answer</p>
            </div>
            <span class="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 shrink-0">
              ${DISTRO_REGISTRY.length} distros
            </span>
          </div>

          <!-- Top Contender Cards -->
          <div class="space-y-2.5">
            ${evaluation.topMatches.slice(0, 6).map((m) => `
              <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all min-w-0">
                <div class="flex items-center justify-between text-sm mb-1.5 gap-2">
                  <div class="flex items-center gap-2 font-medium text-slate-200 min-w-0 flex-1">
                    <span class="text-base shrink-0">${m.distro.logoEmoji || '🐧'}</span>
                    <span class="truncate">${m.distro.name}</span>
                  </div>
                  <span class="font-mono text-xs font-bold shrink-0 ${m.score >= 80 ? 'text-emerald-400' : m.score >= 50 ? 'text-yellow-400' : 'text-slate-500'}">
                    ${m.score}%
                  </span>
                </div>

                <!-- Match Bar -->
                <div class="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                  <div class="h-1.5 rounded-full transition-all duration-300 ${m.score >= 80 ? 'bg-emerald-400' : m.score >= 50 ? 'bg-yellow-400' : 'bg-slate-600'}" style="width: ${m.score}%"></div>
                </div>

                <p class="text-[11px] text-slate-400 mt-2 line-clamp-1 break-words">${m.distro.tagline}</p>
              </div>
            `).join('')}
          </div>

          <!-- Active Constraints Tags with Interactive Removal and Share -->
          <div class="mt-5 pt-4 border-t border-slate-800">
            <div class="flex items-center justify-between mb-2.5">
              <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Choices So Far</h4>
              ${Object.keys(state.criteria).length > 0 ? `
                <button id="btn-share-sidebar" class="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors" title="Share this configuration link">
                  <span>🔗</span> Share Link
                </button>
              ` : ''}
            </div>
            ${Object.keys(state.criteria).length === 0 ? `
              <p class="text-xs text-slate-500 italic">No constraints yet. Select an option to start narrowing down!</p>
            ` : `
              <div class="flex flex-wrap gap-1.5 min-w-0">
                ${Object.entries(state.criteria).map(([k, v]) => {
                  const c = formatConstraint(k, v);
                  return `
                    <span class="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-200 border border-slate-700/60 shadow-sm group hover:border-slate-600 transition-colors max-w-full min-w-0">
                      <span class="shrink-0">${c.icon}</span>
                      <span class="truncate">${c.label}</span>
                      <button data-remove-key="${k}" class="btn-remove-choice text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors text-[10px] leading-none shrink-0" title="Remove this choice">✕</button>
                    </span>
                  `;
                }).join('')}
              </div>
            `}
          </div>
        </div>
      </aside>

    </main>

    <!-- Clean Footer -->
    <footer class="border-t border-slate-800/80 py-6 px-6 text-center text-xs text-slate-500">
      <p>DistroTailor is 100% Free & Open Source under the MIT License · Built for curious humans, families, and systems tinkerers.</p>
    </footer>

    <!-- Interactive Share Modal -->
    ${state.showShareModal ? renderShareModal(evaluation) : ''}
  `;

  attachEventHandlers(nextQuestion, evaluation);
}

function renderUnsupportedSchemaFallback(notice: string): string {
  return `
    <div class="bg-slate-900/80 border border-amber-500/40 rounded-2xl p-4 sm:p-10 backdrop-blur shadow-2xl text-center max-w-2xl mx-auto my-4 sm:my-6 min-w-0 max-w-full overflow-hidden">
      <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl sm:text-3xl mx-auto mb-4 shadow-inner">
        🕰️
      </div>
      <h2 class="text-xl sm:text-2xl font-extrabold text-slate-100 mb-2 break-words">Unsupported Link Schema</h2>
      <p class="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 break-words">
        ${notice}
      </p>

      <div class="p-3.5 sm:p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 mb-6 sm:mb-8 text-left space-y-2 min-w-0">
        <p class="font-semibold text-slate-200 flex items-center gap-1.5">
          <span>💡</span> Why did this happen?
        </p>
        <p class="leading-relaxed break-words">
          DistroTailor continuously refines hardware targeting, Linux distros, and question taxonomy. When a link from a deprecated or incompatible schema is opened, we protect you from invalid recipes and allow you to restart cleanly.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full">
        <button id="btn-fallback-fresh" class="w-full sm:w-auto px-5 sm:px-6 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all cursor-pointer text-center">
          Start Fresh 20 Questions
        </button>
        <button id="btn-fallback-expert" class="w-full sm:w-auto px-5 sm:px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-all cursor-pointer text-center">
          Browse Contenders (Expert Matrix)
        </button>
      </div>
    </div>
  `;
}

function renderPrimarySection(
  nextQuestion: ReturnType<typeof flow.getNextQuestion>,
  progress: ReturnType<typeof flow.getProgress>,
  evaluation: RecommendationOutput
): string {
  if (state.unsupportedSchemaNotice) {
    return renderUnsupportedSchemaFallback(state.unsupportedSchemaNotice);
  }

  if (state.activeTab === 'results' || (!nextQuestion && state.activeTab === 'wizard')) {
    return renderResultsView(evaluation);
  }

  if (state.activeTab === 'expert') {
    return renderExpertMatrix();
  }

  if (!nextQuestion) {
    return renderResultsView(evaluation);
  }

  const numOptions = nextQuestion.options.length;
  const isBeginner = state.criteria.experienceLevel === 'beginner' || !state.criteria.experienceLevel;
  // Dynamic balanced grid: 3 options get a clean 3-column row, others get a 2-column grid
  const gridClass = numOptions === 3
    ? 'grid grid-cols-1 md:grid-cols-3 gap-4'
    : 'grid grid-cols-1 sm:grid-cols-2 gap-4';

  return `
    <div id="wizard-question-card" class="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-8 backdrop-blur shadow-xl min-w-0 max-w-full overflow-hidden scroll-mt-6 ${state.transitionDirection === 'backward' ? 'animate-question-backward' : 'animate-question-forward'}">
      
      <!-- Round & Step Indicator with Flow Mode Toggle -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-800/80 gap-3">
        <div class="flex items-center gap-2.5 flex-wrap">
          <span class="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            Question ${progress.current + 1} of ${progress.total}
          </span>
          <button id="btn-toggle-flow-mode" class="px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${isBeginner ? 'bg-slate-800/90 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/40 border border-slate-700/60' : 'bg-indigo-950/60 text-indigo-300 hover:text-indigo-200 hover:border-indigo-500/50 border border-indigo-700/60'}" title="Switch between Goal-Oriented Mode and Low-Level Technical Mode">
            <span>${isBeginner ? '🌱 Goal Mode' : '⚙️ Technical Mode'}</span>
            <span class="text-[10px] text-slate-400 font-mono">⇄ switch</span>
          </button>
        </div>
        
        <!-- Segmented Step Dots -->
        <div class="flex items-center gap-1 overflow-x-auto max-w-full py-1 no-scrollbar shrink-0">
          ${Array.from({ length: progress.total }).map((_, i) => `
            <div class="h-1.5 sm:h-2 rounded-full transition-all duration-300 ${i < progress.current ? 'w-4 sm:w-6 bg-emerald-400' : i === progress.current ? 'w-6 sm:w-8 bg-emerald-400 ring-2 ring-emerald-400/30' : 'w-1.5 sm:w-2 bg-slate-800'}"></div>
          `).join('')}
        </div>
      </div>

      <!-- Question Prompt -->
      <div class="mb-6 sm:mb-7 min-w-0">
        <h2 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight mb-2 break-words">${nextQuestion.prompt}</h2>
        ${nextQuestion.subtext ? `<p class="text-xs sm:text-sm text-slate-400 leading-relaxed break-words">${nextQuestion.subtext}</p>` : ''}
      </div>

      <!-- Option Cards -->
      <div class="${gridClass}">
        ${nextQuestion.options.map((opt, idx) => {
          const keyNum = idx + 1;
          // Strip any leading emoji from label string to avoid duplicate display
          const cleanLabel = opt.label.replace(/^[\p{Emoji}\s]+/u, '').trim();
          const isSpanFull = (numOptions % 2 === 1 && idx === numOptions - 1 && numOptions > 3);
          const spanClass = isSpanFull ? 'sm:col-span-2' : '';

          return `
            <button data-option-id="${opt.id}" class="option-btn group relative text-left p-4 sm:p-5 rounded-xl border border-slate-700/60 bg-slate-950/70 hover:bg-slate-800/90 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-950/40 transition-all flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 min-w-0 w-full overflow-hidden ${spanClass}">
              <div class="min-w-0 w-full">
                <div class="flex items-start justify-between gap-3 mb-3">
                  <span class="text-2xl sm:text-3xl p-2 rounded-xl bg-slate-900 border border-slate-700/60 group-hover:scale-110 transition-transform shrink-0">${opt.icon || '👉'}</span>
                  ${keyNum <= 9 ? `
                    <span class="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/50 group-hover:text-emerald-300 group-hover:border-emerald-500/40 transition-colors shrink-0">Press [${keyNum}]</span>
                  ` : ''}
                </div>
                <h3 class="text-sm sm:text-base font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors mb-1.5 leading-snug break-words">${cleanLabel}</h3>
                ${opt.description ? `<p class="text-xs text-slate-400 leading-relaxed break-words">${opt.description}</p>` : ''}
              </div>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Contextual Linux Pro-Tip Box -->
      ${nextQuestion.tip ? `
        <div class="mt-6 p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3 text-xs min-w-0 overflow-hidden">
          <span class="text-lg sm:text-xl p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            ${nextQuestion.tip.icon || '💡'}
          </span>
          <div class="min-w-0 flex-1">
            <h4 class="font-semibold text-slate-200 mb-0.5 break-words">${nextQuestion.tip.title}</h4>
            <p class="text-slate-400 leading-relaxed break-words">${nextQuestion.tip.text}</p>
          </div>
        </div>
      ` : ''}

      <!-- Navigation Controls -->
      <div class="flex items-center justify-between mt-8 pt-6 border-t border-slate-800/80">
        <button id="btn-back" class="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all ${state.history.length === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}">
          ← Previous Question
        </button>
        <button id="btn-skip" class="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all cursor-pointer">
          Skip for now →
        </button>
      </div>

    </div>
  `;
}

interface AddonCombo {
  title: string;
  icon: string;
  description: string;
  howTo: string;
  appliesDockerApp?: DockerAppId;
  appliesDesktopEnv?: DesktopEnvId;
  appliesDistrobox?: boolean;
}

function getAddonCombos(distroId: string): AddonCombo[] {
  switch (distroId) {
    case 'libreelec':
      return [
        {
          title: 'Retro Gaming (Arcade, SNES, PS1, N64)',
          icon: '🕹️',
          description: 'Play classic retro games straight from your couch with USB or Bluetooth game controllers.',
          howTo: 'Enable "RetroPlayer" in Kodi Settings → Add-ons → Game Clients, or install the LibreELEC RetroArch addon.'
        },
        {
          title: 'Stream From Home Storage (NAS / Jellyfin)',
          icon: '📦',
          description: 'Access family photos, home videos, and movies stored on your home server or NAS.',
          howTo: 'Add network folder via SMB/NFS, or install the official Jellyfin / Plex add-on from Kodi repository.',
          appliesDockerApp: 'jellyfin'
        }
      ];
    case 'openmediavault':
      return [
        {
          title: 'Smart Home Hub (Home Assistant)',
          icon: '🏡',
          description: 'Run your local private smart home hub alongside family file storage on the same PC.',
          howTo: 'Install "omv-extras" plugin → enable Compose / Docker → 1-click launch Home Assistant container.',
          appliesDockerApp: 'home-assistant'
        },
        {
          title: 'Private Family Photo Cloud (Immich)',
          icon: '📸',
          description: 'Auto-backup phone photos and replace Google Photos / iCloud with AI face & map search.',
          howTo: 'Deploy the Immich Docker Compose template directly inside the OMV web interface.',
          appliesDockerApp: 'immich'
        },
        {
          title: 'Network-Wide Ad Blocker (Pi-hole)',
          icon: '🛡️',
          description: 'Block ads and tracking for every phone, laptop, and smart TV connected to your Wi-Fi.',
          howTo: 'Launch a Pi-hole container and point your home Wi-Fi router DNS to your OMV box IP address.',
          appliesDockerApp: 'pihole'
        }
      ];
    case 'home-assistant-os':
      return [
        {
          title: 'Smart Security Camera NVR (Frigate)',
          icon: '📹',
          description: 'Local video recording with real-time AI object detection (people, packages, vehicles).',
          howTo: 'Install the "Frigate NVR" add-on directly from the Home Assistant Supervisor Add-on Store.'
        },
        {
          title: 'Universal Smart Hub (Zigbee & Matter)',
          icon: '🔌',
          description: 'Connect low-cost smart bulbs and motion sensors with zero proprietary brand bridges.',
          howTo: 'Plug in a Sonoff or SkyConnect USB dongle and enable the Zigbee2MQTT / Matter add-on.'
        },
        {
          title: 'Family Music & Media Server',
          icon: '🎵',
          description: 'Stream music to smart speakers throughout the house with synchronized multi-room audio.',
          howTo: 'Install Music Assistant or Jellyfin from the Home Assistant Community Add-on Store.',
          appliesDockerApp: 'jellyfin'
        }
      ];
    case 'cage-appliance':
    case 'porteus-kiosk':
      return [
        {
          title: 'Custom Brand Splash (Silent Boot)',
          icon: '🎨',
          description: 'Display your company logo or product graphic during the 3-second boot.',
          howTo: 'Set your splash image in Plymouth or pass quiet splash kernel parameters in the Makefile.'
        },
        {
          title: 'Touchscreen Calibration & Virtual Keyboard',
          icon: '📱',
          description: 'Turn into an interactive retail POS, product kiosk, or wall control panel.',
          howTo: 'Cage automatically binds to libinput; enable onboard or wvkbd for on-screen touch typing.',
          appliesDesktopEnv: 'cage'
        }
      ];
    case 'batocera':
      return [
        {
          title: 'Living Room Media Center (Kodi)',
          icon: '📺',
          description: 'Turn your retro console into a living room media player when you are not gaming.',
          howTo: 'Press the Main Menu button on your gamepad → select "Kodi Media Center" (it comes pre-installed!).'
        },
        {
          title: 'Network Game Sync Over Wi-Fi',
          icon: '☁️',
          description: 'Sync your game saves and add new games over your home network from Mac or PC.',
          howTo: 'Enable Network Shares in Batocera settings to access the ROM folder from your laptop.'
        }
      ];
    case 'pop-os':
      return [
        {
          title: 'Local AI LLM Assistant (Ollama + Open-WebUI)',
          icon: '🤖',
          description: 'Run DeepSeek, Llama 3, or Mistral 100% locally on your NVIDIA GPU with private ChatGPT web UI.',
          howTo: 'Run `curl -fsSL https://ollama.com/install.sh | sh` then `ollama run llama3`.',
          appliesDockerApp: 'ollama'
        },
        {
          title: 'PyTorch & Data Science Environment',
          icon: '📊',
          description: 'GPU-accelerated Python machine learning stack with CUDA 12 pre-configured.',
          howTo: 'Install PyTorch with GPU support: `pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121`.'
        }
      ];
    case 'hiveos':
      return [
        {
          title: 'Automated Thermal & Fan Watchdog',
          icon: '❄️',
          description: 'Protect GPUs from thermal throttling and maintain peak mining efficiency.',
          howTo: 'Set target core temperature (e.g. 60°C) and autofan threshold in the HiveOS dashboard.'
        },
        {
          title: 'Distributed AI Compute Worker (Akash / Render)',
          icon: '🌐',
          description: 'Monetize idle GPU computing power on decentralized AI compute networks.',
          howTo: 'Deploy the compute provider daemon directly via HiveOS custom script runner.'
        }
      ];
    case 'asahi-linux':
      return [
        {
          title: 'Vulkan Gaming & Steam on Apple Silicon',
          icon: '🎮',
          description: 'Play x86 Windows and Linux games on Apple Silicon via FEX-Emu / Box64 and conformant Honeykrisp Vulkan driver.',
          howTo: 'Install FEX-Emu or Box64 and launch Steam: fex-emu steam.'
        },
        {
          title: 'Safe Audio DSP Protection Check',
          icon: '🔊',
          description: 'Ensure Bankstown / PipeWire speaker DSP protection daemon is active to get full rich Mac sound without damaging speakers.',
          howTo: 'Check speaker protection status: systemctl status asahi-sound-dsp.'
        }
      ];
    case 'linux-mint':
      return [
        {
          title: 'One-Click Timeshift System Rollback',
          icon: '⏱️',
          description: 'Automatic hourly or daily snapshots that let you restore your working desktop in seconds if an update ever glitches.',
          howTo: 'Launch Timeshift from the application menu, select backup destination, and schedule daily snapshots.'
        },
        {
          title: 'Microsoft 365 & Google Workspace Web Apps',
          icon: '💼',
          description: 'Run Word, Excel, PowerPoint, and Outlook in dedicated standalone application windows with native desktop notifications.',
          howTo: 'Open Web Apps (WebApp Manager) from the menu, enter office.com or docs.google.com, and create instant desktop icons.'
        }
      ];
    case 'fedora':
      return [
        {
          title: 'OnlyOffice Desktop Editors (100% MS Office Fidelity)',
          icon: '📄',
          description: 'Full native compatibility with DOCX, XLSX, and PPTX files for corporate client deliverables.',
          howTo: 'Install via Flatpak: flatpak install flathub org.onlyoffice.desktopeditors.'
        },
        {
          title: 'Isolated Developer Containers (Podman & Toolbx)',
          icon: '📦',
          description: 'Run multiple Python, Node.js, and Rust toolchain versions in isolated containers without polluting your host workstation.',
          howTo: 'Spin up a containerized dev environment instantly with `toolbox create` and `toolbox enter`.',
          appliesDistrobox: true
        }
      ];
    case 'ubuntu-studio':
      return [
        {
          title: 'Drawing Tablet Calibration (Wacom / Huion / XP-Pen)',
          icon: '🖊️',
          description: 'Plug-and-play pressure sensitivity, stylus button mapping, and multi-monitor screen mapping.',
          howTo: 'Open Settings → Wacom Tablet or Graphics Tablet to calibrate pressure curves and map active display area.'
        },
        {
          title: 'DaVinci Resolve & OBS Streaming Studio',
          icon: '🎬',
          description: 'Professional 4K color grading, multi-track timeline video editing, and hardware-accelerated screen capture.',
          howTo: 'Install DaVinci Resolve via MakerEZ script or launch pre-configured OBS Studio with PipeWire low-latency capture.'
        }
      ];
    case 'proxmox-ve':
      return [
        {
          title: 'Proxmox Helper Scripts (1-Click LXC Containers)',
          icon: '⚡',
          description: 'Deploy Plex, Pi-hole, Home Assistant, Docker, and 100+ services into lightweight LXC containers in 10 seconds.',
          howTo: 'Run community helper scripts from community-scripts.github.io/proxcp/ directly in the Proxmox Shell.'
        },
        {
          title: 'Automated Nightly Backups to NAS / PBS',
          icon: '🛡️',
          description: 'Snapshot all your VMs and LXCs with zero downtime and deduplicated incremental storage.',
          howTo: 'Under Datacenter → Backup → Add, configure a daily schedule targeting an NFS, SMB, or PBS storage pool.'
        }
      ];
    case 'truenas-scale':
      return [
        {
          title: 'Nextcloud Private Family Cloud',
          icon: '☁️',
          description: 'Self-hosted Google Drive / Dropbox replacement with mobile auto-upload, calendar, and contacts.',
          howTo: 'Install the official Nextcloud app from the TrueNAS SCALE Apps catalog with one click.',
          appliesDockerApp: 'nextcloud'
        },
        {
          title: 'ZFS Scrub & SMART Disk Health Alerts',
          icon: '🩺',
          description: 'Automated disk health monitoring and monthly bit-rot repair to ensure zero silent data corruption.',
          howTo: 'Under Data Protection → Scrub Tasks, schedule bi-weekly pool scrubs and configure email/webhook alerts.'
        }
      ];
    default:
      return [
        {
          title: 'Containerize Any Service (Docker & Compose)',
          icon: '🐳',
          description: 'Run media servers, ad-blockers, smart home, and coding sandboxes in isolated containers.',
          howTo: 'Install Docker with one command (curl -fsSL https://get.docker.com | sh) and run any homelab app.',
          appliesDockerApp: 'immich'
        },
        {
          title: 'Secure Remote Access (Tailscale VPN)',
          icon: '🔒',
          description: 'Access your machine securely from anywhere outside the house without opening router ports.',
          howTo: 'Install Tailscale to join your personal private mesh network in 30 seconds.',
          appliesDockerApp: 'tailscale'
        }
      ];
  }
}

function renderDesktopAppSuite(isPrimary: boolean): string {
  const selectedCount = (state.criteria.desktopApps || []).length;
  const isExpanded = isPrimary || selectedCount > 0;

  const innerContent = `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 min-w-0">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xl shrink-0">📦</span>
          <h3 class="text-base sm:text-lg font-bold text-slate-100 break-words">1-Click Desktop Application Suite</h3>
          ${isPrimary ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Recommended for Workstations</span>` : ''}
        </div>
        <p class="text-xs text-slate-400 mt-1 break-words">
          Select popular GUI applications and developer tools. DistroTailor generates an automated unattended <code class="text-emerald-400">bootstrap-apps.sh</code> script (via APT & Flatpak):
        </p>
      </div>
      <span class="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap shrink-0 self-start sm:self-auto">
        ${selectedCount} Selected
      </span>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 text-xs min-w-0">
      ${DESKTOP_APPS_REGISTRY.map((app) => {
        const isSelected = (state.criteria.desktopApps || []).includes(app.id);
        return `
          <div data-app-id="${app.id}" class="btn-toggle-desktop-app p-2.5 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between min-w-0 ${isSelected ? 'bg-emerald-950/20 border-emerald-500/60 shadow-md shadow-emerald-950/30' : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'}">
            <div class="flex items-center justify-between mb-1.5 gap-1.5 min-w-0">
              <span class="text-xl shrink-0">${app.icon}</span>
              <div class="w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold ${isSelected ? 'bg-emerald-400 border-emerald-400 text-slate-950' : 'border-slate-700 bg-slate-900'}">
                ${isSelected ? '✓' : ''}
              </div>
            </div>
            <div class="min-w-0">
              <span class="font-bold text-slate-200 block truncate text-xs">${app.name}</span>
              <span class="text-[10px] text-slate-400 block truncate">${app.category}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  if (isPrimary) {
    return `
      <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-8 min-w-0 overflow-hidden">
        ${innerContent}
      </div>
    `;
  }

  return `
    <details class="group bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 min-w-0 overflow-hidden transition-all" ${isExpanded ? 'open' : ''}>
      <summary class="flex items-center justify-between cursor-pointer select-none text-xs font-semibold text-slate-300">
        <span class="flex items-center gap-2 flex-wrap">
          <span class="text-lg">📦</span>
          <span>Need Desktop GUI Apps on this Server? (Click to view desktop app installer)</span>
          ${selectedCount > 0 ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">${selectedCount} active</span>` : ''}
        </span>
        <span class="text-slate-500 group-open:rotate-180 transition-transform text-sm shrink-0">▼</span>
      </summary>
      <div class="mt-4 pt-4 border-t border-slate-800">
        ${innerContent}
      </div>
    </details>
  `;
}

function renderDockerServiceSuite(isPrimary: boolean): string {
  const hasDockerApp = state.criteria.dockerApp && state.criteria.dockerApp !== 'none';
  const isExpanded = isPrimary || !!hasDockerApp;

  const innerContent = `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 min-w-0">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xl shrink-0">🐳</span>
          <h3 class="text-base sm:text-lg font-bold text-slate-100 break-words">Turnkey Service Layer (Docker Compose)</h3>
          ${isPrimary ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Recommended for Server & Homelab</span>` : ''}
        </div>
        <p class="text-xs text-slate-400 mt-1 break-words">
          Deploy a turnkey self-hosted containerized app. Injects <code class="text-emerald-400">docker-compose.yml</code> and Makefile targets (<code class="text-emerald-400">make app-up</code>):
        </p>
      </div>
      ${hasDockerApp ? `
        <span class="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap shrink-0 self-start sm:self-auto">
          ${getDockerApp(state.criteria.dockerApp)?.name} Configured
        </span>
      ` : ''}
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs min-w-0">
      
      <!-- None / Pure Minimal OS Card -->
      <div data-docker-id="none" class="btn-select-docker-app p-3 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between min-w-0 ${(!state.criteria.dockerApp || state.criteria.dockerApp === 'none') ? 'bg-emerald-950/20 border-emerald-500/60 shadow-md shadow-emerald-950/30' : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'}">
        <div>
          <div class="flex items-center justify-between mb-1 gap-1.5">
            <span class="text-xl shrink-0">🚫</span>
            ${(!state.criteria.dockerApp || state.criteria.dockerApp === 'none') ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">ACTIVE</span>` : ''}
          </div>
          <h4 class="font-bold text-slate-200 text-xs">None (Pure OS Minimal)</h4>
          <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">No extra background containers. Keep the OS footprint ultra-lean.</p>
        </div>
        <div class="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
          Pure Native Host
        </div>
      </div>

      ${DOCKER_APPS_REGISTRY.map((app) => {
        const isSelected = state.criteria.dockerApp === app.id;
        return `
          <div data-docker-id="${app.id}" class="btn-select-docker-app p-3 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between min-w-0 ${isSelected ? 'bg-emerald-950/20 border-emerald-500/60 shadow-md shadow-emerald-950/30' : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'}">
            <div>
              <div class="flex items-center justify-between mb-1 gap-1.5">
                <span class="text-xl shrink-0">${app.icon}</span>
                ${isSelected ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">ACTIVE</span>` : `<span class="text-[10px] text-slate-500 font-mono">Port ${app.defaultPort}</span>`}
              </div>
              <h4 class="font-bold text-slate-200 text-xs">${app.name}</h4>
              <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">${app.description}</p>
            </div>
            <div class="mt-3 pt-2 border-t border-slate-800/80 text-[10px] ${isSelected ? 'text-emerald-400 font-bold' : 'text-slate-500'} font-mono flex items-center justify-between">
              <span>${isSelected ? '✓ In docker-compose.yml' : '+ Deploy with Docker'}</span>
              <span>↗</span>
            </div>
          </div>
        `;
      }).join('')}

    </div>
  `;

  if (isPrimary) {
    return `
      <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-8 min-w-0 overflow-hidden">
        ${innerContent}
      </div>
    `;
  }

  return `
    <details class="group bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 min-w-0 overflow-hidden transition-all" ${isExpanded ? 'open' : ''}>
      <summary class="flex items-center justify-between cursor-pointer select-none text-xs font-semibold text-slate-300">
        <span class="flex items-center gap-2 flex-wrap">
          <span class="text-lg">🐳</span>
          <span>Also want to run self-hosted Docker services on this desktop? (Click to view options)</span>
          ${hasDockerApp ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">${getDockerApp(state.criteria.dockerApp)?.name} active</span>` : ''}
        </span>
        <span class="text-slate-500 group-open:rotate-180 transition-transform text-sm shrink-0">▼</span>
      </summary>
      <div class="mt-4 pt-4 border-t border-slate-800">
        ${innerContent}
      </div>
    </details>
  `;
}

function renderResultsView(evaluation: RecommendationOutput): string {
  const best = evaluation.bestMatch;
  const recipe = evaluation.recommendedRecipe;
  const combos = getAddonCombos(best.distro.id);

  const isServerContext =
    state.criteria.platform === 'server' ||
    state.criteria.platform === 'vm' ||
    state.criteria.platform === 'container' ||
    state.criteria.platform === 'k8s-node' ||
    state.criteria.platform === 'router-firewall' ||
    state.criteria.platform === 'microcontroller' ||
    state.criteria.useCase === 'server' ||
    state.criteria.useCase === 'nas-storage' ||
    state.criteria.useCase === 'smart-home' ||
    state.criteria.useCase === 'hypervisor-vms' ||
    state.criteria.useCase === 'k8s-cluster' ||
    state.criteria.useCase === 'container-base' ||
    state.criteria.useCase === 'router-networking' ||
    state.criteria.useCase === 'iot-embedded' ||
    state.criteria.prefersGui === false;

  return `
    <div class="space-y-6 min-w-0 max-w-full overflow-hidden">

      <!-- Shared Configuration Notice Banner -->
      ${state.isSharedView ? `
        <div class="bg-indigo-950/40 border border-indigo-700/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-xl animate-in fade-in min-w-0 overflow-hidden">
          <div class="flex items-center gap-3.5 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-indigo-900/60 border border-indigo-600/40 flex items-center justify-center text-xl shrink-0">
              🔗
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="font-bold text-indigo-100 text-sm break-words">You are viewing a shared tailored Linux build!</h4>
              <p class="text-slate-400 text-[11px] mt-0.5 break-words">
                Configured with <strong>${Object.keys(state.criteria).length} tailored criteria</strong>. You can inspect the recipe, tweak any choice, or start your own build.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
            <button id="btn-tweak-shared" class="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md">
              Tweak Choices
            </button>
            <button id="btn-start-fresh" class="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-medium transition-all">
              Start Fresh
            </button>
          </div>
        </div>
      ` : ''}
      
      <!-- Top Match Winner Banner -->
      <div class="bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950 border border-emerald-500/30 rounded-2xl p-4 sm:p-8 relative overflow-hidden shadow-2xl min-w-0">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 min-w-0">
          <div class="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto">
            <span class="text-3xl sm:text-5xl p-2 rounded-2xl bg-slate-900 border border-slate-700/60 shrink-0">${best.distro.logoEmoji || '🐧'}</span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h2 class="text-xl sm:text-3xl font-extrabold text-slate-100 break-words">${best.distro.name}</h2>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                  ${best.score}% Match
                </span>
              </div>
              <p class="text-xs sm:text-sm text-emerald-300 font-medium mt-1 break-words">${best.distro.tagline}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            <button id="btn-share-match" class="flex-1 sm:flex-none justify-center px-3.5 py-2 sm:py-2.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/50 transition-all flex items-center gap-1.5 shadow-md cursor-pointer" title="Share this tailored match permalink">
              <span>🔗</span> Share Match
            </button>
            <a href="${best.distro.website}" target="_blank" rel="noopener noreferrer" class="flex-1 sm:flex-none justify-center px-3.5 py-2 sm:py-2.5 text-xs font-bold rounded-lg bg-emerald-400 text-slate-950 hover:bg-emerald-300 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/40">
              Official Site ↗
            </a>
          </div>
        </div>

        <p class="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5 break-words">${best.distro.description}</p>

        <!-- Technical Attributes Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs mb-6 min-w-0">
          <div class="bg-slate-950/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 min-w-0 overflow-hidden">
            <span class="text-slate-500 block text-[10px] sm:text-[11px] uppercase font-semibold">Typical Footprint</span>
            <span class="font-medium text-slate-200 capitalize mt-0.5 block truncate">${best.distro.footprint}</span>
          </div>
          <div class="bg-slate-950/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 min-w-0 overflow-hidden">
            <span class="text-slate-500 block text-[10px] sm:text-[11px] uppercase font-semibold">Init System</span>
            <span class="font-medium text-slate-200 mt-0.5 block truncate" title="${best.distro.initSystems.join(', ')}">${best.distro.initSystems.join(', ')}</span>
          </div>
          <div class="bg-slate-950/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 min-w-0 overflow-hidden">
            <span class="text-slate-500 block text-[10px] sm:text-[11px] uppercase font-semibold">C Library</span>
            <span class="font-medium text-slate-200 mt-0.5 block truncate" title="${best.distro.cLibraries.join(', ')}">${best.distro.cLibraries.join(', ')}</span>
          </div>
          <div class="bg-slate-950/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 min-w-0 overflow-hidden">
            <span class="text-slate-500 block text-[10px] sm:text-[11px] uppercase font-semibold">State Model</span>
            <span class="font-medium text-slate-200 capitalize mt-0.5 block truncate" title="${best.distro.stateModel}">${best.distro.stateModel}</span>
          </div>
        </div>

        <!-- Strengths vs Tradeoffs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs min-w-0">
          <div class="bg-emerald-950/30 border border-emerald-900/40 rounded-xl p-3.5 sm:p-4 min-w-0">
            <h4 class="font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
              <span>✨</span> Key Strengths
            </h4>
            <ul class="space-y-1.5 text-slate-300">
              ${best.distro.highlights.map((h) => `<li class="break-words">• ${h}</li>`).join('')}
            </ul>
          </div>
          <div class="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3.5 sm:p-4 min-w-0">
            <h4 class="font-bold text-amber-400 mb-2 flex items-center gap-1.5">
              <span>⚖️</span> Trade-offs
            </h4>
            <ul class="space-y-1.5 text-slate-300">
              ${best.distro.tradeoffs.map((t) => `<li class="break-words">• ${t}</li>`).join('')}
            </ul>
          </div>
        </div>

      </div>

      <!-- 🧪 The Frankenstein Spectrum: Interactive Base OS Modifiers -->
      <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-8 min-w-0 overflow-hidden">
        <div class="mb-4 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-xl shrink-0">🧪</span>
            <h3 class="text-base sm:text-lg font-bold text-slate-100 break-words">The "Frankenstein" Spectrum: Interactive Base OS Modifiers</h3>
          </div>
          <p class="text-xs text-slate-400 mt-1 break-words">
            Linux distribution names are starting points. Click below to inject userspace subsystems, compositors, and package managers directly into your Makefile:
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-3.5 text-xs min-w-0">
          
          <!-- Distrobox Card -->
          <div class="p-3.5 rounded-xl border flex flex-col justify-between min-w-0 transition-all ${state.criteria.enableDistrobox ? 'bg-emerald-950/20 border-emerald-500/60 shadow-lg shadow-emerald-950/30' : 'bg-slate-950/80 border-slate-800'}">
            <div>
              <div class="flex items-center justify-between mb-1.5 gap-1.5">
                <span class="font-semibold text-slate-200 flex items-center gap-1.5 break-words">
                  <span>🏛️ ⇄ 🏹</span> Debian Base + Arch AUR
                </span>
                ${state.criteria.enableDistrobox ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">ACTIVE</span>` : ''}
              </div>
              <p class="text-slate-400 leading-relaxed text-[11px] mb-3 break-words">
                Run Arch's <code class="text-emerald-400">pacman</code> and AUR packages directly on this host base via Distrobox container pods.
              </p>
            </div>
            <button id="btn-toggle-distrobox" class="w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${state.criteria.enableDistrobox ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-emerald-400 border border-slate-700'}">
              <span>${state.criteria.enableDistrobox ? '✓ Distrobox In Makefile' : '+ Enable Distrobox in Makefile'}</span>
            </button>
          </div>

          <!-- Desktop Environment / Compositor Card -->
          <div class="p-3.5 rounded-xl border flex flex-col justify-between min-w-0 transition-all bg-slate-950/80 border-slate-800">
            <div>
              <div class="flex items-center justify-between mb-1.5 gap-1.5">
                <span class="font-semibold text-slate-200 flex items-center gap-1.5 break-words">
                  <span>🖼️</span> Desktop Compositor
                </span>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 shrink-0 uppercase">
                  ${state.criteria.desktopEnv || (state.criteria.prefersGui ? 'cage' : 'none')}
                </span>
              </div>
              <p class="text-slate-400 leading-relaxed text-[11px] mb-3 break-words">
                Select your display server or compositor. Updates <code class="text-emerald-400">DESKTOP_ENV</code> in the Makefile:
              </p>
            </div>
            <div class="grid grid-cols-3 gap-1.5">
              ${(['none', 'cage', 'xfce', 'kde', 'gnome'] as DesktopEnvId[]).map(env => `
                <button data-desktop-env="${env}" class="btn-select-desktop-env py-1.5 px-1 rounded text-[10px] font-mono font-medium transition-all text-center cursor-pointer ${ (state.criteria.desktopEnv || (state.criteria.prefersGui ? 'cage' : 'none')) === env ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800' }">
                  ${env}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Universal Package Layers Card -->
          <div class="p-3.5 rounded-xl border flex flex-col justify-between min-w-0 transition-all ${(state.criteria.enableNix || state.criteria.enableFlatpak) ? 'bg-emerald-950/20 border-emerald-500/60 shadow-lg shadow-emerald-950/30' : 'bg-slate-950/80 border-slate-800'}">
            <div>
              <div class="flex items-center justify-between mb-1.5 gap-1.5">
                <span class="font-semibold text-slate-200 flex items-center gap-1.5 break-words">
                  <span>❄️ ⇄ 📦</span> Universal Packages
                </span>
                ${(state.criteria.enableNix || state.criteria.enableFlatpak) ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">ACTIVE</span>` : ''}
              </div>
              <p class="text-slate-400 leading-relaxed text-[11px] mb-3 break-words">
                Keep the rootfs immutable. Layer user apps via Nix package manager or Flatpak sandboxes:
              </p>
            </div>
            <div class="grid grid-cols-2 gap-1.5">
              <button id="btn-toggle-nix" class="py-2 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${state.criteria.enableNix ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}">
                <span>${state.criteria.enableNix ? '✓ Nix ON' : '+ Nix'}</span>
              </button>
              <button id="btn-toggle-flatpak" class="py-2 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${state.criteria.enableFlatpak ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}">
                <span>${state.criteria.enableFlatpak ? '✓ Flatpak ON' : '+ Flatpak'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- 📦 Applications & Turnkey Services Suite (Context-Aware) -->
      ${isServerContext ? `
        ${renderDockerServiceSuite(true)}
        ${renderDesktopAppSuite(false)}
      ` : `
        ${renderDesktopAppSuite(true)}
        ${renderDockerServiceSuite(false)}
      `}

      <!-- 🧩 Mix & Match Hybrid Combos -->
      <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-8 min-w-0 overflow-hidden">
        <div class="mb-5 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-xl shrink-0">🧩</span>
            <h3 class="text-base sm:text-lg font-bold text-slate-100 break-words">Mix & Match: Popular Combos for ${best.distro.name}</h3>
          </div>
          <p class="text-xs text-slate-400 mt-1 break-words">
            Linux is modular. Click any combo below to immediately wire its configuration into your build recipe:
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 min-w-0">
          ${combos.map((combo, idx) => {
            const isApplied = (combo.appliesDockerApp && state.criteria.dockerApp === combo.appliesDockerApp) ||
                              (combo.appliesDesktopEnv && (state.criteria.desktopEnv || (state.criteria.prefersGui ? 'cage' : 'none')) === combo.appliesDesktopEnv) ||
                              (combo.appliesDistrobox && state.criteria.enableDistrobox);

            return `
              <div class="p-3.5 sm:p-4 rounded-xl border flex flex-col justify-between min-w-0 transition-all ${isApplied ? 'bg-emerald-950/20 border-emerald-500/60 shadow-lg shadow-emerald-950/30' : 'bg-slate-950/80 border-slate-800'}">
                <div>
                  <div class="flex items-center justify-between mb-2 gap-2 min-w-0">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <span class="text-2xl shrink-0">${combo.icon}</span>
                      <h4 class="text-sm font-semibold text-slate-200 break-words">${combo.title}</h4>
                    </div>
                    ${isApplied ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">INCLUDED</span>` : ''}
                  </div>
                  <p class="text-xs text-slate-400 leading-relaxed mb-3 break-words">${combo.description}</p>
                </div>
                <div class="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 min-w-0">
                  <span class="text-[11px] text-slate-400 font-mono truncate">👉 ${combo.howTo}</span>
                  ${(combo.appliesDockerApp || combo.appliesDesktopEnv || combo.appliesDistrobox) ? `
                    <button data-combo-idx="${idx}" class="btn-toggle-combo px-2.5 py-1 rounded text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${isApplied ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-700'}">
                      ${isApplied ? '✓ Active' : '+ Apply'}
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Option A: Turnkey Prebuilt Download (Maximum Convenience) -->
      ${best.distro.prebuiltImage ? `
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-8 min-w-0 overflow-hidden">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 min-w-0">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xl shrink-0">🚀</span>
                <h3 class="text-base sm:text-lg font-bold text-slate-100 break-words">Ready-To-Flash Official Image</h3>
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">Maximum Convenience</span>
              </div>
              <p class="text-xs text-slate-400 mt-1 break-words">
                Download the official turnkey image directly. Includes universal out-of-the-box hardware drivers and pre-configured defaults—ready to flash in minutes with BalenaEtcher or Raspberry Pi Imager.
              </p>
            </div>
            <a href="${best.distro.prebuiltImage.downloadUrl}" target="_blank" rel="noopener noreferrer" class="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 transition-all flex items-center gap-1.5 whitespace-nowrap shadow-md shrink-0">
              Download ${best.distro.name} Image ↗
            </a>
          </div>

          <!-- Convenience Attributes Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs pt-3 border-t border-slate-800/80">
            <div class="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
              <span class="text-slate-500 block text-[10px] uppercase font-semibold">Workflow</span>
              <span class="font-medium text-slate-200 mt-0.5 block truncate">Zero-Compile Flash</span>
            </div>
            <div class="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
              <span class="text-slate-500 block text-[10px] uppercase font-semibold">Hardware Support</span>
              <span class="font-medium text-slate-200 mt-0.5 block truncate">Universal Driver Pool</span>
            </div>
            <div class="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
              <span class="text-slate-500 block text-[10px] uppercase font-semibold">Typical Size</span>
              <span class="font-medium text-slate-200 mt-0.5 block truncate">Standard Full Image</span>
            </div>
            <div class="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
              <span class="text-slate-500 block text-[10px] uppercase font-semibold">Setup Time</span>
              <span class="font-medium text-slate-200 mt-0.5 block truncate">&lt; 5 minutes</span>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Option B: Custom Build Recipe Generator Section (Tailored Hardware Optimization) -->
      ${recipe ? `
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-8 min-w-0 overflow-hidden">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 min-w-0">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xl shrink-0">🛠️</span>
                <h3 class="text-base sm:text-lg font-bold text-slate-100 break-words">${recipe.title}</h3>
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Tailored Hardware Optimization</span>
              </div>
              <p class="text-xs text-slate-400 mt-1 break-words">${recipe.summary}</p>
            </div>
            
            <div class="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
              <button id="btn-share-recipe" class="flex-1 sm:flex-none justify-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer" title="Share this build recipe permalink">
                <span>🔗</span> Share
              </button>
              <button id="btn-copy-recipe" class="flex-1 sm:flex-none justify-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-emerald-400 border border-slate-700 hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer">
                <span>📋</span> Copy File
              </button>
            </div>
          </div>

          <!-- Optimization Benefits Bar -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs mb-4">
            <div class="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
              <span class="text-slate-500 block text-[10px] uppercase font-semibold">Tailored Footprint</span>
              <span class="font-medium text-emerald-400 mt-0.5 block truncate">~150MB – 350MB Base</span>
            </div>
            <div class="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
              <span class="text-slate-500 block text-[10px] uppercase font-semibold">Hardware Drivers</span>
              <span class="font-medium text-emerald-400 mt-0.5 block truncate">Isolated Active Chips</span>
            </div>
            <div class="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
              <span class="text-slate-500 block text-[10px] uppercase font-semibold">Idle RAM</span>
              <span class="font-medium text-emerald-400 mt-0.5 block truncate">~60MB – 150MB</span>
            </div>
            <div class="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
              <span class="text-slate-500 block text-[10px] uppercase font-semibold">Cold Boot</span>
              <span class="font-medium text-emerald-400 mt-0.5 block truncate">&lt; 2 – 4 seconds</span>
            </div>
          </div>

          <!-- Dependencies & Build Info -->
          <div class="flex flex-wrap gap-2 text-xs mb-4 min-w-0">
            <span class="px-2.5 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800 break-words">
              ⏱️ Build Time: ~${recipe.estimatedBuildTimeMinutes} mins
            </span>
            <span class="px-2.5 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800 break-words">
              📦 Dependencies: ${recipe.hostDependencies.join(', ')}
            </span>
          </div>

          <!-- File Tabs -->
          <div class="flex items-center gap-1.5 sm:gap-2 border-b border-slate-800 mb-0 overflow-x-auto max-w-full pb-0.5 no-scrollbar">
            ${recipe.files.map((file, idx) => `
              <button data-file-idx="${idx}" class="recipe-tab px-3 py-2 text-xs font-mono font-medium rounded-t-lg border-b-2 transition-all whitespace-nowrap shrink-0 ${state.activeFileIndex === idx ? 'border-emerald-500 text-emerald-400 bg-slate-950' : 'border-transparent text-slate-400 hover:text-slate-200'}">
                ${file.filename}
              </button>
            `).join('')}
          </div>

          <!-- Code View -->
          <div class="relative bg-slate-950 border border-slate-800 rounded-b-xl p-3 sm:p-4 overflow-x-auto max-h-96 text-xs font-mono text-slate-300 leading-relaxed max-w-full">
            <pre class="overflow-x-auto min-w-0 max-w-full whitespace-pre font-mono"><code>${escapeHtml(recipe.files[state.activeFileIndex]?.content || '')}</code></pre>
          </div>

          <!-- Quickstart Snippet -->
          <div class="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden min-w-0 max-w-full">
            <span class="text-xs text-slate-500 uppercase tracking-wider block mb-1 font-semibold">Quickstart Commands:</span>
            <pre class="text-xs font-mono text-emerald-400 overflow-x-auto p-1 max-w-full whitespace-pre"><code>${recipe.quickstartCommands.join('\n')}</code></pre>
          </div>

        </div>
      ` : ''}

      <!-- 🧪 3-Tier Verification & Testing Ladder -->
      <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-8 min-w-0 overflow-hidden">
        <div class="mb-5 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-xl shrink-0">🧪</span>
            <h3 class="text-base sm:text-lg font-bold text-slate-100 break-words">3-Tier Verification & Testing Ladder</h3>
          </div>
          <p class="text-xs text-slate-400 mt-1 break-words">
            Test and verify your tailored build across three levels of hardware access—from zero-risk browser sandboxes to physical silicon.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 min-w-0">
          <!-- Tier 1: In-Browser Instant Sandbox -->
          <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
            <div>
              <div class="flex items-center gap-2 mb-2 min-w-0">
                <span class="text-base shrink-0">🌐</span>
                <h4 class="text-sm font-bold text-sky-400 break-words">Tier 1: Instant In-Browser</h4>
              </div>
              <p class="text-xs text-slate-400 mb-3 leading-relaxed break-words">
                Zero installation, zero risk. Emulate x86 boot and interactive terminal commands directly in your browser tab via WebAssembly (v86 PC emulator).
              </p>
              <div class="text-[11px] font-mono bg-slate-900 p-2.5 rounded border border-slate-800 text-slate-300 break-words">
                <span class="text-slate-500 uppercase tracking-wider block mb-1 text-[10px] font-semibold">How to test:</span>
                Select WASM in questions or open the generated HTML WebVM file in Chrome/Firefox.
              </div>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span class="text-[11px] text-sky-400 font-medium">⚡ 0% Drive Risk</span>
              <span class="text-[11px] text-slate-500">WASM Sandbox</span>
            </div>
          </div>

          <!-- Tier 2: Safe VM Sandbox -->
          <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
            <div>
              <div class="flex items-center gap-2 mb-2 min-w-0">
                <span class="text-base shrink-0">🖧</span>
                <h4 class="text-sm font-bold text-emerald-400 break-words">Tier 2: Safe VM Sandbox</h4>
              </div>
              <p class="text-xs text-slate-400 mb-3 leading-relaxed break-words">
                Safe desktop hypervisor testing before touching physical drives. Test GUI desktop, networking, and systemd services in complete isolation.
              </p>
              <div class="text-[11px] font-mono bg-slate-900 p-2.5 rounded border border-slate-800 text-slate-300 space-y-1.5 overflow-x-auto min-w-0 max-w-full">
                <span class="text-slate-500 uppercase tracking-wider block text-[10px] font-semibold">QEMU Command:</span>
                <pre class="text-emerald-400 block text-[10px] overflow-x-auto p-0.5 max-w-full whitespace-pre font-mono"><code>qemu-system-x86_64 -cdrom output/*.iso -m 2048 -enable-kvm</code></pre>
                <span class="text-slate-500 block text-[10px] break-words">macOS: replace -enable-kvm with -accel hvf</span>
              </div>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span class="text-[11px] text-emerald-400 font-medium">🛡️ Isolated Sandbox</span>
              <span class="text-[11px] text-slate-500">QEMU / UTM / VBox</span>
            </div>
          </div>

          <!-- Tier 3: Direct Bare-Metal Hardware -->
          <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
            <div>
              <div class="flex items-center gap-2 mb-2 min-w-0">
                <span class="text-base shrink-0">⚡</span>
                <h4 class="text-sm font-bold text-amber-400 break-words">Tier 3: Bare-Metal Live USB</h4>
              </div>
              <p class="text-xs text-slate-400 mb-3 leading-relaxed break-words">
                Flash bootable ISO to physical USB. Boot real silicon to verify Wi-Fi, GPU acceleration, and pro audio with zero hard drive changes.
              </p>
              <div class="text-[11px] font-mono bg-slate-900 p-2.5 rounded border border-slate-800 text-slate-300 space-y-1 min-w-0">
                <span class="text-slate-500 uppercase tracking-wider block text-[10px] font-semibold">Flash & Boot Keys:</span>
                <span class="block text-slate-300 break-words">1. Flash via <strong>BalenaEtcher</strong> or <strong>Rufus</strong></span>
                <span class="block text-slate-300 break-words">2. Boot: Tap <strong>F12</strong> (Dell/Lenovo), <strong>Del/F8</strong> (Asus), or <strong>Option ⌥</strong> (Mac)</span>
              </div>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span class="text-[11px] text-amber-400 font-medium">🚀 Native Silicon Speed</span>
              <span class="text-[11px] text-slate-500">UEFI USB Boot</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}

function renderExpertMatrix(): string {
  return `
    <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-8 backdrop-blur space-y-6 shadow-xl min-w-0 max-w-full overflow-hidden">
      <div>
        <h2 class="text-lg sm:text-xl font-bold text-slate-100 mb-1 break-words">🛠️ Expert Constraint Matrix</h2>
        <p class="text-xs text-slate-400 break-words">Directly set exact architecture, init system, C library, and footprint flags.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs min-w-0">
        
        <!-- Architecture -->
        <div class="min-w-0">
          <label class="block text-slate-400 font-semibold mb-1.5">CPU Architecture</label>
          <select id="expert-arch" class="w-full max-w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200">
            <option value="">Any Architecture</option>
            <option value="x86_64" ${state.criteria.architecture === 'x86_64' ? 'selected' : ''}>x86_64 / AMD64</option>
            <option value="arm64" ${state.criteria.architecture === 'arm64' ? 'selected' : ''}>ARM64 / AArch64</option>
            <option value="armv7" ${state.criteria.architecture === 'armv7' ? 'selected' : ''}>ARMv7 (32-bit)</option>
            <option value="riscv64" ${state.criteria.architecture === 'riscv64' ? 'selected' : ''}>RISC-V 64-bit</option>
            <option value="nommu" ${state.criteria.architecture === 'nommu' ? 'selected' : ''}>NOMMU / Microcontroller</option>
          </select>
        </div>

        <!-- Footprint -->
        <div class="min-w-0">
          <label class="block text-slate-400 font-semibold mb-1.5">Storage & RAM Footprint</label>
          <select id="expert-footprint" class="w-full max-w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200">
            <option value="">Any Footprint</option>
            <option value="micro" ${state.criteria.footprint === 'micro' ? 'selected' : ''}>Extreme Micro (<16 MB)</option>
            <option value="minimal" ${state.criteria.footprint === 'minimal' ? 'selected' : ''}>Ultra-Minimal (16-100 MB)</option>
            <option value="lean" ${state.criteria.footprint === 'lean' ? 'selected' : ''}>Lean (100 MB - 1 GB)</option>
            <option value="standard" ${state.criteria.footprint === 'standard' ? 'selected' : ''}>Standard (1 - 5 GB)</option>
            <option value="full" ${state.criteria.footprint === 'full' ? 'selected' : ''}>Full Workstation (>5 GB)</option>
          </select>
        </div>

        <!-- Init System -->
        <div class="min-w-0">
          <label class="block text-slate-400 font-semibold mb-1.5">Init System Preference</label>
          <select id="expert-init" class="w-full max-w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200">
            <option value="">No Preference</option>
            <option value="systemd" ${state.criteria.initPreference === 'systemd' ? 'selected' : ''}>systemd</option>
            <option value="openrc" ${state.criteria.initPreference === 'openrc' ? 'selected' : ''}>OpenRC</option>
            <option value="busybox" ${state.criteria.initPreference === 'busybox' ? 'selected' : ''}>BusyBox Init</option>
            <option value="runit" ${state.criteria.initPreference === 'runit' ? 'selected' : ''}>runit</option>
          </select>
        </div>

        <!-- C Library -->
        <div class="min-w-0">
          <label class="block text-slate-400 font-semibold mb-1.5">C Standard Library</label>
          <select id="expert-clib" class="w-full max-w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200">
            <option value="">No Preference</option>
            <option value="glibc" ${state.criteria.cLibPreference === 'glibc' ? 'selected' : ''}>glibc (GNU C Library)</option>
            <option value="musl" ${state.criteria.cLibPreference === 'musl' ? 'selected' : ''}>musl libc</option>
            <option value="uclibc-ng" ${state.criteria.cLibPreference === 'uclibc-ng' ? 'selected' : ''}>uClibc-ng (NOMMU)</option>
          </select>
        </div>

        <!-- State Model -->
        <div class="min-w-0">
          <label class="block text-slate-400 font-semibold mb-1.5">State Management</label>
          <select id="expert-state" class="w-full max-w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200">
            <option value="">Any State Model</option>
            <option value="mutable" ${state.criteria.statePreference === 'mutable' ? 'selected' : ''}>Traditional Mutable</option>
            <option value="declarative" ${state.criteria.statePreference === 'declarative' ? 'selected' : ''}>Declarative (NixOS)</option>
            <option value="immutable-ostree" ${state.criteria.statePreference === 'immutable-ostree' ? 'selected' : ''}>Atomic / Immutable (OSTree)</option>
            <option value="stateless-ram" ${state.criteria.statePreference === 'stateless-ram' ? 'selected' : ''}>Stateless / Run from RAM</option>
          </select>
        </div>

        <!-- Role -->
        <div class="min-w-0">
          <label class="block text-slate-400 font-semibold mb-1.5">Primary Target Role</label>
          <select id="expert-role" class="w-full max-w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200">
            <option value="">Any Role</option>
            <option value="gaming" ${state.criteria.useCase === 'gaming' ? 'selected' : ''}>Gaming & Arcade</option>
            <option value="media-center" ${state.criteria.useCase === 'media-center' ? 'selected' : ''}>Living Room Media Center (Kodi)</option>
            <option value="education-kids" ${state.criteria.useCase === 'education-kids' ? 'selected' : ''}>Kids & Education</option>
            <option value="nas-storage" ${state.criteria.useCase === 'nas-storage' ? 'selected' : ''}>NAS & Family Photo Backups</option>
            <option value="router-networking" ${state.criteria.useCase === 'router-networking' ? 'selected' : ''}>Router & Firewall</option>
            <option value="kiosk-signage" ${state.criteria.useCase === 'kiosk-signage' ? 'selected' : ''}>Kiosk & Digital Signage</option>
            <option value="container-base" ${state.criteria.useCase === 'container-base' ? 'selected' : ''}>Container Base Image</option>
            <option value="k8s-cluster" ${state.criteria.useCase === 'k8s-cluster' ? 'selected' : ''}>Kubernetes Node</option>
            <option value="iot-embedded" ${state.criteria.useCase === 'iot-embedded' ? 'selected' : ''}>IoT & Embedded</option>
            <option value="browser-wasm" ${state.criteria.useCase === 'browser-wasm' ? 'selected' : ''}>In-Browser WebAssembly</option>
          </select>
        </div>

      </div>

      <div class="pt-4 border-t border-slate-800 flex justify-end">
        <button id="btn-apply-expert" class="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-400 text-slate-950 hover:bg-emerald-300 transition-all cursor-pointer shadow-lg shadow-emerald-950/40 text-center">
          Apply Constraints & View Results →
        </button>
      </div>

    </div>
  `;
}

function renderShareModal(evaluation: RecommendationOutput): string {
  const best = evaluation.bestMatch;
  const url = window.location.href;
  const markdownSummary = generateMarkdownSummary(evaluation);
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return `
    <div id="share-modal-backdrop" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 min-w-0 max-w-full overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 shrink-0 min-w-0 gap-2">
          <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span class="text-2xl sm:text-3xl p-1.5 sm:p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0">${best.distro.logoEmoji || '🐧'}</span>
            <div class="min-w-0">
              <h3 class="text-sm sm:text-base font-bold text-slate-100 truncate">Share Tailored Linux Build</h3>
              <p class="text-xs text-slate-400 truncate">${best.distro.name} (${best.score}% Match)</p>
            </div>
          </div>
          <button id="btn-close-share-modal" class="text-slate-400 hover:text-slate-200 text-base sm:text-lg p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0" title="Close">
            ✕
          </button>
        </div>

        <div class="overflow-y-auto flex-1 pr-0.5 space-y-4 min-w-0">
          <!-- Direct Shareable URL -->
          <div class="min-w-0">
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Direct Shareable Link (Preserves All Criteria)</label>
            <div class="flex items-center gap-2 min-w-0">
              <input type="text" readonly id="share-link-input" value="${url}" class="min-w-0 flex-1 bg-slate-950 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg text-xs font-mono select-all focus:outline-none focus:border-emerald-500" />
              <button id="btn-copy-share-link" class="px-3 sm:px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-400 text-slate-950 hover:bg-emerald-300 transition-colors shrink-0 flex items-center gap-1 cursor-pointer">
                <span>📋</span> <span class="hidden sm:inline">Copy</span>
              </button>
            </div>
            <p class="text-[11px] text-slate-500 mt-1">Anyone opening this link will see your exact tailored recommendation and build recipe.</p>
          </div>

          <!-- Formatted Markdown for Reddit, Discord, GitHub -->
          <div class="min-w-0">
            <div class="flex items-center justify-between mb-1.5 min-w-0 gap-2">
              <label class="text-xs font-semibold text-slate-300 truncate">Forum & Chat Markdown</label>
              <button id="btn-copy-markdown" class="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer shrink-0">
                <span>📋</span> Copy
              </button>
            </div>
            <textarea readonly id="share-markdown-preview" rows="4" class="w-full max-w-full bg-slate-950 border border-slate-800 text-slate-400 p-2.5 rounded-lg text-[11px] font-mono select-all focus:outline-none resize-none break-all">${escapeHtml(markdownSummary)}</textarea>
          </div>

          <!-- Quick Share Destinations -->
          <div class="min-w-0 shrink-0">
            <span class="block text-xs font-semibold text-slate-400 mb-2">Quick Share</span>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              ${canNativeShare ? `
                <button id="btn-native-share" class="col-span-2 sm:col-span-1 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 font-medium transition-colors cursor-pointer">
                  <span>📤</span> Device
                </button>
              ` : ''}
              <a href="https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(`Tailored Linux Distro Match: ${best.distro.name} (${best.score}%)`)}" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-orange-950/40 hover:bg-orange-900/40 text-orange-300 border border-orange-800/50 flex items-center justify-center gap-1.5 font-medium transition-colors text-center">
                <span>🤖</span> Reddit
              </a>
              <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`Found my Linux match with DistroTailor: ${best.distro.name} (${best.score}% Match)!`)}&url=${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-sky-950/40 hover:bg-sky-900/40 text-sky-300 border border-sky-800/50 flex items-center justify-center gap-1.5 font-medium transition-colors text-center">
                <span>🐦</span> X
              </a>
              <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my tailored Linux distro match: ${best.distro.name} (${best.score}%) - ${url}`)}" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-800/50 flex items-center justify-center gap-1.5 font-medium transition-colors text-center">
                <span>💬</span> WhatsApp
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

// Global keyboard handler registration guard
let keyboardHandlerRegistered = false;

function attachEventHandlers(
  nextQuestion: ReturnType<typeof flow.getNextQuestion>,
  evaluation: RecommendationOutput
) {
  // Brand Click (Fallback to clean home)
  document.getElementById('nav-brand')?.addEventListener('click', () => {
    fallbackToHomePage();
  });

  // Tab Toggles (with history push)
  document.getElementById('btn-toggle-wizard')?.addEventListener('click', () => {
    state.activeTab = 'wizard';
    saveStateToUrl(true);
    render();
    scrollToQuestionCard();
  });

  document.getElementById('btn-toggle-expert')?.addEventListener('click', () => {
    state.activeTab = 'expert';
    saveStateToUrl(true);
    render();
  });

  document.getElementById('btn-view-results')?.addEventListener('click', () => {
    state.activeTab = 'results';
    saveStateToUrl(true);
    render();
  });

  const resetAll = () => {
    fallbackToHomePage('Reset to fresh start');
  };

  document.getElementById('btn-reset')?.addEventListener('click', resetAll);
  document.getElementById('btn-start-fresh')?.addEventListener('click', resetAll);
  document.getElementById('btn-fallback-fresh')?.addEventListener('click', resetAll);
  document.getElementById('btn-fallback-expert')?.addEventListener('click', () => {
    state.unsupportedSchemaNotice = undefined;
    state.activeTab = 'expert';
    saveStateToUrl(true);
    render();
  });

  // Shared Banner Tweak Button
  document.getElementById('btn-tweak-shared')?.addEventListener('click', () => {
    state.activeTab = 'expert';
    saveStateToUrl(true);
    render();
  });

  // Share Actions (Header, Match Banner, Sidebar, Recipe)
  const openShareModal = () => {
    state.showShareModal = true;
    render();
  };

  document.getElementById('btn-share-header')?.addEventListener('click', openShareModal);
  document.getElementById('btn-share-match')?.addEventListener('click', openShareModal);
  document.getElementById('btn-share-sidebar')?.addEventListener('click', openShareModal);
  document.getElementById('btn-share-recipe')?.addEventListener('click', openShareModal);

  // Close Share Modal
  document.getElementById('btn-close-share-modal')?.addEventListener('click', () => {
    state.showShareModal = false;
    render();
  });

  document.getElementById('share-modal-backdrop')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'share-modal-backdrop') {
      state.showShareModal = false;
      render();
    }
  });

  // Copy Share Link in Modal
  document.getElementById('btn-copy-share-link')?.addEventListener('click', () => {
    copyToClipboard(window.location.href, 'Direct permalink copied to clipboard!', '🔗');
  });

  // Copy Markdown in Modal
  document.getElementById('btn-copy-markdown')?.addEventListener('click', () => {
    const md = generateMarkdownSummary(evaluation);
    copyToClipboard(md, 'Markdown summary copied! Ready to paste into Reddit, Discord, or GitHub.', '📋');
  });

  // Native Device Share in Modal
  document.getElementById('btn-native-share')?.addEventListener('click', () => {
    triggerDeviceShare(evaluation);
  });

  // Individual Constraint Chip Removal
  document.querySelectorAll<HTMLButtonElement>('.btn-remove-choice').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = btn.getAttribute('data-remove-key') as keyof UserCriteria;
      if (key && state.criteria[key] !== undefined) {
        delete state.criteria[key];
        if (key === 'useCase') {
          state.answeredQuestionIds.delete('beginner_goal');
          state.answeredQuestionIds.delete('technical_use_case');
        } else if (key === 'platform' || key === 'architecture') {
          state.answeredQuestionIds.delete('beginner_device');
          state.answeredQuestionIds.delete('hardware_architecture');
        } else if (key === 'footprint' || key === 'maxRamMb') {
          state.answeredQuestionIds.delete('beginner_memory');
          state.answeredQuestionIds.delete('memory_and_storage');
        } else if (key === 'experienceLevel') {
          state.answeredQuestionIds.delete('beginner_experience');
        } else if (key === 'statePreference') {
          state.answeredQuestionIds.delete('immutability_and_state');
        } else if (key === 'cLibPreference' || key === 'initPreference') {
          state.answeredQuestionIds.delete('c_library_and_init');
        }
        saveStateToUrl();
        render();
        showToast(`Removed filter: ${key}`, '🗑️');
      }
    });
  });

  // Toggle Flow Mode (Goal / Novice <-> Technical)
  document.getElementById('btn-toggle-flow-mode')?.addEventListener('click', () => {
    const isBeginner = state.criteria.experienceLevel === 'beginner' || !state.criteria.experienceLevel;
    const newLevel = isBeginner ? 'intermediate' : 'beginner';
    
    state.criteria = {
      ...state.criteria,
      experienceLevel: newLevel
    };

    // If switching modes, ensure conflicting stage question IDs get re-prompted cleanly
    state.answeredQuestionIds.delete('beginner_goal');
    state.answeredQuestionIds.delete('technical_use_case');
    state.answeredQuestionIds.delete('beginner_device');
    state.answeredQuestionIds.delete('hardware_architecture');
    state.answeredQuestionIds.delete('beginner_memory');
    state.answeredQuestionIds.delete('memory_and_storage');

    render();
  });

  // Wizard Option Buttons (with tactile tap feedback on touch, history push & smooth directional transition)
  document.querySelectorAll<HTMLButtonElement>('.option-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const optId = btn.getAttribute('data-option-id');
      const opt = nextQuestion?.options.find((o) => o.id === optId);
      if (opt && nextQuestion) {
        // Instant visual feedback for touch & click
        btn.classList.remove('bg-slate-950/70', 'border-slate-700/60');
        btn.classList.add('bg-emerald-500/20', 'border-emerald-400', 'ring-2', 'ring-emerald-400', 'scale-[0.985]');

        setTimeout(() => {
          state.history.push({ ...state.criteria });
          Object.assign(state.criteria, opt.appliesCriteria);
          state.answeredQuestionIds.add(nextQuestion.id);
          state.transitionDirection = 'forward';
          saveStateToUrl(true);
          render();
          scrollToQuestionCard();
        }, 80);
      }
    });
  });

  // Keyboard navigation handler (registered once)
  if (!keyboardHandlerRegistered) {
    window.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target?.tagName)) return;

      if (state.activeTab === 'wizard') {
        const currentNext = flow.getNextQuestion(state.criteria, state.answeredQuestionIds);
        if (currentNext) {
          const num = parseInt(e.key, 10);
          if (!isNaN(num) && num >= 1 && num <= currentNext.options.length) {
            const opt = currentNext.options[num - 1];
            if (opt) {
              state.history.push({ ...state.criteria });
              Object.assign(state.criteria, opt.appliesCriteria);
              state.answeredQuestionIds.add(currentNext.id);
              state.transitionDirection = 'forward';
              saveStateToUrl(true);
              render();
              scrollToQuestionCard();
              return;
            }
          }
        }

        // Backspace or Left Arrow = Previous
        if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
          if (state.history.length > 0 || state.answeredQuestionIds.size > 0) {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              const prev = state.history.pop();
              state.criteria = prev || {};
              const lastAnswered = Array.from(state.answeredQuestionIds).pop();
              if (lastAnswered) state.answeredQuestionIds.delete(lastAnswered);
              state.transitionDirection = 'backward';
              saveStateToUrl(false);
              render();
              scrollToQuestionCard();
            }
          }
        }
      }
    });
    keyboardHandlerRegistered = true;
  }

  // Back button (delegates to browser history to keep native and in-app back in sync)
  document.getElementById('btn-back')?.addEventListener('click', () => {
    if (state.history.length > 0 || state.answeredQuestionIds.size > 0) {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        const prev = state.history.pop();
        state.criteria = prev || {};
        const lastAnswered = Array.from(state.answeredQuestionIds).pop();
        if (lastAnswered) state.answeredQuestionIds.delete(lastAnswered);
        state.transitionDirection = 'backward';
        saveStateToUrl(false);
        render();
        scrollToQuestionCard();
      }
    }
  });

  // Skip button
  document.getElementById('btn-skip')?.addEventListener('click', () => {
    if (nextQuestion) {
      state.history.push({ ...state.criteria });
      state.answeredQuestionIds.add(nextQuestion.id);
      state.transitionDirection = 'forward';
      saveStateToUrl(true);
      render();
      scrollToQuestionCard();
    }
  });

  // Recipe Tabs
  document.querySelectorAll<HTMLButtonElement>('.recipe-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const idx = Number(tab.getAttribute('data-file-idx'));
      state.activeFileIndex = idx;
      render();
    });
  });

  // Action Cards: Frankenstein Distrobox Toggle
  document.getElementById('btn-toggle-distrobox')?.addEventListener('click', () => {
    state.criteria.enableDistrobox = !state.criteria.enableDistrobox;
    saveStateToUrl();
    render();
    showToast(
      state.criteria.enableDistrobox ? '✨ Distrobox enabled in Makefile!' : 'Distrobox disabled in Makefile',
      '🏛️'
    );
  });

  // Action Cards: Desktop Compositor Selection
  document.querySelectorAll<HTMLButtonElement>('.btn-select-desktop-env').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const env = (e.currentTarget as HTMLElement).getAttribute('data-desktop-env') as DesktopEnvId;
      state.criteria.desktopEnv = env;
      saveStateToUrl();
      render();
      showToast(`✨ Desktop compositor set to ${env.toUpperCase()} in Makefile!`, '🖼️');
    });
  });

  // Action Cards: Nix & Flatpak Toggles
  document.getElementById('btn-toggle-nix')?.addEventListener('click', () => {
    state.criteria.enableNix = !state.criteria.enableNix;
    saveStateToUrl();
    render();
    showToast(state.criteria.enableNix ? '✨ Nix package manager layer enabled!' : 'Nix package layer disabled', '❄️');
  });

  document.getElementById('btn-toggle-flatpak')?.addEventListener('click', () => {
    state.criteria.enableFlatpak = !state.criteria.enableFlatpak;
    saveStateToUrl();
    render();
    showToast(state.criteria.enableFlatpak ? '✨ Flatpak sandbox layer enabled!' : 'Flatpak disabled', '📦');
  });

  // Action Cards: 1-Click Desktop Apps
  document.querySelectorAll<HTMLElement>('.btn-toggle-desktop-app').forEach((card) => {
    card.addEventListener('click', (e) => {
      const appId = (e.currentTarget as HTMLElement).getAttribute('data-app-id') as DesktopAppId;
      const list = state.criteria.desktopApps || [];
      if (list.includes(appId)) {
        state.criteria.desktopApps = list.filter((id) => id !== appId);
        showToast(`Removed ${appId} from bootstrap-apps.sh`, '📦');
      } else {
        state.criteria.desktopApps = [...list, appId];
        const app = getDesktopApp(appId);
        showToast(`✨ Added ${app?.name || appId} to bootstrap-apps.sh!`, app?.icon || '📦');
      }
      saveStateToUrl();
      render();
    });
  });

  // Action Cards: Turnkey Docker App Layer
  document.querySelectorAll<HTMLElement>('.btn-select-docker-app').forEach((card) => {
    card.addEventListener('click', (e) => {
      const appId = (e.currentTarget as HTMLElement).getAttribute('data-docker-id') as DockerAppId;
      if (appId === 'none' || state.criteria.dockerApp === appId) {
        state.criteria.dockerApp = undefined;
        state.activeFileIndex = 0;
        showToast('Set to pure minimal OS (no background containers)', '🚫');
      } else {
        state.criteria.dockerApp = appId;
        const appDef = getDockerApp(appId);
        showToast(`✨ Configured ${appDef?.name || appId} in Makefile & docker-compose.yml!`, appDef?.icon || '🐳');
        // Switch to the newly generated docker-compose.yml tab
        state.activeFileIndex = 1;
      }
      saveStateToUrl();
      render();
    });
  });

  // Action Cards: Mix & Match Combos
  const combos = getAddonCombos(evaluation.bestMatch.distro.id);
  document.querySelectorAll<HTMLButtonElement>('.btn-toggle-combo').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = Number((e.currentTarget as HTMLElement).getAttribute('data-combo-idx'));
      const combo = combos[idx];
      if (!combo) return;

      if (combo.appliesDockerApp) {
        state.criteria.dockerApp =
          state.criteria.dockerApp === combo.appliesDockerApp ? undefined : combo.appliesDockerApp;
        state.activeFileIndex = state.criteria.dockerApp ? 1 : 0;
      }
      if (combo.appliesDesktopEnv) {
        state.criteria.desktopEnv =
          state.criteria.desktopEnv === combo.appliesDesktopEnv ? undefined : combo.appliesDesktopEnv;
      }
      if (combo.appliesDistrobox) {
        state.criteria.enableDistrobox = !state.criteria.enableDistrobox;
      }
      saveStateToUrl();
      render();
      showToast(`✨ Updated build recipe with ${combo.title}!`, combo.icon || '🧩');
    });
  });

  // Copy Recipe Button
  document.getElementById('btn-copy-recipe')?.addEventListener('click', async () => {
    const file = evaluation.recommendedRecipe?.files[state.activeFileIndex];
    if (file) {
      await navigator.clipboard.writeText(file.content);
      const btn = document.getElementById('btn-copy-recipe');
      if (btn) {
        btn.innerHTML = '<span>✔</span> Copied to Clipboard!';
        setTimeout(() => render(), 1500);
      }
    }
  });

  // Expert Filters
  const bindExpertSelect = (id: string, key: keyof UserCriteria) => {
    document.getElementById(id)?.addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value;
      if (val) {
        // @ts-ignore
        state.criteria[key] = val;
      } else {
        delete state.criteria[key];
      }
      render();
    });
  };

  bindExpertSelect('expert-arch', 'architecture');
  bindExpertSelect('expert-footprint', 'footprint');
  bindExpertSelect('expert-init', 'initPreference');
  bindExpertSelect('expert-clib', 'cLibPreference');
  bindExpertSelect('expert-state', 'statePreference');
  bindExpertSelect('expert-role', 'useCase');

  document.getElementById('btn-apply-expert')?.addEventListener('click', () => {
    state.activeTab = 'results';
    render();
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initial mount with URL restoration
loadStateFromUrl();
render();
