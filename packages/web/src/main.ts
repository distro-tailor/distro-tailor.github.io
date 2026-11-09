import {
  evaluateCriteria,
  QuestionFlow,
  QUESTIONS,
  UserCriteria,
  RecommendationOutput,
  DISTRO_REGISTRY
} from '@distro-tailor/core';

interface AppState {
  criteria: UserCriteria;
  answeredQuestionIds: Set<string>;
  history: UserCriteria[];
  activeTab: 'wizard' | 'expert' | 'results';
  activeFileIndex: number;
}

const state: AppState = {
  criteria: {},
  answeredQuestionIds: new Set(),
  history: [],
  activeTab: 'wizard',
  activeFileIndex: 0
};

const flow = new QuestionFlow(QUESTIONS);

function getAppElement(): HTMLElement {
  const el = document.getElementById('app');
  if (!el) throw new Error('Missing #app root element');
  return el;
}

function render() {
  const app = getAppElement();
  const evaluation: RecommendationOutput = evaluateCriteria(state.criteria);
  const eligibleQuestions = flow.getEligibleQuestions(state.criteria);
  const nextQuestion = flow.getNextQuestion(state.criteria, state.answeredQuestionIds);
  const progress = flow.getProgress(state.criteria, state.answeredQuestionIds);

  app.innerHTML = `
    <!-- Navbar -->
    <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3 cursor-pointer" id="nav-brand">
          <span class="text-3xl">🐧</span>
          <div>
            <h1 class="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">DistroTailor</h1>
            <p class="text-xs text-slate-400">The 20-Questions Linux Selector & Recipe Generator</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button id="btn-toggle-wizard" class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${state.activeTab === 'wizard' ? 'bg-emerald-500 text-black font-semibold' : 'text-slate-300 hover:bg-slate-800'}">
            ⚡ 20-Questions Wizard
          </button>
          <button id="btn-toggle-expert" class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${state.activeTab === 'expert' ? 'bg-emerald-500 text-black font-semibold' : 'text-slate-300 hover:bg-slate-800'}">
            🛠️ Expert Matrix
          </button>
          ${Object.keys(state.criteria).length > 0 ? `
            <button id="btn-view-results" class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${state.activeTab === 'results' ? 'bg-emerald-500 text-black font-semibold' : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'}">
              🎯 View Results (${evaluation.bestMatch.score}%)
            </button>
          ` : ''}
          <button id="btn-reset" class="px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors">
            Reset
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Grid -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <!-- Primary Left Column: Wizard or Results or Expert Matrix -->
      <section class="lg:col-span-8 flex flex-col gap-6">
        ${renderPrimarySection(nextQuestion, progress, evaluation)}
      </section>

      <!-- Secondary Right Column: Live Distro Leaderboard -->
      <aside class="lg:col-span-4 flex flex-col gap-4">
        <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sticky top-24">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <span>📊</span> Live Matches
            </h3>
            <span class="text-xs text-slate-400">${DISTRO_REGISTRY.length} Distros Indexed</span>
          </div>

          <div class="space-y-3">
            ${evaluation.topMatches.map((m, idx) => `
              <div class="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all">
                <div class="flex items-center justify-between text-sm mb-1.5">
                  <div class="flex items-center gap-2 font-medium text-slate-200">
                    <span>${m.distro.logoEmoji || '🐧'}</span>
                    <span>${m.distro.name}</span>
                  </div>
                  <span class="font-mono text-xs font-bold ${m.score >= 80 ? 'text-emerald-400' : m.score >= 50 ? 'text-yellow-400' : 'text-slate-500'}">
                    ${m.score}%
                  </span>
                </div>

                <!-- Progress bar -->
                <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full transition-all duration-300" style="width: ${m.score}%"></div>
                </div>

                <p class="text-[11px] text-slate-400 mt-2 line-clamp-1">${m.distro.tagline}</p>
              </div>
            `).join('')}
          </div>

          <!-- Applied Criteria Pills -->
          <div class="mt-6 pt-4 border-t border-slate-800">
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Active Constraints</h4>
            ${Object.keys(state.criteria).length === 0 ? `
              <p class="text-xs text-slate-500 italic">No constraints selected yet. Pick an option on the left!</p>
            ` : `
              <div class="flex flex-wrap gap-1.5">
                ${Object.entries(state.criteria).map(([k, v]) => `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                    <span class="text-emerald-500 font-mono">${k}:</span> ${v}
                  </span>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      </aside>

    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-800 py-6 px-6 text-center text-xs text-slate-500">
      <p>DistroTailor is 100% Free & Open Source under MIT License. Tailor-made for the Linux community.</p>
    </footer>
  `;

  attachEventHandlers(nextQuestion, evaluation);
}

function renderPrimarySection(
  nextQuestion: ReturnType<typeof flow.getNextQuestion>,
  progress: ReturnType<typeof flow.getProgress>,
  evaluation: RecommendationOutput
): string {
  // If user explicitly switched to results or finished all questions
  if (state.activeTab === 'results' || (!nextQuestion && state.activeTab === 'wizard')) {
    return renderResultsView(evaluation);
  }

  // If in Expert Mode
  if (state.activeTab === 'expert') {
    return renderExpertMatrix();
  }

  // Default: Wizard Mode
  if (!nextQuestion) {
    return renderResultsView(evaluation);
  }

  return `
    <div class="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur">
      
      <!-- Progress Bar -->
      <div class="mb-6">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span class="font-semibold text-emerald-400 uppercase tracking-wider">Question ${progress.current + 1} of ${progress.total}</span>
          <span>${progress.percentage}% Complete</span>
        </div>
        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div class="bg-emerald-500 h-2 rounded-full transition-all duration-300" style="width: ${progress.percentage}%"></div>
        </div>
      </div>

      <!-- Question Header -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-100 mb-2">${nextQuestion.prompt}</h2>
        ${nextQuestion.subtext ? `<p class="text-sm text-slate-400">${nextQuestion.subtext}</p>` : ''}
      </div>

      <!-- Options Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        ${nextQuestion.options.map((opt) => `
          <button data-option-id="${opt.id}" class="option-btn text-left p-5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-950/20 transition-all flex flex-col justify-between group">
            <div>
              <div class="flex items-center gap-2 mb-2 text-base font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">
                <span class="text-xl">${opt.icon || '👉'}</span>
                <span>${opt.label}</span>
              </div>
              ${opt.description ? `<p class="text-xs text-slate-400 leading-relaxed">${opt.description}</p>` : ''}
            </div>
            <span class="text-[11px] font-mono text-emerald-500/80 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">Select & Next →</span>
          </button>
        `).join('')}
      </div>

      <!-- Navigation Footer -->
      <div class="flex items-center justify-between mt-8 pt-6 border-t border-slate-800/80">
        <button id="btn-back" class="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors ${state.history.length === 0 ? 'opacity-30 cursor-not-allowed' : ''}">
          ← Back
        </button>
        <button id="btn-skip" class="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors">
          Skip Question →
        </button>
      </div>

    </div>
  `;
}

function renderResultsView(evaluation: RecommendationOutput): string {
  const best = evaluation.bestMatch;
  const recipe = evaluation.recommendedRecipe;

  return `
    <div class="space-y-6">
      
      <!-- Top Match Banner -->
      <div class="bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-slate-950 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div class="flex items-center gap-3">
            <span class="text-4xl">${best.distro.logoEmoji || '🐧'}</span>
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-2xl font-bold text-slate-100">${best.distro.name}</h2>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ${best.score}% Match
                </span>
              </div>
              <p class="text-sm text-emerald-300 font-medium">${best.distro.tagline}</p>
            </div>
          </div>

          <a href="${best.distro.website}" target="_blank" rel="noopener noreferrer" class="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/30">
            Official Website ↗
          </a>
        </div>

        <p class="text-sm text-slate-300 leading-relaxed mb-6">${best.distro.description}</p>

        <!-- Technical Specs Matrix -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-6">
          <div class="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span class="text-slate-500 block">Typical Footprint</span>
            <span class="font-medium text-slate-200 capitalize">${best.distro.footprint}</span>
          </div>
          <div class="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span class="text-slate-500 block">Init System</span>
            <span class="font-medium text-slate-200">${best.distro.initSystems.join(', ')}</span>
          </div>
          <div class="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span class="text-slate-500 block">C Standard Library</span>
            <span class="font-medium text-slate-200">${best.distro.cLibraries.join(', ')}</span>
          </div>
          <div class="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span class="text-slate-500 block">State Architecture</span>
            <span class="font-medium text-slate-200 capitalize">${best.distro.stateModel}</span>
          </div>
        </div>

        <!-- Highlights & Tradeoffs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div class="bg-emerald-950/30 border border-emerald-900/40 rounded-lg p-3">
            <h4 class="font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
              <span>✨</span> Key Strengths
            </h4>
            <ul class="space-y-1 text-slate-300">
              ${best.distro.highlights.map((h) => `<li>• ${h}</li>`).join('')}
            </ul>
          </div>
          <div class="bg-amber-950/20 border border-amber-900/40 rounded-lg p-3">
            <h4 class="font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
              <span>⚖️</span> Trade-offs
            </h4>
            <ul class="space-y-1 text-slate-300">
              ${best.distro.tradeoffs.map((t) => `<li>• ${t}</li>`).join('')}
            </ul>
          </div>
        </div>

      </div>

      <!-- Custom Build Recipe Generator Section -->
      ${recipe ? `
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xl">🛠️</span>
                <h3 class="text-lg font-bold text-slate-100">${recipe.title}</h3>
              </div>
              <p class="text-xs text-slate-400 mt-1">${recipe.summary}</p>
            </div>
            
            <button id="btn-copy-recipe" class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-emerald-400 border border-slate-700 hover:bg-slate-700 transition-colors flex items-center gap-1.5">
              <span>📋</span> Copy Active File
            </button>
          </div>

          <!-- Dependencies & Build Info -->
          <div class="flex flex-wrap gap-2 text-xs mb-4">
            <span class="px-2.5 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800">
              ⏱️ Build Time: ~${recipe.estimatedBuildTimeMinutes} mins
            </span>
            <span class="px-2.5 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800">
              📦 Dependencies: ${recipe.hostDependencies.join(', ')}
            </span>
          </div>

          <!-- File Tabs -->
          <div class="flex items-center gap-2 border-b border-slate-800 mb-0">
            ${recipe.files.map((file, idx) => `
              <button data-file-idx="${idx}" class="recipe-tab px-3 py-2 text-xs font-mono font-medium rounded-t-lg border-b-2 transition-all ${state.activeFileIndex === idx ? 'border-emerald-500 text-emerald-400 bg-slate-950' : 'border-transparent text-slate-400 hover:text-slate-200'}">
                ${file.filename}
              </button>
            `).join('')}
          </div>

          <!-- Code View -->
          <div class="relative bg-slate-950 border border-slate-800 rounded-b-xl p-4 overflow-x-auto max-h-96 text-xs font-mono text-slate-300 leading-relaxed">
            <pre><code>${escapeHtml(recipe.files[state.activeFileIndex]?.content || '')}</code></pre>
          </div>

          <!-- Quickstart Execution Snippet -->
          <div class="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800/80">
            <span class="text-xs text-slate-500 uppercase tracking-wider block mb-1 font-semibold">Quickstart Commands:</span>
            <pre class="text-xs font-mono text-emerald-400"><code>${recipe.quickstartCommands.join('\n')}</code></pre>
          </div>

        </div>
      ` : ''}

    </div>
  `;
}

function renderExpertMatrix(): string {
  return `
    <div class="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur space-y-6">
      <div>
        <h2 class="text-xl font-bold text-slate-100 mb-1">🛠️ Expert Constraint Matrix</h2>
        <p class="text-xs text-slate-400">Bypass the questionnaire and tune exact kernel, architecture, and init flags.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        
        <!-- Architecture -->
        <div>
          <label class="block text-slate-400 font-semibold mb-1.5">CPU Architecture</label>
          <select id="expert-arch" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono">
            <option value="">Any Architecture</option>
            <option value="x86_64" ${state.criteria.architecture === 'x86_64' ? 'selected' : ''}>x86_64 (AMD64)</option>
            <option value="arm64" ${state.criteria.architecture === 'arm64' ? 'selected' : ''}>arm64 (AArch64)</option>
            <option value="armv7" ${state.criteria.architecture === 'armv7' ? 'selected' : ''}>armv7 (32-bit ARM)</option>
            <option value="riscv64" ${state.criteria.architecture === 'riscv64' ? 'selected' : ''}>riscv64 (RISC-V)</option>
            <option value="nommu" ${state.criteria.architecture === 'nommu' ? 'selected' : ''}>nommu (Microcontroller No-MMU)</option>
            <option value="wasm32" ${state.criteria.architecture === 'wasm32' ? 'selected' : ''}>wasm32 (In-Browser)</option>
          </select>
        </div>

        <!-- Footprint -->
        <div>
          <label class="block text-slate-400 font-semibold mb-1.5">Storage & RAM Footprint</label>
          <select id="expert-footprint" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono">
            <option value="">Any Size</option>
            <option value="micro" ${state.criteria.footprint === 'micro' ? 'selected' : ''}>Micro (< 16 MB)</option>
            <option value="minimal" ${state.criteria.footprint === 'minimal' ? 'selected' : ''}>Minimal (16 - 100 MB)</option>
            <option value="lean" ${state.criteria.footprint === 'lean' ? 'selected' : ''}>Lean (100 MB - 1 GB)</option>
            <option value="standard" ${state.criteria.footprint === 'standard' ? 'selected' : ''}>Standard (1 - 5 GB)</option>
            <option value="full" ${state.criteria.footprint === 'full' ? 'selected' : ''}>Full Desktop (> 5 GB)</option>
          </select>
        </div>

        <!-- Init System -->
        <div>
          <label class="block text-slate-400 font-semibold mb-1.5">Init System</label>
          <select id="expert-init" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono">
            <option value="">No Preference</option>
            <option value="systemd" ${state.criteria.initPreference === 'systemd' ? 'selected' : ''}>systemd</option>
            <option value="openrc" ${state.criteria.initPreference === 'openrc' ? 'selected' : ''}>OpenRC</option>
            <option value="runit" ${state.criteria.initPreference === 'runit' ? 'selected' : ''}>runit</option>
            <option value="busybox" ${state.criteria.initPreference === 'busybox' ? 'selected' : ''}>BusyBox Init</option>
          </select>
        </div>

        <!-- C Library -->
        <div>
          <label class="block text-slate-400 font-semibold mb-1.5">C Standard Library</label>
          <select id="expert-clib" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono">
            <option value="">No Preference</option>
            <option value="glibc" ${state.criteria.cLibPreference === 'glibc' ? 'selected' : ''}>glibc (Standard GNU)</option>
            <option value="musl" ${state.criteria.cLibPreference === 'musl' ? 'selected' : ''}>musl libc (Lightweight / Alpine)</option>
            <option value="uclibc-ng" ${state.criteria.cLibPreference === 'uclibc-ng' ? 'selected' : ''}>uClibc-ng (Embedded / NOMMU)</option>
          </select>
        </div>

        <!-- Immutability -->
        <div>
          <label class="block text-slate-400 font-semibold mb-1.5">State Architecture</label>
          <select id="expert-state" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono">
            <option value="">No Preference</option>
            <option value="mutable" ${state.criteria.statePreference === 'mutable' ? 'selected' : ''}>Mutable (Standard apt/pacman)</option>
            <option value="declarative" ${state.criteria.statePreference === 'declarative' ? 'selected' : ''}>Declarative (NixOS)</option>
            <option value="immutable-ostree" ${state.criteria.statePreference === 'immutable-ostree' ? 'selected' : ''}>Immutable Read-Only Root</option>
            <option value="stateless-ram" ${state.criteria.statePreference === 'stateless-ram' ? 'selected' : ''}>Stateless RAM-Disk</option>
          </select>
        </div>

        <!-- Primary Role -->
        <div>
          <label class="block text-slate-400 font-semibold mb-1.5">Primary Workload</label>
          <select id="expert-role" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono">
            <option value="">Any Workload</option>
            <option value="iot-embedded" ${state.criteria.useCase === 'iot-embedded' ? 'selected' : ''}>IoT & Embedded</option>
            <option value="container-base" ${state.criteria.useCase === 'container-base' ? 'selected' : ''}>Container Base</option>
            <option value="k8s-cluster" ${state.criteria.useCase === 'k8s-cluster' ? 'selected' : ''}>Kubernetes Node</option>
            <option value="kiosk-signage" ${state.criteria.useCase === 'kiosk-signage' ? 'selected' : ''}>Digital Signage / Kiosk</option>
            <option value="server" ${state.criteria.useCase === 'server' ? 'selected' : ''}>Cloud Server</option>
            <option value="desktop" ${state.criteria.useCase === 'desktop' ? 'selected' : ''}>Desktop / Workstation</option>
            <option value="browser-wasm" ${state.criteria.useCase === 'browser-wasm' ? 'selected' : ''}>Browser WebAssembly</option>
          </select>
        </div>

      </div>

      <div class="pt-4 border-t border-slate-800 flex justify-end">
        <button id="btn-apply-expert" class="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 transition-all">
          View Recommendations →
        </button>
      </div>
    </div>
  `;
}

function attachEventHandlers(
  nextQuestion: ReturnType<typeof flow.getNextQuestion>,
  evaluation: RecommendationOutput
) {
  // Brand click
  document.getElementById('nav-brand')?.addEventListener('click', () => {
    state.activeTab = 'wizard';
    render();
  });

  // Nav toggles
  document.getElementById('btn-toggle-wizard')?.addEventListener('click', () => {
    state.activeTab = 'wizard';
    render();
  });

  document.getElementById('btn-toggle-expert')?.addEventListener('click', () => {
    state.activeTab = 'expert';
    render();
  });

  document.getElementById('btn-view-results')?.addEventListener('click', () => {
    state.activeTab = 'results';
    render();
  });

  // Reset
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    state.criteria = {};
    state.answeredQuestionIds.clear();
    state.history = [];
    state.activeTab = 'wizard';
    state.activeFileIndex = 0;
    render();
  });

  // Option buttons
  document.querySelectorAll<HTMLButtonElement>('.option-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const optionId = btn.getAttribute('data-option-id');
      if (!nextQuestion || !optionId) return;

      const opt = nextQuestion.options.find((o) => o.id === optionId);
      if (opt) {
        state.history.push({ ...state.criteria });
        Object.assign(state.criteria, opt.appliesCriteria);
        state.answeredQuestionIds.add(nextQuestion.id);
        render();
      }
    });
  });

  // Back button
  document.getElementById('btn-back')?.addEventListener('click', () => {
    if (state.history.length > 0) {
      const prev = state.history.pop();
      state.criteria = prev || {};
      // Recompute answered IDs
      const lastAnswered = Array.from(state.answeredQuestionIds).pop();
      if (lastAnswered) state.answeredQuestionIds.delete(lastAnswered);
      render();
    }
  });

  // Skip button
  document.getElementById('btn-skip')?.addEventListener('click', () => {
    if (nextQuestion) {
      state.history.push({ ...state.criteria });
      state.answeredQuestionIds.add(nextQuestion.id);
      render();
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

  // Copy Recipe Button
  document.getElementById('btn-copy-recipe')?.addEventListener('click', async () => {
    const file = evaluation.recommendedRecipe?.files[state.activeFileIndex];
    if (file) {
      await navigator.clipboard.writeText(file.content);
      const btn = document.getElementById('btn-copy-recipe');
      if (btn) {
        btn.innerHTML = '<span>✔</span> Copied!';
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

// Initial mount
render();
