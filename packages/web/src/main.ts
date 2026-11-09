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
      container: { label: 'Docker Container', icon: '🐳' }
    },
    architecture: {
      x86_64: { label: 'Standard 64-bit PC', icon: '💻' },
      arm64: { label: 'ARM64 (Raspberry Pi 4/5)', icon: '📱' },
      armv7: { label: '32-bit ARM (Older Pi)', icon: '📟' },
      nommu: { label: 'Microcontroller (NOMMU)', icon: '🔌' }
    },
    footprint: {
      micro: { label: 'Extreme Micro (<16MB)', icon: '🪶' },
      minimal: { label: 'Ultra-Light (<1GB RAM)', icon: '⚡' },
      lean: { label: 'Lean (1-2GB RAM)', icon: '📦' },
      standard: { label: 'Standard (4-8GB RAM)', icon: '🚀' },
      full: { label: 'Full Workstation', icon: '🎮' }
    }
  };

  if (map[key] && map[key][value]) {
    return map[key][value];
  }
  return { label: `${key}: ${value}`, icon: '📌' };
}

function render() {
  const app = getAppElement();
  const evaluation: RecommendationOutput = evaluateCriteria(state.criteria);
  const nextQuestion = flow.getNextQuestion(state.criteria, state.answeredQuestionIds);
  const progress = flow.getProgress(state.criteria, state.answeredQuestionIds);

  app.innerHTML = `
    <!-- Top Header Navigation -->
    <header class="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50 px-6 py-3.5">
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <!-- Brand Identity -->
        <div class="flex items-center gap-3 cursor-pointer select-none" id="nav-brand">
          <div class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center text-2xl shadow-inner">
            🐧
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-lg font-bold tracking-tight text-slate-100">DistroTailor</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">20 Questions</span>
            </div>
            <p class="text-xs text-slate-400">Think of a project. In 20 questions or fewer, find your dream Linux match.</p>
          </div>
        </div>

        <!-- Mode Buttons -->
        <div class="flex items-center gap-2">
          <button id="btn-toggle-wizard" class="px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${state.activeTab === 'wizard' ? 'bg-slate-100 text-slate-950 font-semibold shadow' : 'text-slate-300 hover:bg-slate-800/70 border border-transparent'}">
            20 Questions Game
          </button>
          <button id="btn-toggle-expert" class="px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${state.activeTab === 'expert' ? 'bg-slate-100 text-slate-950 font-semibold shadow' : 'text-slate-300 hover:bg-slate-800/70 border border-transparent'}">
            Expert Matrix
          </button>
          ${Object.keys(state.criteria).length > 0 ? `
            <button id="btn-view-results" class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${state.activeTab === 'results' ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950/40' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-700/60 hover:bg-emerald-900/60'}">
              🎯 View Match (${evaluation.bestMatch.score}%)
            </button>
          ` : ''}
          ${Object.keys(state.criteria).length > 0 ? `
            <button id="btn-reset" class="px-2.5 py-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors" title="Start over">
              Restart
            </button>
          ` : ''}
        </div>
      </div>
    </header>

    <!-- Main Workspace -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <!-- Primary Left Column: Wizard Cards or Results -->
      <section class="lg:col-span-8 flex flex-col gap-6">
        ${renderPrimarySection(nextQuestion, progress, evaluation)}
      </section>

      <!-- Right Column: Live Standings Leaderboard -->
      <aside class="lg:col-span-4 flex flex-col gap-4">
        <div class="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 sticky top-24 shadow-xl">
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
            <div>
              <h3 class="text-sm font-bold text-slate-200">The Contenders</h3>
              <p class="text-[11px] text-slate-400">Updates live as you answer</p>
            </div>
            <span class="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
              ${DISTRO_REGISTRY.length} distros
            </span>
          </div>

          <!-- Top Contender Cards -->
          <div class="space-y-2.5">
            ${evaluation.topMatches.slice(0, 6).map((m, idx) => `
              <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all">
                <div class="flex items-center justify-between text-sm mb-1.5">
                  <div class="flex items-center gap-2 font-medium text-slate-200">
                    <span class="text-base">${m.distro.logoEmoji || '🐧'}</span>
                    <span>${m.distro.name}</span>
                  </div>
                  <span class="font-mono text-xs font-bold ${m.score >= 80 ? 'text-emerald-400' : m.score >= 50 ? 'text-yellow-400' : 'text-slate-500'}">
                    ${m.score}%
                  </span>
                </div>

                <!-- Match Bar -->
                <div class="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                  <div class="h-1.5 rounded-full transition-all duration-300 ${m.score >= 80 ? 'bg-emerald-400' : m.score >= 50 ? 'bg-yellow-400' : 'bg-slate-600'}" style="width: ${m.score}%"></div>
                </div>

                <p class="text-[11px] text-slate-400 mt-2 line-clamp-1">${m.distro.tagline}</p>
              </div>
            `).join('')}
          </div>

          <!-- Active Constraints Tags -->
          <div class="mt-5 pt-4 border-t border-slate-800">
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Your Choices So Far</h4>
            ${Object.keys(state.criteria).length === 0 ? `
              <p class="text-xs text-slate-500 italic">No constraints yet. Select an option to start narrowing down!</p>
            ` : `
              <div class="flex flex-wrap gap-1.5">
                ${Object.entries(state.criteria).map(([k, v]) => {
                  const c = formatConstraint(k, v);
                  return `
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-200 border border-slate-700/60 shadow-sm">
                      <span>${c.icon}</span>
                      <span>${c.label}</span>
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
  `;

  attachEventHandlers(nextQuestion, evaluation);
}

function renderPrimarySection(
  nextQuestion: ReturnType<typeof flow.getNextQuestion>,
  progress: ReturnType<typeof flow.getProgress>,
  evaluation: RecommendationOutput
): string {
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
    <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur shadow-xl">
      
      <!-- Round & Step Indicator with Flow Mode Toggle -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-800/80 gap-3">
        <div class="flex items-center gap-3">
          <span class="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Question ${progress.current + 1} of ${progress.total}
          </span>
          <button id="btn-toggle-flow-mode" class="px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${isBeginner ? 'bg-slate-800/90 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/40 border border-slate-700/60' : 'bg-indigo-950/60 text-indigo-300 hover:text-indigo-200 hover:border-indigo-500/50 border border-indigo-700/60'}" title="Switch between Goal-Oriented Mode and Low-Level Technical Mode">
            <span>${isBeginner ? '🌱 Goal Mode' : '⚙️ Technical Mode'}</span>
            <span class="text-[10px] text-slate-400 font-mono">⇄ switch</span>
          </button>
        </div>
        
        <!-- Segmented Step Dots -->
        <div class="flex items-center gap-1.5">
          ${Array.from({ length: progress.total }).map((_, i) => `
            <div class="h-2 rounded-full transition-all duration-300 ${i < progress.current ? 'w-6 bg-emerald-400' : i === progress.current ? 'w-8 bg-emerald-400 ring-2 ring-emerald-400/30' : 'w-2 bg-slate-800'}"></div>
          `).join('')}
        </div>
      </div>

      <!-- Question Prompt -->
      <div class="mb-7">
        <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mb-2">${nextQuestion.prompt}</h2>
        ${nextQuestion.subtext ? `<p class="text-sm text-slate-400 leading-relaxed">${nextQuestion.subtext}</p>` : ''}
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
            <button data-option-id="${opt.id}" class="option-btn group relative text-left p-5 rounded-xl border border-slate-700/60 bg-slate-950/70 hover:bg-slate-800/90 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-950/40 transition-all flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 ${spanClass}">
              <div>
                <div class="flex items-start justify-between gap-3 mb-3">
                  <span class="text-3xl p-2 rounded-xl bg-slate-900 border border-slate-700/60 group-hover:scale-110 transition-transform">${opt.icon || '👉'}</span>
                  ${keyNum <= 9 ? `
                    <span class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/50 group-hover:text-emerald-300 group-hover:border-emerald-500/40 transition-colors">Press [${keyNum}]</span>
                  ` : ''}
                </div>
                <h3 class="text-base font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors mb-1.5 leading-snug">${cleanLabel}</h3>
                ${opt.description ? `<p class="text-xs text-slate-400 leading-relaxed">${opt.description}</p>` : ''}
              </div>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Contextual Linux Pro-Tip Box -->
      ${nextQuestion.tip ? `
        <div class="mt-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3.5 text-xs">
          <span class="text-xl p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            ${nextQuestion.tip.icon || '💡'}
          </span>
          <div>
            <h4 class="font-semibold text-slate-200 mb-0.5">${nextQuestion.tip.title}</h4>
            <p class="text-slate-400 leading-relaxed">${nextQuestion.tip.text}</p>
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

function getAddonCombos(distroId: string): { title: string; icon: string; description: string; howTo: string }[] {
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
          howTo: 'Add network folder via SMB/NFS, or install the official Jellyfin / Plex add-on from Kodi repository.'
        }
      ];
    case 'openmediavault':
      return [
        {
          title: 'Smart Home Hub (Home Assistant)',
          icon: '🏡',
          description: 'Run your local private smart home hub alongside family file storage on the same PC.',
          howTo: 'Install "omv-extras" plugin → enable Compose / Docker → 1-click launch Home Assistant container.'
        },
        {
          title: 'Private Family Photo Cloud (Immich)',
          icon: '📸',
          description: 'Auto-backup phone photos and replace Google Photos / iCloud with AI face & map search.',
          howTo: 'Deploy the Immich Docker Compose template directly inside the OMV web interface.'
        },
        {
          title: 'Network-Wide Ad Blocker (Pi-hole)',
          icon: '🛡️',
          description: 'Block ads and tracking for every phone, laptop, and smart TV connected to your Wi-Fi.',
          howTo: 'Launch a Pi-hole container and point your home Wi-Fi router DNS to your OMV box IP address.'
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
          howTo: 'Install Music Assistant or Jellyfin from the Home Assistant Community Add-on Store.'
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
          howTo: 'Cage automatically binds to libinput; enable onboard or wvkbd for on-screen touch typing.'
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
          howTo: 'Run `curl -fsSL https://ollama.com/install.sh | sh` then `ollama run llama3`.'
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
    default:
      return [
        {
          title: 'Containerize Any Service (Docker & Compose)',
          icon: '🐳',
          description: 'Run media servers, ad-blockers, smart home, and coding sandboxes in isolated containers.',
          howTo: 'Install Docker with one command (curl -fsSL https://get.docker.com | sh) and run any homelab app.'
        },
        {
          title: 'Secure Remote Access (Tailscale VPN)',
          icon: '🔒',
          description: 'Access your machine securely from anywhere outside the house without opening router ports.',
          howTo: 'Install Tailscale to join your personal private mesh network in 30 seconds.'
        }
      ];
  }
}

function renderResultsView(evaluation: RecommendationOutput): string {
  const best = evaluation.bestMatch;
  const recipe = evaluation.recommendedRecipe;
  const combos = getAddonCombos(best.distro.id);

  return `
    <div class="space-y-6">
      
      <!-- Top Match Winner Banner -->
      <div class="bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div class="flex items-center gap-4">
            <span class="text-5xl p-2 rounded-2xl bg-slate-900 border border-slate-700/60">${best.distro.logoEmoji || '🐧'}</span>
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-3xl font-extrabold text-slate-100">${best.distro.name}</h2>
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  ${best.score}% Match
                </span>
              </div>
              <p class="text-sm text-emerald-300 font-medium mt-1">${best.distro.tagline}</p>
            </div>
          </div>

          <a href="${best.distro.website}" target="_blank" rel="noopener noreferrer" class="px-4 py-2.5 text-xs font-bold rounded-lg bg-emerald-400 text-slate-950 hover:bg-emerald-300 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/40">
            Official Website ↗
          </a>
        </div>

        <p class="text-sm text-slate-300 leading-relaxed mb-6">${best.distro.description}</p>

        <!-- Technical Attributes Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-6">
          <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span class="text-slate-500 block text-[11px] uppercase font-semibold">Typical Footprint</span>
            <span class="font-medium text-slate-200 capitalize mt-0.5 block">${best.distro.footprint}</span>
          </div>
          <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span class="text-slate-500 block text-[11px] uppercase font-semibold">Init System</span>
            <span class="font-medium text-slate-200 mt-0.5 block">${best.distro.initSystems.join(', ')}</span>
          </div>
          <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span class="text-slate-500 block text-[11px] uppercase font-semibold">C Standard Library</span>
            <span class="font-medium text-slate-200 mt-0.5 block">${best.distro.cLibraries.join(', ')}</span>
          </div>
          <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span class="text-slate-500 block text-[11px] uppercase font-semibold">State Model</span>
            <span class="font-medium text-slate-200 capitalize mt-0.5 block">${best.distro.stateModel}</span>
          </div>
        </div>

        <!-- Strengths vs Tradeoffs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div class="bg-emerald-950/30 border border-emerald-900/40 rounded-xl p-4">
            <h4 class="font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
              <span>✨</span> Key Strengths
            </h4>
            <ul class="space-y-1.5 text-slate-300">
              ${best.distro.highlights.map((h) => `<li>• ${h}</li>`).join('')}
            </ul>
          </div>
          <div class="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4">
            <h4 class="font-bold text-amber-400 mb-2 flex items-center gap-1.5">
              <span>⚖️</span> Trade-offs
            </h4>
            <ul class="space-y-1.5 text-slate-300">
              ${best.distro.tradeoffs.map((t) => `<li>• ${t}</li>`).join('')}
            </ul>
          </div>
        </div>

      </div>

      <!-- Mix & Match Hybrid Combos -->
      <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div class="mb-5">
          <div class="flex items-center gap-2">
            <span class="text-xl">🧩</span>
            <h3 class="text-lg font-bold text-slate-100">Mix & Match: Popular Combos for ${best.distro.name}</h3>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            Linux is modular. You don't have to choose just one thing! Start with ${best.distro.name} as your core foundation, then layer on these add-on capabilities:
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${combos.map(combo => `
            <div class="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <div class="flex items-center gap-2.5 mb-2">
                  <span class="text-2xl">${combo.icon}</span>
                  <h4 class="text-sm font-semibold text-slate-200">${combo.title}</h4>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed mb-3">${combo.description}</p>
              </div>
              <div class="pt-2.5 border-t border-slate-800/80 text-[11px] text-emerald-400 font-mono">
                👉 ${combo.howTo}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Zero-Bloat Hardware Optimization Comparison -->
      <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xl">🪶</span>
              <h3 class="text-lg font-bold text-slate-100">Zero-Bloat Hardware Optimization</h3>
            </div>
            <p class="text-xs text-slate-400 mt-1">
              <span class="text-amber-400 font-semibold">⚠️ Note:</span> Prebuilt official ISOs from distros must support all PCs on Earth and still carry generic bloat. The ultra-lean footprint below is achieved when building with DistroTailor's <strong>custom Makefile / build recipe</strong>!
            </p>
          </div>
          <span class="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
            ~92% Bloat Eliminated
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Generic Prebuilt Distro -->
          <div class="p-4 rounded-xl bg-slate-950/70 border border-red-950/40 text-xs">
            <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <div>
                <span class="font-bold text-slate-300 block">Off-The-Shelf Prebuilt ISO</span>
                <span class="text-[11px] text-slate-500">Direct download from distro website</span>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950/60 text-red-400 border border-red-900/40">Generic Driver Bloat</span>
            </div>
            <ul class="space-y-2 text-slate-400">
              <li class="flex items-center justify-between">
                <span>📦 Total Install Size:</span>
                <span class="font-mono text-slate-200">~4.5 GB – 6 GB</span>
              </li>
              <li class="flex items-center justify-between">
                <span>🚗 Firmware Blobs (<code class="text-[10px] text-red-400">linux-firmware</code>):</span>
                <span class="font-mono text-red-300">~1.8 GB (10,000 unused chips)</span>
              </li>
              <li class="flex items-center justify-between">
                <span>⚙️ Kernel Modules:</span>
                <span class="font-mono text-slate-200">4,500+ drivers (SCSI, ancient RAID)</span>
              </li>
              <li class="flex items-center justify-between">
                <span>⚡ Idle RAM Consumption:</span>
                <span class="font-mono text-slate-200">~800 MB – 1.2 GB</span>
              </li>
              <li class="flex items-center justify-between">
                <span>⏱️ Cold Boot Duration:</span>
                <span class="font-mono text-slate-200">25 – 45 seconds</span>
              </li>
            </ul>
          </div>

          <!-- DistroTailor Custom Makefile Build -->
          <div class="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-emerald-900/30">
                <div>
                  <span class="font-bold text-emerald-300 block">DistroTailor Custom Makefile Build</span>
                  <span class="text-[11px] text-emerald-400/70">Built via recipe generator below</span>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Hardware-Tailored</span>
              </div>
              <ul class="space-y-2 text-slate-300">
                <li class="flex items-center justify-between">
                  <span>📦 Total Footprint:</span>
                  <span class="font-mono font-bold text-emerald-400">~150 MB – 350 MB (-93%)</span>
                </li>
                <li class="flex items-center justify-between">
                  <span>🚗 Firmware Blobs:</span>
                  <span class="font-mono text-emerald-300">&lt; 15 MB (only your specific chip)</span>
                </li>
                <li class="flex items-center justify-between">
                  <span>⚙️ Kernel Drivers:</span>
                  <span class="font-mono text-emerald-300">Targeted via localmodconfig</span>
                </li>
                <li class="flex items-center justify-between">
                  <span>⚡ Idle RAM Consumption:</span>
                  <span class="font-mono text-emerald-300">~60 MB – 150 MB</span>
                </li>
                <li class="flex items-center justify-between">
                  <span>⏱️ Cold Boot Duration:</span>
                  <span class="font-mono font-bold text-emerald-400">&lt; 2 – 4 seconds</span>
                </li>
              </ul>
            </div>
            <div class="mt-3 pt-2.5 border-t border-emerald-900/30 text-[11px] text-emerald-400 font-medium">
              👉 To get this lean build, use the <strong>Custom Build Recipe Generator</strong> below!
            </div>
          </div>
        </div>
      </div>

      <!-- Frankenstein / Hybrid Modularity Card -->
      <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div class="mb-4">
          <div class="flex items-center gap-2">
            <span class="text-xl">🧪</span>
            <h3 class="text-lg font-bold text-slate-100">The "Frankenstein" Spectrum: Linux is 100% Modular</h3>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            In Linux, distribution names are just starting points. If you are an expert or power user, you can mix and match parts from across the entire ecosystem:
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div class="flex items-center gap-2 font-semibold text-slate-200 mb-1.5">
              <span>🏛️ ⇄ 🏹</span>
              <span>Debian Base + Arch AUR</span>
            </div>
            <p class="text-slate-400 leading-relaxed text-[11px] mb-2.5">
              Want Debian's rock-solid server base, but need bleeding-edge packages? Use <strong>Distrobox</strong> to run Arch's <code class="text-emerald-400">pacman</code> and AUR directly on this host without conflict.
            </p>
            <span class="text-[10px] text-emerald-400 font-mono">distrobox create --image archlinux</span>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div class="flex items-center gap-2 font-semibold text-slate-200 mb-1.5">
              <span>🖼️</span>
              <span>GNOME vs. KDE vs. Cage</span>
            </div>
            <p class="text-slate-400 leading-relaxed text-[11px] mb-2.5">
              Desktop environments are just interchangeable userspace programs. Swap heavy GNOME for KDE Plasma, lightweight XFCE, or the ultra-lean <strong>Cage Wayland</strong> kiosk compositor in the generated Makefile.
            </p>
            <span class="text-[10px] text-emerald-400 font-mono">make DESKTOP_ENV=cage</span>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div class="flex items-center gap-2 font-semibold text-slate-200 mb-1.5">
              <span>❄️ ⇄ 📦</span>
              <span>Universal Nix & Flatpak</span>
            </div>
            <p class="text-slate-400 leading-relaxed text-[11px] mb-2.5">
              Keep your core OS rootfs read-only and immutable. Layer user applications via <strong>Nix package manager</strong> or <strong>Flatpak</strong> so zero app dependencies pollute the base system.
            </p>
            <span class="text-[10px] text-emerald-400 font-mono">nix-env -iA nixpkgs.myApp</span>
          </div>
        </div>
      </div>

      <!-- Turnkey Prebuilt Download or Custom Recipe -->
      ${best.distro.prebuiltImage ? `
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 class="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>🚀</span> Ready-To-Flash Official Image
              </h3>
              <p class="text-xs text-slate-400 mt-1">
                You can download the official turnkey image directly and flash it to a USB drive using free tools like BalenaEtcher or Raspberry Pi Imager.
              </p>
            </div>
            <a href="${best.distro.prebuiltImage.downloadUrl}" target="_blank" rel="noopener noreferrer" class="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-400 text-slate-950 hover:bg-emerald-300 transition-all flex items-center gap-1.5 whitespace-nowrap shadow-md">
              Download ${best.distro.name} Image ↗
            </a>
          </div>
        </div>
      ` : ''}

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

          <!-- Quickstart Snippet -->
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
    <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur space-y-6 shadow-xl">
      <div>
        <h2 class="text-xl font-bold text-slate-100 mb-1">🛠️ Expert Constraint Matrix</h2>
        <p class="text-xs text-slate-400">Directly set exact architecture, init system, C library, and footprint flags.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        
        <!-- Architecture -->
        <div>
          <label class="block text-slate-400 font-semibold mb-1.5">CPU Architecture</label>
          <select id="expert-arch" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200">
            <option value="">Any Architecture</option>
            <option value="x86_64" ${state.criteria.architecture === 'x86_64' ? 'selected' : ''}>x86_64 / AMD64</option>
            <option value="arm64" ${state.criteria.architecture === 'arm64' ? 'selected' : ''}>ARM64 / AArch64</option>
            <option value="armv7" ${state.criteria.architecture === 'armv7' ? 'selected' : ''}>ARMv7 (32-bit)</option>
            <option value="riscv64" ${state.criteria.architecture === 'riscv64' ? 'selected' : ''}>RISC-V 64-bit</option>
            <option value="nommu" ${state.criteria.architecture === 'nommu' ? 'selected' : ''}>NOMMU / Microcontroller</option>
          </select>
        </div>

        <!-- Footprint -->
        <div>
          <label class="block text-slate-400 font-semibold mb-1.5">Storage & RAM Footprint</label>
          <select id="expert-footprint" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200">
            <option value="">Any Footprint</option>
            <option value="micro" ${state.criteria.footprint === 'micro' ? 'selected' : ''}>Extreme Micro (<16 MB)</option>
            <option value="minimal" ${state.criteria.footprint === 'minimal' ? 'selected' : ''}>Ultra-Minimal (16-100 MB)</option>
            <option value="lean" ${state.criteria.footprint === 'lean' ? 'selected' : ''}>Lean (100 MB - 1 GB)</option>
            <option value="standard" ${state.criteria.footprint === 'standard' ? 'selected' : ''}>Standard (1 - 5 GB)</option>
            <option value="full" ${state.criteria.footprint === 'full' ? 'selected' : ''}>Full Workstation (>5 GB)</option>
          </select>
        </div>

        <!-- Init System -->
        <div>
          <label class="block text-slate-400 font-semibold mb-1.5">Init System Preference</label>
          <select id="expert-init" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200">
            <option value="">No Preference</option>
            <option value="systemd" ${state.criteria.initPreference === 'systemd' ? 'selected' : ''}>systemd</option>
            <option value="openrc" ${state.criteria.initPreference === 'openrc' ? 'selected' : ''}>OpenRC</option>
            <option value="busybox" ${state.criteria.initPreference === 'busybox' ? 'selected' : ''}>BusyBox Init</option>
            <option value="runit" ${state.criteria.initPreference === 'runit' ? 'selected' : ''}>runit</option>
          </select>
        </div>

        <!-- C Library -->
        <div>
          <label class="block text-slate-400 font-semibold mb-1.5">C Standard Library</label>
          <select id="expert-clib" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200">
            <option value="">No Preference</option>
            <option value="glibc" ${state.criteria.cLibPreference === 'glibc' ? 'selected' : ''}>glibc (GNU C Library)</option>
            <option value="musl" ${state.criteria.cLibPreference === 'musl' ? 'selected' : ''}>musl libc</option>
            <option value="uclibc-ng" ${state.criteria.cLibPreference === 'uclibc-ng' ? 'selected' : ''}>uClibc-ng (NOMMU)</option>
          </select>
        </div>

        <!-- State Model -->
        <div>
          <label class="block text-slate-400 font-semibold mb-1.5">State Management</label>
          <select id="expert-state" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200">
            <option value="">Any State Model</option>
            <option value="mutable" ${state.criteria.statePreference === 'mutable' ? 'selected' : ''}>Traditional Mutable</option>
            <option value="declarative" ${state.criteria.statePreference === 'declarative' ? 'selected' : ''}>Declarative (NixOS)</option>
            <option value="immutable-ostree" ${state.criteria.statePreference === 'immutable-ostree' ? 'selected' : ''}>Atomic / Immutable (OSTree)</option>
            <option value="stateless-ram" ${state.criteria.statePreference === 'stateless-ram' ? 'selected' : ''}>Stateless / Run from RAM</option>
          </select>
        </div>

        <!-- Role -->
        <div>
          <label class="block text-slate-400 font-semibold mb-1.5">Primary Target Role</label>
          <select id="expert-role" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200">
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
        <button id="btn-apply-expert" class="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-400 text-slate-950 hover:bg-emerald-300 transition-all cursor-pointer shadow-lg shadow-emerald-950/40">
          Apply Constraints & View Results →
        </button>
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
  // Brand Click
  document.getElementById('nav-brand')?.addEventListener('click', () => {
    state.activeTab = 'wizard';
    render();
  });

  // Tab Toggles
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

  document.getElementById('btn-reset')?.addEventListener('click', () => {
    state.criteria = {};
    state.answeredQuestionIds.clear();
    state.history = [];
    state.activeTab = 'wizard';
    render();
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

  // Wizard Option Buttons
  document.querySelectorAll<HTMLButtonElement>('.option-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const optId = btn.getAttribute('data-option-id');
      const opt = nextQuestion?.options.find((o) => o.id === optId);
      if (opt && nextQuestion) {
        state.history.push({ ...state.criteria });
        Object.assign(state.criteria, opt.appliesCriteria);
        state.answeredQuestionIds.add(nextQuestion.id);
        render();
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
              render();
              return;
            }
          }
        }

        // Backspace or Left Arrow = Previous
        if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
          if (state.history.length > 0) {
            const prev = state.history.pop();
            state.criteria = prev || {};
            const lastAnswered = Array.from(state.answeredQuestionIds).pop();
            if (lastAnswered) state.answeredQuestionIds.delete(lastAnswered);
            render();
          }
        }
      }
    });
    keyboardHandlerRegistered = true;
  }

  // Back button
  document.getElementById('btn-back')?.addEventListener('click', () => {
    if (state.history.length > 0) {
      const prev = state.history.pop();
      state.criteria = prev || {};
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

// Initial mount
render();
