import { GeneratedRecipe, UserCriteria } from '../types.js';

export function generateWasmRecipe(criteria: UserCriteria): GeneratedRecipe {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DistroTailor WebVM (v86 in WebAssembly)</title>
  <script src="https://copy.sh/v86/build/libv86.js"></script>
  <style>
    body { font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; }
    #screen_container { background: #000; border-radius: 8px; padding: 10px; width: fit-content; }
    canvas { border: 1px solid #334155; }
  </style>
</head>
<body>
  <h1>DistroTailor: In-Browser WebAssembly Linux</h1>
  <p>Booting x86 Linux kernel entirely in client-side WebAssembly via v86.</p>
  
  <div id="screen_container">
    <div style="white-space: pre; font: 14px monospace; line-height: 14px"></div>
    <canvas style="display: none"></canvas>
  </div>

  <script>
    window.onload = function() {
      const emulator = new V86Starter({
        wasm_path: "https://copy.sh/v86/build/v86.wasm",
        memory_size: 64 * 1024 * 1024,
        vga_memory_size: 2 * 1024 * 1024,
        screen_container: document.getElementById("screen_container"),
        bios: { url: "https://copy.sh/v86/bios/seabios.bin" },
        vga_bios: { url: "https://copy.sh/v86/bios/vgabios.bin" },
        cdrom: { url: "https://copy.sh/v86/images/linux4.iso" },
        autostart: true
      });
    };
  </script>
</body>
</html>
`;

  return {
    id: 'wasm-browser',
    title: 'In-Browser WebAssembly Linux (v86)',
    summary:
      'Embeds an x86 virtual machine and Linux kernel directly into client-side WebAssembly with zero host installation.',
    targetFormat: 'tarball',
    estimatedBuildTimeMinutes: 1,
    hostDependencies: ['modern web browser'],
    files: [
      {
        filename: 'index.html',
        description: 'Single-file WebAssembly emulator loading SeaBIOS and a minimal Linux ISO',
        content: htmlContent
      }
    ],
    quickstartCommands: [
      'npx serve .',
      'open http://localhost:3000'
    ]
  };
}
