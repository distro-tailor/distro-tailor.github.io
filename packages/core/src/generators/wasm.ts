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
      max-width: 720px;
      width: 100%;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.4rem;
      color: #38bdf8;
      margin: 0 0 0.4rem 0;
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
      margin-top: 0.5rem;
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
      padding: 6px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
      margin-top: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🐧 DistroTailor: WebAssembly Linux VM (v86)</h1>
    <p>Booting a genuine x86 Linux kernel and BusyBox environment in WebAssembly.</p>
    
    <div id="status-bar">⏳ Preparing WebAssembly virtual machine...</div>
    
    <div class="controls">
      <button id="btn-fullscreen">⛶ Fullscreen</button>
      <button id="btn-reboot">🔄 Reboot</button>
    </div>
  </div>

  <div class="terminal-wrapper">
    <div id="screen_container">
      <div style="white-space: pre; font: 14px monospace; line-height: 14px"></div>
      <canvas style="display: none"></canvas>
    </div>
  </div>

  <script type="module">
    import { V86 } from "https://cdn.jsdelivr.net/npm/v86/build/libv86.mjs";

    const statusEl = document.getElementById("status-bar");
    let emulator = null;

    function setStatus(text, color = "#38bdf8") {
      statusEl.textContent = text;
      statusEl.style.color = color;
    }

    try {
      setStatus("📦 Loading SeaBIOS and Linux image (7.4 MB)...");
      
      emulator = new V86({
        wasm_path: "https://cdn.jsdelivr.net/npm/v86/build/v86.wasm",
        memory_size: 64 * 1024 * 1024,
        vga_memory_size: 2 * 1024 * 1024,
        screen_container: document.getElementById("screen_container"),
        bios: { url: "https://cdn.jsdelivr.net/npm/v86/bios/seabios.bin" },
        vga_bios: { url: "https://cdn.jsdelivr.net/npm/v86/bios/vgabios.bin" },
        cdrom: {
          url: "./linux4.iso",
          size: 7712768,
          async: false
        },
        disable_speaker: true,
        autostart: true
      });

      emulator.add_listener("download-progress", (e) => {
        if (e && e.total > 0) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setStatus(\`📥 Downloading \${e.file_name || 'assets'}: \${pct}%\`);
        }
      });

      emulator.add_listener("emulator-ready", () => {
        setStatus("🟢 SeaBIOS Starting! Linux kernel decompressing...", "#4ade80");
      });

      emulator.add_listener("download-error", (e) => {
        setStatus("❌ Failed to load linux4.iso. Run 'make fetch' in this folder.", "#f87171");
      });

      document.getElementById("btn-fullscreen")?.addEventListener("click", () => {
        emulator.screen_go_fullscreen();
      });

      document.getElementById("btn-reboot")?.addEventListener("click", () => {
        emulator.restart();
      });

    } catch (err) {
      setStatus("❌ " + err.message, "#f87171");
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
