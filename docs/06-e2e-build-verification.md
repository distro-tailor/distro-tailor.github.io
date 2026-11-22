# E2E Build Verification Log

**Last Verified:** `2026-11-22`  
**Host Environment:** macOS (Apple Silicon) + Docker Desktop (`--platform linux/amd64`)  
**Verifier Script:** `npm run verify:families` ([scripts/verify-family-builds.ts](../scripts/verify-family-builds.ts))

---

## Live End-to-End Docker ISO Builds (`make docker-build`)

Each generator below was exported with `{ architecture: 'x86_64', dockerApps: ['pihole'] }` and built inside its official container image via `make docker-build`, producing a verified bootable or provisioning `.iso` artifact in `output/`:

| Recipe Generator | Date Verified | Container Image | Produced Artifact | Status |
| :--- | :--- | :--- | :--- | :--- |
| `debootstrap-debian` | 2026-11-22 | `debian:bookworm` | `output/TailoredDebian-1.0.0-x86_64.iso` | Passed |
| `fedora-dnf` | 2026-11-22 | `fedora:41` | `output/TailoredFedora-41-x86_64.iso` (433 MB) | Passed |
| `opensuse-zypper` | 2026-11-22 | `opensuse/tumbleweed:latest` | `output/TailoredOpenSUSE-Tumbleweed-x86_64.iso` | Passed |
| `void-xbps` | 2026-11-22 | `ghcr.io/void-linux/void-glibc:latest` | `output/TailoredVoid-x86_64.iso` | Passed |
| `arch-pacstrap` | 2026-11-22 | `archlinux:latest` | `output/TailoredArch-x86_64.iso` | Passed |
| `alpine-chroot` | 2026-11-22 | `alpine` | `output/TailoredAlpine-x86_64.tar.gz` | Passed |
| `freebsd-pkg` | 2026-11-22 | `alpine:3.21` (`xorriso` provisioning ISO) | `output/TailoredFreeBSD-amd64.iso` | Passed |
| `openbsd-pkg` | 2026-11-22 | `alpine:3.21` (`xorriso` provisioning ISO) | `output/TailoredOpenBSD-amd64.iso` | Passed |

---

## Dry-Run (`make -n`) & Automated Test Verification

| Scope | Date Verified | Command / Coverage | Status |
| :--- | :--- | :--- | :--- |
| All 9 Family Makefiles (`debootstrap-debian`, `fedora-dnf`, `opensuse-zypper`, `void-xbps`, `arch-pacstrap`, `gentoo-portage`, `freebsd-pkg`, `openbsd-pkg`, `alpine-chroot`) | 2026-11-22 | `npm run verify:families` (`make -n`) | Passed |
| Workspace Unit & Security Tests (all generators, SHA-256 download checks, no hardcoded credentials) | 2026-11-22 | `npm test` (Core, CLI: 10/10, Web: 95/95, Scripts: 21/21) | Passed |
| Scoring Snapshot Regression | 2026-11-22 | `npm run scoring:check` (`12730` criteria cases) | Passed |
| Strict TypeScript Lint | 2026-11-22 | `npm run lint` (`core`, `cli`, `web`, root) | Passed |

### Notes on `gentoo-portage`
- On `2026-11-22`, `gentoo-portage` ran live inside `gentoo/stage3:latest` (`--platform linux/amd64`) through `emerge-webrsync`, GPG key trust setup, `gentoo-kernel-bin`, `wireless-regdb`, `fuse-overlayfs`, and `libmicrohttpd` before catching a `BUILD_DIR` environment leak into `sys-libs/readline`.
- Fixed via `env -u BUILD_DIR emerge ...` in [packages/core/src/generators/gentoo.ts](../packages/core/src/generators/gentoo.ts) and verified via `make -n`, unit tests, and lint (full live re-run not yet re-executed due to Stage3 compile duration under Rosetta).

---

## Reproducing Locally

```bash
# Dry-run Makefile syntax check for all 9 family generators
npm run verify:families

# Live container ISO build verification (requires Docker)
npm run verify:families -- --live

# Live build for specific generators only
npm run verify:families -- --live --only fedora-dnf,void-xbps
```
