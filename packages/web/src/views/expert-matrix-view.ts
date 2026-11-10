import { AppState } from '../state/store.js';

export function renderExpertMatrix(state: AppState): string {
  return `
    <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-8 backdrop-blur space-y-6 shadow-xl min-w-0 max-w-full overflow-hidden">
      <div class="flex items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div class="min-w-0">
          <h2 class="text-lg sm:text-xl font-bold text-slate-100 mb-1 break-words">🛠️ Expert Constraint Matrix</h2>
          <p class="text-xs text-slate-400 break-words">Directly set exact architecture, init system, C library, and footprint flags.</p>
        </div>
        <button id="btn-close-expert" class="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 text-xs font-medium" title="Close and return to Wizard (Esc)">
          <span class="text-base leading-none">✕</span>
          <span class="hidden sm:inline text-xs font-mono text-slate-500">Esc</span>
        </button>
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

      <div class="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        <button id="btn-cancel-expert" class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer flex items-center gap-1.5">
          <span>← Back to 20 Questions</span>
        </button>
        <button id="btn-apply-expert" class="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-400 text-slate-950 hover:bg-emerald-300 transition-all cursor-pointer shadow-lg shadow-emerald-950/40 text-center">
          Apply Constraints & View Results →
        </button>
      </div>

    </div>
  `;
}
