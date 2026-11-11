import { ResultsViewContext } from './context.js';

/** Panel 5: three-tier testing ladder from browser sandbox to bare metal. */
export function renderVerificationLadder(ctx: ResultsViewContext): string {
  return `
      <!-- 🧪 Panel 5: 3-Tier Verification & Testing Ladder -->
      <details class="group bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all">
        <summary class="flex items-center justify-between p-4 sm:p-6 cursor-pointer select-none hover:bg-slate-800/40 transition-colors">
          <div class="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <span class="text-xl sm:text-2xl p-1.5 sm:p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 shrink-0">🧪</span>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-sm sm:text-base font-bold text-slate-100 break-words">3-Tier Verification & Testing Ladder</h3>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-800">Deployment Guide</span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5 break-words">
                Test and verify your tailored build across three levels of hardware access—from zero-risk browser sandboxes to physical silicon.
              </p>
            </div>
          </div>
          <span class="text-slate-500 group-open:rotate-180 transition-transform duration-200 text-base ml-2 shrink-0">▼</span>
        </summary>

        <div class="p-4 sm:p-8 pt-0 border-t border-slate-800/60 mt-2">
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
      </details>
`;
}
