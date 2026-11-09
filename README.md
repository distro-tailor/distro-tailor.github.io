# 🐧 DistroTailor

> **Tailor-made Linux distributions: from 20 questions to a bootable image or custom build recipe.**

Linux spans an immense spectrum: 2MB microcontroller kernels, in-browser WebAssembly VMs, locked-down digital signage kiosks, ultra-lean OCI distroless containers, cloud Kubernetes nodes, and full desktop workstations.

**DistroTailor** bridges high-level user intent with Linux systems engineering. Through an adaptive, constraint-driven questionnaire, it narrows down your requirements to:
1. **The Best Off-The-Shelf Distro:** Verified prebuilt images, cloud AMIs, or container tags with transparent match scores and explanations.
2. **A Custom Build Recipe (Makefile / Config):** When standard distros don't fit, DistroTailor generates a clean, reproducible `Makefile` or builder harness (Debootstrap, Alpine chroot, Buildroot, or multi-stage container) with step-by-step instructions.

---

## 🏗️ Architecture

DistroTailor is built as a hybrid modular monorepo:

- **`@distro-tailor/core`**: The pure TypeScript engine containing:
  - Rich Linux distro taxonomy (embedded, container, immutable, desktop, edge, WASM).
  - Adaptive 20-Questions entropy & constraint reduction algorithm.
  - Turnkey recipe generators (Makefiles, Buildroot configs, Dockerfiles).
- **`@distro-tailor/cli`**: Fast interactive terminal UI (`npx distro-tailor`) and non-interactive JSON API for scripts and AI agents.
- **`@distro-tailor/web`**: Novice-friendly, visual web app running 100% client-side (zero server costs, GitHub Pages deployable).

---

## 📚 Documentation & Specifications

- **[Vision & Goals](docs/01-vision-and-goals.md)**: Product mission, user personas, zero-bloat philosophy, and modular design.
- **[Architecture & System Design](docs/02-architecture.md)**: Matching engine math, recipe generators, and bootloader topologies.
- **[Documentation Portal](docs/README.md)**: Central documentation index.
- **[Living Specifications (Gherkin)](specs/)**: Behavior-driven `.feature` files covering all functional flows.

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

```bash
git clone https://github.com/your-username/distro-tailor.git
cd distro-tailor
npm install
npm run build
```

### Interactive CLI
```bash
npm run cli
```

### Web App
```bash
npm run dev:web
```

---

## 📜 License
MIT License. Built for the open-source Linux community.
