# 🛡️ DistroTailor: Red Team Architectural & Security Audit Tracker

**Date:** 2026-11-09  
**Audit Scope:** `@distro-tailor/core`, `@distro-tailor/web`, `@distro-tailor/cli`  
**Review Status:** Complete (All 14 Findings Remediated & Verified)

---

## Remediation Progress Dashboard

- [x] **P0.1: Reflected DOM XSS Sanitization in Web UI** (Resolved: escaped dynamic labels & query params)
- [x] **P0.2: Debootstrap ISO Bootability (live-boot & mksquashfs)** (Resolved: installed live-boot and compressed rootfs to `iso/live/filesystem.squashfs`)
- [x] **P0.3: Cloud-Init QCOW2 Disk Bootability & Compose Staging** (Resolved: staged compose file to `/opt/<app>` and partitioned MBR)
- [x] **P0.4: Alpine Linux Package Manager Compatibility (`apk` vs `apt-get`)** (Resolved: multi-package manager detection for apk, apt, dnf, pacman)
- [x] **P0.5: Shell & Makefile Command Injection Hardening** (Resolved: extracted app-start.sh into dedicated recipe file and quoted variables)
- [x] **P0.6: Circuit Breaker False-Positive De-escalation** (Resolved: removed saveStateToUrl from render and raised safety threshold)
- [x] **P0.7: Back Button & In-Memory History Synchronization** (Resolved: in-app history depth tracking and local question undo)
- [x] **P1.1: RAM Budget Hardware Enforcement in Matcher** (Resolved: checks `criteria.maxRamMb` vs `distro.minRamMb`)
- [x] **P1.2: CPU Architecture Hard-Gate Disqualification (score = 0)** (Resolved: binary gate sets score = 0 for incompatible arch)
- [x] **P1.3: Deterministic & Fact-Based Tie-Breaking** (Resolved: secondary sorting on flagship useCase, min RAM, experience level, name)
- [x] **P1.4: Fix Question ID Typo in Chip Deletion & Flow Mode Toggle** (Resolved: corrected to `'user_familiarity'` and `'system_immutability'`)
- [x] **P1.5: Fix Taxonomy UI Typos (`uclibc-ng`, missing State Models)** (Resolved: added `'uclibc-ng'`, `'mutable'`, `'declarative'`, `'stateless-ram'`)
- [x] **P2.1: Add `tsconfig.json` & Typecheck to `@distro-tailor/web`** (Resolved: added tsconfig.json and verified tsc --noEmit in build)
- [x] **P2.2: Unify URL Deserialization across Web & CLI (Prevent Dropping Modifiers)** (Resolved: shared `deserializeCriteriaFromParams` in core)
- [x] **Final Red Team Re-Audit & Verification** (Passed: full test suite, build, and source inspection confirmed clean)

---

## Detailed Findings & Target Solutions

### 🚨 P0: Critical Security & Functional Deficiencies

#### P0.1 Reflected DOM Cross-Site Scripting (XSS) via Query String
* **Files:** `packages/web/src/main.ts`
* **Vulnerability:** Unmapped URL query parameters parsed by `loadStateFromUrl()` fall through `formatConstraint()` into raw `{ label: \`${key}: \${value}\` }` and are directly interpolated into `app.innerHTML` without `escapeHtml()`.
* **Fix:** Enforce `escapeHtml()` on all dynamic labels and validate query parameters against whitelist of criteria.

#### P0.2 Debootstrap ISO Bootability (`live-boot` & `mksquashfs`)
* **Files:** `packages/core/src/generators/debootstrap.ts`
* **Vulnerability:** `mksquashfs` is declared in Makefile variables but never executed; `live-boot` is not installed; ISO crashes with `Kernel panic: Unable to find a medium containing a live file system`.
* **Fix:** Install `live-boot` in debootstrap chroot, compress rootfs to `iso/live/filesystem.squashfs`, and configure GRUB live boot parameters.

#### P0.3 Cloud-Init QCOW2 Disk Bootability & Compose Staging
* **Files:** `packages/core/src/generators/cloud-init.ts`
* **Vulnerability:** `virt-make-fs` creates an unpartitioned raw ext4 image inside QCOW2 with no partition table or bootloader (SeaBIOS halts: `No bootable device`). `docker-compose.yml` is also never staged into the image.
* **Fix:** Stage `docker-compose.yml` into `/opt/<app>` before sealing; configure bootable partitioning or provide standard bootable VM disk image construction.

#### P0.4 Alpine Linux Package Manager Compatibility
* **Files:** `packages/core/src/generators/desktop-apps.ts`, `packages/core/src/generators/alpine.ts`
* **Vulnerability:** `bootstrap-apps.sh` hardcodes `apt-get` commands, which fail immediately in Alpine's musl/apk environment.
* **Fix:** Support `apk add` package installation in `bootstrap-apps.sh` when targeting Alpine.

#### P0.5 Shell & Makefile Command Injection Hardening
* **Files:** `packages/core/src/generators/kiosk.ts`, `packages/core/src/generators/debootstrap.ts`
* **Vulnerability:** Variables like `APP_CMD` and `DOCKER_APP` are echoed directly into bash chroot scripts without shell escaping.
* **Fix:** Properly quote variables and sanitize identifiers.

#### P0.6 Circuit Breaker False-Positive De-escalation
* **Files:** `packages/web/src/main.ts`
* **Vulnerability:** `saveStateToUrl()` is called redundantly inside `render()` and before `render()`. Fast clicking or keyboard use logs >25 transitions in 2s, wiping state to Question 1.
* **Fix:** Remove `saveStateToUrl()` from `render()`, only track actual user-initiated transitions, and increase safety threshold.

#### P0.7 Back Button & In-Memory History Synchronization
* **Files:** `packages/web/src/main.ts`
* **Vulnerability:** `#btn-back` checks `window.history.length > 1`, navigating users offsite to Google/Reddit, or clearing criteria on shared links.
* **Fix:** Track in-app navigation depth cleanly and step back internal history safely without ejecting the user from the app.

---

### ⚠️ P1: Algorithmic & Taxonomy Deficiencies

#### P1.1 RAM Constraints Hardware Evaluation in Matcher
* **Files:** `packages/core/src/engine/matcher.ts`
* **Vulnerability:** `criteria.maxRamMb` is collected in Question 4 but never compared against `distro.minRamMb`. Heavyweight distros (4GB+) are recommended for 512MB PCs.
* **Fix:** Evaluate `criteria.maxRamMb` against `distro.minRamMb`; penalize or disqualify distros that exceed the available RAM budget.

#### P1.2 CPU Architecture Hard-Gate Disqualification
* **Files:** `packages/core/src/engine/matcher.ts`
* **Vulnerability:** Architecture mismatch is penalized -40 instead of acting as a binary fatal disqualifier.
* **Fix:** Incompatible CPU architectures immediately set `score = 0` and mark `matched: false`.

#### P1.3 Deterministic Tie-Breaking
* **Files:** `packages/core/src/engine/matcher.ts`
* **Vulnerability:** When scores tie at 100%, array declaration order decides the winner.
* **Fix:** Introduce secondary tie-breakers (e.g. flagship use case alignment, footprint precision, documentation depth) instead of arbitrary array order.

#### P1.4 Ghost Question IDs in Filter Chip Removal & Mode Toggles
* **Files:** `packages/web/src/main.ts`
* **Vulnerability:** Attempting to delete nonexistent IDs `'beginner_experience'` and `'immutability_and_state'` leaves questions locked in `answeredQuestionIds`.
* **Fix:** Correct to `'user_familiarity'` and `'system_immutability'`.

#### P1.5 Taxonomy UI Typos & Missing State Models
* **Files:** `packages/web/src/main.ts`
* **Vulnerability:** Keyed as `'uclibc'` instead of `'uclibc-ng'`; missing `'mutable'`, `'declarative'`, `'stateless-ram'`.
* **Fix:** Update key mappings to match `types.ts`.

---

### 📦 P2: Monorepo Architecture & Code Quality

#### P2.1 Add `tsconfig.json` & Typecheck to `@distro-tailor/web`
* **Files:** `packages/web/tsconfig.json`, `packages/web/package.json`
* **Defect:** `web` has no type-checking in `npm run build`.
* **Fix:** Add `tsconfig.json` and a `typecheck` script to `packages/web`.

#### P2.2 Unify URL Deserialization across Web & CLI
* **Files:** `packages/cli/src/index.ts`, `packages/core/src/migrations/url-schema.ts`
* **Defect:** CLI `--url` drops interactive modifiers (`dockerApp`, `desktopApps`, `desktopEnv`).
* **Fix:** Move parameter parsing into `@distro-tailor/core` so both Web and CLI parse all parameters identically.
