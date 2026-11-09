import { GeneratedRecipe, UserCriteria } from '../types.js';

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
      padding: 8px;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.8);
      margin-top: 0.5rem;
      width: fit-content;
      min-width: 640px;
      min-height: 400px;
      position: relative;
    }
    #screen_container {
      cursor: text;
    }
    #screen {
      white-space: pre;
      position: relative;
      font-family: "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace;
      font-weight: 700;
      font-size: 15px;
      line-height: normal;
      color: #fff;
    }
    #vga {
      background-color: #000;
      display: block;
    }
    .blinking-cursor {
      animation: blinking-cursor .6s step-start infinite;
    }
    @keyframes blinking-cursor {
      50% { background-color: transparent; }
    }
    #log-feed {
      margin-top: 1rem;
      max-width: 760px;
      width: 100%;
      background: #0b1120;
      border: 1px solid #1e293b;
      border-radius: 6px;
      padding: 0.5rem 0.8rem;
      font-family: monospace;
      font-size: 11px;
      color: #94a3b8;
      max-height: 120px;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🐧 DistroTailor: WebAssembly Linux VM (v86)</h1>
    <p>Booting Buildroot Linux kernel in client-side WebAssembly.</p>
    
    <div id="status-bar">⏳ Preparing WebAssembly virtual machine...</div>
    
    <div class="controls">
      <button id="btn-fullscreen">⛶ Fullscreen</button>
      <button id="btn-reboot">🔄 Reboot</button>
    </div>
  </div>

  <div class="terminal-wrapper">
    <div id="screen_container">
      <div id="screen"></div>
      <canvas id="vga"></canvas>
    </div>
  </div>

  <div id="log-feed">
    <div style="color: #38bdf8; font-weight: bold; margin-bottom: 2px;">Kernel Activity Feed:</div>
    <div id="log-content">Waiting for CPU boot...</div>
  </div>

  <script type="module">
    console.log("[DistroTailor] Starting WebVM Initialization...");

    const statusEl = document.getElementById("status-bar");
    const screenEl = document.getElementById("screen_container");
    const logContent = document.getElementById("log-content");

    function logStep(stepNum, msg, color) {
      if (!color) color = "#38bdf8";
      const formatted = "[Step " + stepNum + "] " + msg;
      console.log("%c" + formatted, "color: " + color);
      statusEl.textContent = formatted;
      statusEl.style.color = color;
    }

    function appendFeed(text) {
      if (logContent.textContent === "Waiting for CPU boot...") {
        logContent.textContent = "";
      }
      logContent.textContent += text;
      const feed = document.getElementById("log-feed");
      feed.scrollTop = feed.scrollHeight;
    }

    async function fetchBufferWithLog(stepNum, name, url) {
      logStep(stepNum, "Fetching " + name + "... (" + url + ")");
      const startTime = performance.now();
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch " + name + " (" + url + "): HTTP " + res.status + " " + res.statusText);
      }
      const buffer = await res.arrayBuffer();
      const elapsed = Math.round(performance.now() - startTime);
      const sizeMb = (buffer.byteLength / (1024 * 1024)).toFixed(2);
      logStep(stepNum, "Loaded " + name + " (" + sizeMb + " MB) in " + elapsed + "ms", "#4ade80");
      return buffer;
    }

    async function startVM() {
      try {
        logStep("1/5", "Importing V86 engine from CDN...");
        const { V86 } = await import("https://cdn.jsdelivr.net/npm/v86/build/libv86.mjs");
        console.log("[DistroTailor] V86 module loaded successfully:", typeof V86);

        // Pre-fetch all binary assets into memory
        const biosBuffer = await fetchBufferWithLog("2/5", "SeaBIOS", "https://cdn.jsdelivr.net/npm/v86/bios/seabios.bin");
        const vgaBiosBuffer = await fetchBufferWithLog("3/5", "VGABIOS", "https://cdn.jsdelivr.net/npm/v86/bios/vgabios.bin");
        const bzimageBuffer = await fetchBufferWithLog("4/5", "Linux Kernel", "./bzimage.bin");

        logStep("5/5", "Instantiating x86 WebAssembly VM...");
        console.log("[DistroTailor] Creating V86 instance with buffers in memory...");

        const emulator = new V86({
          wasm_path: "https://cdn.jsdelivr.net/npm/v86/build/v86.wasm",
          memory_size: 64 * 1024 * 1024,
          vga_memory_size: 2 * 1024 * 1024,
          screen_container: screenEl,
          screen: {
            container: screenEl,
            use_graphical_text: false
          },
          filesystem: {},
          bios: { buffer: biosBuffer },
          vga_bios: { buffer: vgaBiosBuffer },
          bzimage: { buffer: bzimageBuffer },
          cmdline: "tsc=reliable mitigations=off random.trust_cpu=on",
          disable_speaker: true,
          autostart: true
        });

        console.log("[DistroTailor] V86 instance created! Registering listeners...");

        emulator.add_listener("emulator-ready", () => {
          console.log("%c[DistroTailor Event] emulator-ready fired", "color: #22c55e; font-weight: bold;");
        });

        emulator.add_listener("emulator-loaded", () => {
          console.log("%c[DistroTailor Event] emulator-loaded fired! CPU starting execution...", "color: #22c55e; font-weight: bold;");
          logStep("READY", "🟢 Linux Kernel Booting! Click in terminal to send keys.", "#4ade80");
          appendFeed("[System] CPU core started\\n");
        });

        emulator.add_listener("screen-set-mode", (isGraphical) => {
          console.log("[DistroTailor Event] screen-set-mode:", isGraphical ? "GRAPHICAL (Canvas)" : "TEXT (DOM Div)");
          appendFeed("[Display] Switched to " + (isGraphical ? "Graphical Canvas" : "Text Screen") + "\\n");
        });

        // Capture serial console characters as they stream from Linux kernel
        emulator.add_listener("serial0-output-char", (char) => {
          appendFeed(char);
        });

        emulator.add_listener("download-error", (err) => {
          console.error("%c[DistroTailor Error] download-error:", "color: #f87171;", err);
          logStep("ERROR", "Download error: " + JSON.stringify(err), "#f87171");
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
BZIMAGE_URL ?= https://i.copy.sh/buildroot-bzimage.bin

.PHONY: all fetch serve clean

all: fetch serve

fetch:
	@if [ ! -f "bzimage.bin" ]; then \\
		echo "[+] Downloading Buildroot Linux kernel (5.0MB)..."; \\
		curl -sSL "$(BZIMAGE_URL)" -o bzimage.bin; \\
		echo "[+] bzimage.bin downloaded successfully."; \\
	else \\
		echo "[✔] bzimage.bin already exists."; \\
	fi

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
	rm -f bzimage.bin
`;

  const readmeContent = `# In-Browser WebAssembly Linux (v86)

This recipe boots a genuine 32-bit x86 Buildroot Linux kernel and BusyBox userspace directly in your web browser tab via WebAssembly.

## Quick Start

1. **Download the local Linux kernel & start the web server:**
   \`\`\`bash
   make
   \`\`\`

2. **Open in your browser:**
   \`\`\`text
   http://localhost:3000
   \`\`\`
   Click inside the terminal screen and watch Linux boot directly inside your browser!
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
        description: 'Single-file WebAssembly emulator loading SeaBIOS and local Linux bzImage',
        content: htmlContent
      },
      {
        filename: 'Makefile',
        description: 'Fetches the 5.0MB Linux kernel locally and starts the local web server',
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
