import { GeneratedRecipe, UserCriteria } from '../types.js';
import { V86_ASSET_SHA256, V86_ASSETS_COMMIT, V86_NPM_VERSION } from './checksums.js';

const V86_CDN = `https://cdn.jsdelivr.net/npm/v86@${V86_NPM_VERSION}/build`;
const V86_BIOS_BASE = `https://raw.githubusercontent.com/copy/v86/${V86_ASSETS_COMMIT}/bios`;
const V86_ISO_URL = 'https://copy.sh/v86/images/linux.iso';

export function generateWasmRecipe(criteria: UserCriteria): GeneratedRecipe {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DistroTailor WebVM (v86 in WebAssembly)</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐧</text></svg>">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      background: #090d16;
      color: #e2e8f0;
      margin: 0;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .header {
      max-width: 760px;
      width: 100%;
      margin-bottom: 0.8rem;
    }
    h1 {
      font-size: 1.4rem;
      color: #38bdf8;
      margin: 0 0 0.3rem 0;
    }
    p {
      color: #94a3b8;
      font-size: 0.85rem;
      margin: 0 0 0.8rem 0;
    }
    #status-bar {
      background: #1e293b;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.82rem;
      color: #38bdf8;
      display: inline-block;
      border: 1px solid #334155;
      margin-bottom: 0.5rem;
    }
    .controls {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.4rem;
    }
    button {
      background: #0284c7;
      color: #fff;
      border: none;
      padding: 0.35rem 0.8rem;
      border-radius: 5px;
      font-size: 0.78rem;
      cursor: pointer;
      font-weight: 500;
    }
    button:hover {
      background: #0369a1;
    }
    .terminal-wrapper {
      background: #000;
      border: 2px solid #334155;
      border-radius: 8px;
      padding: 10px;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.8);
      margin-top: 0.5rem;
      width: fit-content;
      min-width: 640px;
      min-height: 400px;
    }
    #screen_container {
      cursor: text;
      outline: none;
    }
    #screen_container:focus {
      outline: 2px solid #38bdf8;
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
    }
    #screen_container div {
      white-space: pre;
      font: 14px monospace;
      line-height: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🐧 DistroTailor: WebAssembly Linux VM (v86)</h1>
    <p>Booting a live x86 Linux operating system directly in your browser.</p>
    
    <div id="status-bar">⏳ Preparing WebAssembly virtual machine...</div>
    
    <div class="controls">
      <button id="btn-fullscreen">⛶ Fullscreen</button>
      <button id="btn-reboot">🔄 Reboot</button>
    </div>
  </div>

  <div class="terminal-wrapper">
    <div id="screen_container" tabindex="0">
      <div style="white-space: pre; font: 14px monospace; line-height: 14px"></div>
      <canvas style="display: none"></canvas>
    </div>
  </div>

  <script type="module">
    console.log("[DistroTailor] Starting WebVM Initialization...");

    const statusEl = document.getElementById("status-bar");
    const screenEl = document.getElementById("screen_container");

    function logStep(stepNum, msg, color) {
      if (!color) color = "#38bdf8";
      const formatted = "[Step " + stepNum + "] " + msg;
      console.log("%c" + formatted, "color: " + color);
      statusEl.textContent = formatted;
      statusEl.style.color = color;
    }

    async function sha256Hex(buffer) {
      const digest = await crypto.subtle.digest("SHA-256", buffer);
      return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    async function fetchBufferWithLog(stepNum, name, url, fallbackUrl, expectedSha256) {
      logStep(stepNum, "Fetching " + name + "... (" + url + ")");
      const startTime = performance.now();
      let res;
      try {
        res = await fetch(url);
        if (!res.ok && fallbackUrl) {
          console.warn("Failed fetching from " + url + ", trying fallback " + fallbackUrl);
          res = await fetch(fallbackUrl);
        }
      } catch (e) {
        if (fallbackUrl) res = await fetch(fallbackUrl);
        else throw e;
      }
      if (!res.ok) {
        throw new Error("Failed to fetch " + name + " (" + url + "): HTTP " + res.status + " " + res.statusText);
      }
      const buffer = await res.arrayBuffer();
      const actualSha256 = await sha256Hex(buffer);
      if (actualSha256 !== expectedSha256) {
        throw new Error(name + " failed SHA-256 verification (expected " + expectedSha256 + ", got " + actualSha256 + ")");
      }
      const elapsed = Math.round(performance.now() - startTime);
      const sizeMb = (buffer.byteLength / (1024 * 1024)).toFixed(2);
      logStep(stepNum, "Loaded " + name + " (" + sizeMb + " MB) in " + elapsed + "ms", "#4ade80");
      return buffer;
    }

    async function startVM() {
      try {
        logStep("1/4", "Importing V86 engine from CDN...");
        const { V86 } = await import("${V86_CDN}/libv86.mjs");
        console.log("[DistroTailor] V86 module loaded successfully:", typeof V86);

        // Pre-fetch all binary assets into memory so V86 has 0 network latency/CORS stalls
        const biosBuffer = await fetchBufferWithLog("2/4", "Bochs BIOS", "./bochs-bios.bin", "${V86_BIOS_BASE}/bochs-bios.bin", "${V86_ASSET_SHA256.bochsBios}");
        const vgaBiosBuffer = await fetchBufferWithLog("3/4", "Bochs VGABIOS", "./bochs-vgabios.bin", "${V86_BIOS_BASE}/bochs-vgabios.bin", "${V86_ASSET_SHA256.bochsVgaBios}");
        const cdromBuffer = await fetchBufferWithLog("4/4", "Linux Live ISO", "./linux.iso", "${V86_ISO_URL}", "${V86_ASSET_SHA256.linuxIso}");

        logStep("BOOTING", "Bochs BIOS Starting... Mounting ISO CD-ROM...");
        console.log("[DistroTailor] Creating V86 instance with buffers in memory...");

        const emulator = new V86({
          wasm_path: "${V86_CDN}/v86.wasm",
          memory_size: 64 * 1024 * 1024,
          vga_memory_size: 2 * 1024 * 1024,
          screen_container: screenEl,
          bios: { buffer: biosBuffer },
          vga_bios: { buffer: vgaBiosBuffer },
          cdrom: { buffer: cdromBuffer },
          disable_speaker: true,
          autostart: true
        });

        console.log("[DistroTailor] V86 instance created! Registering listeners...");

        emulator.add_listener("emulator-loaded", () => {
          console.log("%c[DistroTailor Event] emulator-loaded fired! CPU executing.", "color: #22c55e; font-weight: bold;");
          logStep("READY", "🟢 Linux Kernel Booting! Keystrokes are active.", "#4ade80");
          screenEl.focus();
        });

        emulator.add_listener("screen-set-mode", (isGraphical) => {
          console.log("[DistroTailor Event] screen-set-mode:", isGraphical ? "GRAPHICAL (Canvas)" : "TEXT (DOM Div)");
        });

        // Controls
        document.getElementById("btn-fullscreen")?.addEventListener("click", () => {
          emulator.screen_go_fullscreen();
        });

        document.getElementById("btn-reboot")?.addEventListener("click", () => {
          console.log("[DistroTailor] Rebooting emulator...");
          emulator.restart();
        });

        // Focus screen on click
        screenEl?.addEventListener("click", () => {
          screenEl.focus();
          console.log("[DistroTailor] Terminal focused. Keystrokes sent to VM.");
        });

        console.log("%c[DistroTailor] VM start sequence initiated successfully.", "color: #38bdf8; font-weight: bold;");

      } catch (err) {
        console.error("%c[DistroTailor Exception]", "color: #ef4444; font-weight: bold;", err);
        logStep("CRASH", "Failed: " + err.message, "#ef4444");
      }
    }

    startVM();
  </script>
</body>
</html>
`;

  const makefileContent = `# ==============================================================================
# DistroTailor: In-Browser WebAssembly Linux (v86)
# ==============================================================================

PORT ?= 3000
ISO_URL ?= ${V86_ISO_URL}
BIOS_URL ?= ${V86_BIOS_BASE}/bochs-bios.bin
VGABIOS_URL ?= ${V86_BIOS_BASE}/bochs-vgabios.bin

# Pinned SHA-256 checksums (override together with the URLs)
ISO_SHA256 ?= ${V86_ASSET_SHA256.linuxIso}
BIOS_SHA256 ?= ${V86_ASSET_SHA256.bochsBios}
VGABIOS_SHA256 ?= ${V86_ASSET_SHA256.bochsVgaBios}
SHA256SUM ?= $(shell command -v sha256sum >/dev/null 2>&1 && echo sha256sum || echo "shasum -a 256")

.PHONY: all fetch serve clean

all: fetch serve

fetch:
	@if [ ! -f "linux.iso" ]; then \\
		echo "[+] Downloading Linux Live ISO (5.5MB)..."; \\
		curl -fsSL "$(ISO_URL)" -o linux.iso; \\
	fi
	@if [ ! -f "bochs-bios.bin" ]; then \\
		echo "[+] Downloading Bochs BIOS (64KB)..."; \\
		curl -fsSL "$(BIOS_URL)" -o bochs-bios.bin; \\
	fi
	@if [ ! -f "bochs-vgabios.bin" ]; then \\
		echo "[+] Downloading Bochs VGABIOS (42KB)..."; \\
		curl -fsSL "$(VGABIOS_URL)" -o bochs-vgabios.bin; \\
	fi
	@printf '%s  %s\\n' "$(ISO_SHA256)" linux.iso "$(BIOS_SHA256)" bochs-bios.bin "$(VGABIOS_SHA256)" bochs-vgabios.bin | $(SHA256SUM) -c - || \\
		(echo "[-] Checksum mismatch: delete the file(s) above and re-run make, or update the *_SHA256 variables"; exit 1)
	@echo "[✔] All VM binaries verified."

serve: fetch
	@echo "===================================================="
	@echo " DistroTailor WebVM Server Starting..."
	@echo " Open: http://localhost:$(PORT)"
	@echo "===================================================="
	@if command -v npx >/dev/null 2>&1; then \\
		npx serve -p $(PORT) .; \\
	elif command -v python3 >/dev/null 2>&1; then \\
		python3 -m http.server $(PORT); \\
	else \\
		echo "[-] Please install npx or python3 to host local static server."; \\
	fi

clean:
	rm -f linux.iso bochs-bios.bin bochs-vgabios.bin
`;

  const readmeContent = `# In-Browser WebAssembly Linux (v86)

This recipe boots a genuine 32-bit x86 Linux live CD and BusyBox userspace directly in your web browser tab via WebAssembly.

## Quick Start

1. **Download the local Linux ISO & start the web server:**
   \`\`\`bash
   make
   \`\`\`

2. **Open in your browser:**
   \`\`\`text
   http://localhost:3000
   \`\`\`
   Click inside the terminal screen and watch SeaBIOS boot into Linux directly inside your browser!
`;

  return {
    id: 'wasm-browser',
    title: 'In-Browser WebAssembly Linux (v86)',
    summary:
      'Embeds an x86 virtual machine and Linux kernel directly into client-side WebAssembly with zero host installation.',
    targetFormat: 'tarball',
    estimatedBuildTimeMinutes: 1,
    hostDependencies: ['curl', 'npx or python3'],
    files: [
      {
        filename: 'index.html',
        description: 'Single-file WebAssembly emulator loading SeaBIOS and local Linux live ISO',
        content: htmlContent
      },
      {
        filename: 'Makefile',
        description: 'Fetches the 5.5MB Linux live ISO locally and starts the local web server',
        content: makefileContent
      },
      {
        filename: 'README.md',
        description: 'Usage and quickstart instructions',
        content: readmeContent
      }
    ],
    quickstartCommands: [
      'make',
      'open http://localhost:3000'
    ]
  };
}
