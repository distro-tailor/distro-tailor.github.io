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
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .header {
      max-width: 800px;
      width: 100%;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.5rem;
      color: #38bdf8;
      margin: 0 0 0.5rem 0;
    }
    p {
      color: #94a3b8;
      font-size: 0.875rem;
      margin: 0 0 1rem 0;
    }
    #status-bar {
      background: #1e293b;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-size: 0.85rem;
      color: #38bdf8;
      margin-bottom: 1rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border: 1px solid #334155;
    }
    .controls {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    button {
      background: #0284c7;
      color: #fff;
      border: none;
      padding: 0.4rem 0.9rem;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.15s;
    }
    button:hover {
      background: #0369a1;
    }
    #screen_container {
      background: #000;
      border: 2px solid #334155;
      border-radius: 8px;
      padding: 10px;
      box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.7);
      width: fit-content;
      min-width: 640px;
      min-height: 400px;
      cursor: text;
    }
    #screen_container pre, #screen_container div {
      white-space: pre;
      font: 14px "Courier New", monospace;
      line-height: 14px;
      margin: 0;
    }
    canvas {
      border: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🐧 DistroTailor: WebAssembly Linux VM (v86)</h1>
    <p>Running a full x86 Linux kernel and BusyBox userspace directly in client-side WebAssembly.</p>
    
    <div id="status-bar">⏳ Initializing WebAssembly VM...</div>
    
    <div class="controls">
      <button id="btn-fullscreen">⛶ Fullscreen</button>
      <button id="btn-reboot">🔄 Reboot VM</button>
    </div>
  </div>

  <div id="screen_container" tabindex="0" title="Click to interact with Linux terminal">
    <div style="white-space: pre; font: 14px monospace; line-height: 14px"></div>
    <canvas style="display: none"></canvas>
  </div>

  <script type="module">
    import { V86 } from "https://cdn.jsdelivr.net/npm/v86/build/libv86.mjs";

    const statusEl = document.getElementById("status-bar");
    let emulator = null;

    function updateStatus(text, color = "#38bdf8") {
      statusEl.textContent = text;
      statusEl.style.color = color;
    }

    try {
      updateStatus("📦 Loading SeaBIOS and Linux ISO...");
      
      emulator = new V86({
        wasm_path: "https://cdn.jsdelivr.net/npm/v86/build/v86.wasm",
        memory_size: 64 * 1024 * 1024,
        vga_memory_size: 2 * 1024 * 1024,
        screen_container: document.getElementById("screen_container"),
        bios: { url: "https://cdn.jsdelivr.net/npm/v86/bios/seabios.bin" },
        vga_bios: { url: "https://cdn.jsdelivr.net/npm/v86/bios/vgabios.bin" },
        cdrom: { url: "./linux4.iso" },
        autostart: true
      });

      // Track download progress
      emulator.add_listener("download-progress", (e) => {
        if (e && e.total > 0) {
          const pct = Math.round((e.loaded / e.total) * 100);
          updateStatus(\`📥 Downloading \${e.file_name || 'OS image'}: \${pct}%...\`);
        }
      });

      // Fired when WASM is compiled and ready
      emulator.add_listener("emulator-ready", () => {
        updateStatus("✔ VM Ready. SeaBIOS starting... (Click screen to type)", "#4ade80");
      });

      emulator.add_listener("emulator-started", () => {
        updateStatus("🟢 Linux Kernel Booting! Click in screen to send keystrokes.", "#4ade80");
      });

      emulator.add_listener("download-error", (e) => {
        updateStatus("❌ Failed to load linux4.iso. Run 'make fetch' in this directory.", "#f87171");
      });

      // Controls
      document.getElementById("btn-fullscreen")?.addEventListener("click", () => {
        emulator.screen_go_fullscreen();
      });

      document.getElementById("btn-reboot")?.addEventListener("click", () => {
        emulator.restart();
      });

      // Focus screen on click to capture keyboard
      document.getElementById("screen_container")?.addEventListener("click", () => {
        document.getElementById("screen_container")?.focus();
      });

    } catch (err) {
      updateStatus("❌ Error: " + err.message, "#f87171");
      console.error(err);
    }
  </script>
</body>
</html>
`;

  const makefileContent = `# ==============================================================================
# DistroTailor: In-Browser WebAssembly Linux (v86)
# ==============================================================================

PORT ?= 3000
IMAGE_URL ?= https://copy.sh/v86/images/linux4.iso

.PHONY: all fetch serve clean

all: fetch serve

fetch:
	@if [ ! -f "linux4.iso" ]; then \\
		echo "[+] Downloading tiny Linux ISO (7.4MB)..."; \\
		curl -sSL "$(IMAGE_URL)" -o linux4.iso; \\
		echo "[+] linux4.iso downloaded successfully."; \\
	else \\
		echo "[✔] linux4.iso already exists."; \\
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
	rm -f linux4.iso
`;

  const readmeContent = `# In-Browser WebAssembly Linux (v86)

This recipe runs a genuine 32-bit x86 Linux kernel and BusyBox userspace directly in your web browser tab via WebAssembly.

## Quick Start

1. **Download the local Linux image & start the web server:**
   \`\`\`bash
   make
   \`\`\`
   *(Or separately: \`make fetch\` then \`make serve\`)*

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
        description: 'Single-file WebAssembly emulator loading SeaBIOS and local Linux ISO',
        content: htmlContent
      },
      {
        filename: 'Makefile',
        description: 'Fetches the 7.4MB Linux ISO locally and starts the local web server',
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
