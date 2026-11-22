import { escapeHtml } from '../../utils/dom.js';
import { panelAttributes } from '../panel.js';
import { ResultsViewContext } from './context.js';

/** Panel 5: context-aware 3-tier verification & deployment ladder. */
export function renderVerificationLadder(ctx: ResultsViewContext): string {
  const { state, recipe, best } = ctx;
  const arch = state.criteria.architecture || 'x86_64';
  const isArm64 = arch === 'arm64';
  const isSbc = state.criteria.platform === 'embedded-sbc' || state.criteria.formFactor === 'sbc';
  const isVm = state.criteria.platform === 'vm' || recipe?.targetFormat === 'qcow2';
  const isWsl = state.criteria.platform === 'wsl2' || recipe?.targetFormat === 'wsl2';
  const isContainer = recipe?.targetFormat === 'dockerfile' || recipe?.targetFormat === 'lxc-template';
  const hasDockerBuild = !!recipe?.files.some(
    (f) => f.filename === 'Makefile' && /^docker-build:/m.test(f.content)
  );

  const tier1Title = recipe ? 'Tier 1: Build & Verify' : 'Tier 1: Verify Download';
  const tier1Desc = recipe
    ? hasDockerBuild
      ? 'Build the tailored image reproducibly on macOS, Windows, or Linux with zero changes to your host OS.'
      : `Generate and validate the ${escapeHtml(recipe.title)} artifacts locally before deploying.`
    : `Verify the official ${escapeHtml(best.distro.name)} image checksum before flashing or booting.`;
  const tier1Cmd = recipe
    ? hasDockerBuild
      ? 'make docker-build   # macOS / Windows / cross-arch\nsudo make           # Native Linux host'
      : recipe.quickstartCommands[0] || 'make'
    : 'shasum -a 256 <downloaded-image>';

  const tier2Label = isContainer ? 'Container / RootFS Test' : 'QEMU VM Test (Optional)';
  const isoPath = recipe ? 'output/*.iso' : '<downloaded-image>.iso';
  let tier2Cmd = `qemu-system-x86_64 -cdrom ${isoPath} -m 2048 -enable-kvm`;
  let tier2Note = 'macOS Intel: -accel hvf | Apple Silicon: omit -enable-kvm (or use VirtualBox / UTM)';
  if (isArm64 && !isVm && !isWsl && !isContainer) {
    tier2Cmd =
      `qemu-system-aarch64 -M virt -accel hvf -cpu host -m 2048 \\\n  -bios "$(brew --prefix qemu)/share/qemu/edk2-aarch64-code.fd" \\\n  -cdrom ${isoPath} -device virtio-gpu-pci -display cocoa`;
    tier2Note = 'Linux host: omit -accel hvf, use -cpu cortex-a57 and AAVMF_CODE.fd';
  } else if (isVm) {
    tier2Cmd = 'make test-qemu\nssh -p 2222 tailor@localhost';
    tier2Note = 'Boots the generated QCOW2 disk locally with SSH forwarded to port 2222';
  } else if (isWsl) {
    tier2Cmd = 'wsl --import TailoredLinux C:\\WSL\\Tailored output\\*.tar.gz\nwsl -d TailoredLinux';
    tier2Note = 'Runs inside Windows Subsystem for Linux 2 with zero disk partitioning';
  } else if (recipe?.targetFormat === 'tarball') {
    tier2Cmd = 'tar -tzf output/*.tar.gz | head -n 20\ndocker import output/*.tar.gz tailored-test && docker run --rm -it tailored-test /bin/sh';
    tier2Note = 'Inspect or boot the rootfs tarball inside a throwaway container';
  } else if (isContainer) {
    tier2Cmd = recipe?.quickstartCommands[0] || 'docker build -t tailored-app . && docker run --rm -it tailored-app';
    tier2Note = 'Runs the generated container image in complete isolation';
  }

  let tier3Title = 'Tier 3: Bare-Metal Live USB';
  let tier3Desc = 'Flash the bootable ISO to a USB drive and test Wi-Fi, GPU, and audio on real hardware without touching your internal drive.';
  let tier3Steps = [
    '1. Flash via <strong>balenaEtcher</strong> or <strong>Rufus</strong>',
    '2. Boot: Tap <strong>F12</strong> (Dell/Lenovo), <strong>Del/F8</strong> (Asus), or <strong>Option ⌥</strong> (Mac)'
  ];
  let tier3Badge = 'UEFI USB Boot';

  if (isSbc) {
    tier3Title = 'Tier 3: SBC SD Card / eMMC';
    tier3Desc = `Flash the ${escapeHtml(arch)} image to an SD card or USB SSD. Note: non-UEFI boards (like Raspberry Pi) require board-specific firmware/DTB images.`;
    tier3Steps = [
      '1. Flash via <strong>Raspberry Pi Imager</strong> or <strong>balenaEtcher</strong>',
      '2. Insert SD card, connect HDMI + power, and verify display/network'
    ];
    tier3Badge = 'ARM / SBC Storage';
  } else if (isVm || state.criteria.useCase === 'hypervisor-vms') {
    tier3Title = 'Tier 3: Hypervisor Deployment';
    tier3Desc = 'Import the verified image into Proxmox VE, KVM/libvirt, or your cloud hypervisor.';
    tier3Steps = [
      '1. Proxmox: <code>qm importdisk &lt;vmid&gt; output/*.qcow2 local-zfs</code>',
      '2. Attach VirtIO SCSI + Cloud-Init drive and boot'
    ];
    tier3Badge = 'Proxmox / KVM';
  } else if (isWsl) {
    tier3Title = 'Tier 3: Daily WSL2 Workflow';
    tier3Desc = 'Set your imported WSL2 distribution as default and connect VS Code / Windows Terminal.';
    tier3Steps = [
      '1. Set default: <code>wsl --set-default TailoredLinux</code>',
      '2. Open directly from Windows Terminal or VS Code Remote-WSL'
    ];
    tier3Badge = 'WSL2 Integration';
  }

  return `
      <!-- 🧪 Panel 5: 3-Tier Verification & Testing Ladder -->
      <details class="group bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all" ${panelAttributes(state.panelOpen, 'verification-ladder', false)}>
        <summary class="flex items-center justify-between p-4 sm:p-6 cursor-pointer select-none hover:bg-slate-800/40 transition-colors">
          <div class="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <span class="text-xl sm:text-2xl p-1.5 sm:p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 shrink-0">🧪</span>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-sm sm:text-base font-bold text-slate-100 break-words">3-Tier Verification & Testing Ladder</h3>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-800">${escapeHtml(arch)} · ${escapeHtml(recipe?.targetFormat || 'prebuilt')}</span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5 break-words">
                Tailored build, sandbox simulation, and target deployment steps for ${escapeHtml(best.distro.name)} (${escapeHtml(arch)}).
              </p>
            </div>
          </div>
          <span class="text-slate-500 group-open:rotate-180 transition-transform duration-200 text-base ml-2 shrink-0">▼</span>
        </summary>

        <div class="p-4 sm:p-8 pt-0 border-t border-slate-800/60 mt-2">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 min-w-0">
            <!-- Tier 1: Build / Verify -->
            <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
              <div>
                <div class="flex items-center gap-2 mb-2 min-w-0">
                  <span class="text-base shrink-0">🛠️</span>
                  <h4 class="text-sm font-bold text-sky-400 break-words">${tier1Title}</h4>
                </div>
                <p class="text-xs text-slate-400 mb-3 leading-relaxed break-words">
                  ${tier1Desc}
                </p>
                <div class="text-[11px] font-mono bg-slate-900 p-2.5 rounded border border-slate-800 text-slate-300 overflow-x-auto min-w-0 max-w-full">
                  <span class="text-slate-500 uppercase tracking-wider block mb-1 text-[10px] font-semibold">Command:</span>
                  <pre class="text-sky-300 block text-[10px] overflow-x-auto p-0.5 max-w-full whitespace-pre font-mono"><code>${escapeHtml(tier1Cmd)}</code></pre>
                </div>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span class="text-[11px] text-sky-400 font-medium">⚡ 0% Drive Risk</span>
                <span class="text-[11px] text-slate-500">${hasDockerBuild ? 'Docker / Make' : 'Host Check'}</span>
              </div>
            </div>

            <!-- Tier 2: Safe VM / Container Sandbox -->
            <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
              <div>
                <div class="flex items-center gap-2 mb-2 min-w-0">
                  <span class="text-base shrink-0">🖧</span>
                  <h4 class="text-sm font-bold text-emerald-400 break-words">Tier 2: Safe Sandbox</h4>
                </div>
                <p class="text-xs text-slate-400 mb-3 leading-relaxed break-words">
                  ${isContainer || isVm || isWsl ? 'Simulate boot, networking, and login credentials in isolation before touching target storage.' : 'Optional: test-boot in a VM (QEMU, VirtualBox, or UTM) before touching target storage, or skip straight to Tier 3.'}
                </p>
                <div class="text-[11px] font-mono bg-slate-900 p-2.5 rounded border border-slate-800 text-slate-300 space-y-1.5 overflow-x-auto min-w-0 max-w-full">
                  <span class="text-slate-500 uppercase tracking-wider block text-[10px] font-semibold">${tier2Label}:</span>
                  <pre class="text-emerald-400 block text-[10px] overflow-x-auto p-0.5 max-w-full whitespace-pre font-mono"><code>${escapeHtml(tier2Cmd)}</code></pre>
                  <span class="text-slate-500 block text-[10px] break-words">${escapeHtml(tier2Note)}</span>
                </div>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span class="text-[11px] text-emerald-400 font-medium">🛡️ Isolated Sandbox</span>
                <span class="text-[11px] text-slate-500">${escapeHtml(arch)}</span>
              </div>
            </div>

            <!-- Tier 3: Target Hardware / Deployment -->
            <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
              <div>
                <div class="flex items-center gap-2 mb-2 min-w-0">
                  <span class="text-base shrink-0">⚡</span>
                  <h4 class="text-sm font-bold text-amber-400 break-words">${tier3Title}</h4>
                </div>
                <p class="text-xs text-slate-400 mb-3 leading-relaxed break-words">
                  ${tier3Desc}
                </p>
                <div class="text-[11px] font-mono bg-slate-900 p-2.5 rounded border border-slate-800 text-slate-300 space-y-1 min-w-0">
                  <span class="text-slate-500 uppercase tracking-wider block text-[10px] font-semibold">Deploy Steps:</span>
                  ${tier3Steps.map((s) => `<span class="block text-slate-300 break-words">${s}</span>`).join('\n                  ')}
                </div>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span class="text-[11px] text-amber-400 font-medium">🚀 Target Hardware</span>
                <span class="text-[11px] text-slate-500">${tier3Badge}</span>
              </div>
            </div>
          </div>
        </div>
      </details>
`;
}
