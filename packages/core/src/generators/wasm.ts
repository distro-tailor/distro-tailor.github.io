import { GeneratedRecipe, UserCriteria } from '../types.js';

export function generateWasmRecipe(criteria: UserCriteria): GeneratedRecipe {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DistroTailor WebVM (v86 in WebAssembly)</title>
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
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.8rem;
      color: #38bdf8;
      margin-bottom: 1rem;
      display: inline-block;
    }
    #screen_container {
      background: #000;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6);
      width: fit-content;
      min-width: 640px;
      min-height: 400px;
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
    <div id="status-bar">⏳ Initializing WebAssembly virtual machine...</div>
  </div>

  <div id="screen_container">
    <div style="white-space: pre; font: 14px monospace; line-height: 14px"></div>
    <canvas style="display: none"></canvas>
  </div>

  <script type="module">
    import { V86 } from "https://cdn.jsdelivr.net/npm/v86/build/libv86.mjs";

    const statusEl = document.getElementById("status-bar");

    try {
      statusEl.textContent = "📦 Downloading SeaBIOS and Linux ISO image...";
      
      const emulator = new V86({
        wasm_path: "https://cdn.jsdelivr.net/npm/v86/build/v86.wasm",
        memory_size: 64 * 1024 * 1024,
        vga_memory_size: 2 * 1024 * 1024,
        screen_container: document.getElementById("screen_container"),
        bios: { url: "https://cdn.jsdelivr.net/npm/v86/bios/seabios.bin" },
        vga_bios: { url: "https://cdn.jsdelivr.net/npm/v86/bios/vgabios.bin" },
        cdrom: { url: "./linux4.iso" },
        autostart: true
      });

      emulator.add_listener("emulator-ready", () => {
        statusEl.textContent = "✔ Linux VM Booting in WebAssembly! Click inside terminal to type.";
        statusEl.style.color = "#4ade80";
      });

      emulator.add_listener("download-error", (e) => {
        statusEl.textContent = "❌ Failed to load linux4.iso. Did you run 'make fetch' to download it locally?";
        statusEl.style.color = "#f87171";
      });
    } catch (err) {
      statusEl.textContent = "❌ Error: " + err.message;
      statusEl.style.color = "#f87171";
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
