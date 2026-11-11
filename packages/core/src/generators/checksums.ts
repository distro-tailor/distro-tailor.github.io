/**
 * Pinned versions, download URLs, and SHA-256 checksums for artifacts fetched by generated
 * recipes. Recipes run as root, so every download is verified before it is extracted or booted.
 *
 * This file is the single source for these pins: generators interpolate them, and
 * scripts/check-pins.ts (run monthly in CI) re-verifies every URL against its checksum and
 * flags pinned releases that are past their upstream end of support.
 *
 * To bump a version: change it here, copy the new hash from the upstream checksum file noted
 * beside it, then run `npm run check:pins` and `npm test`.
 */

// Alpine Linux mini root filesystem.
// Hashes: <ALPINE_MIRROR>/releases/<arch>/alpine-minirootfs-<version>-<arch>.tar.gz.sha256
export const ALPINE_VERSION = '3.24.4';
export const ALPINE_BRANCH = `v${ALPINE_VERSION.split('.').slice(0, 2).join('.')}`;
export const ALPINE_MIRROR = `https://dl-cdn.alpinelinux.org/alpine/${ALPINE_BRANCH}`;
export type AlpineArch = 'x86_64' | 'aarch64';

export function alpineMinirootfsUrl(arch: AlpineArch): string {
  return `${ALPINE_MIRROR}/releases/${arch}/alpine-minirootfs-${ALPINE_VERSION}-${arch}.tar.gz`;
}

export const ALPINE_MINIROOTFS_SHA256: Readonly<Record<AlpineArch, string>> = {
  x86_64: 'cdaa38cb8de3537967ee5b6c9b6cd00cc962da2b018e6eea48696bb274923012',
  aarch64: '4b14c18f7e90a063b61462ea1462a5732c154bf6adad594974fe6487cd98a8de'
};

// Buildroot source release. Hash: <BUILDROOT_DOWNLOADS>/buildroot-<version>.tar.gz.sign
export const BUILDROOT_VERSION = '2025.02.19';
export const BUILDROOT_DOWNLOADS = 'https://buildroot.org/downloads';
export const BUILDROOT_TARBALL_SHA256 = 'dfcb74dcdc279385933fe28e270ce1c8a530c30b6d632dae0e1c453b8c044c03';

// v86 WebAssembly x86 emulator (npm release on jsDelivr; npm versions are immutable).
export const V86_NPM_VERSION = '0.5.473';
export const V86_CDN = `https://cdn.jsdelivr.net/npm/v86@${V86_NPM_VERSION}/build`;

// v86 BIOS images at a fixed copy/v86 commit (unchanged upstream since 2016/2017).
export const V86_ASSETS_COMMIT = '315b2b0b758703ef0e6cc7b4088d6068f83f3c20';
export const V86_BIOS_BASE = `https://raw.githubusercontent.com/copy/v86/${V86_ASSETS_COMMIT}/bios`;

// v86 demo Linux ISO. Not versioned upstream (Last-Modified 2016-05-25), so the monthly pin
// check is what detects a replacement.
export const V86_ISO_URL = 'https://copy.sh/v86/images/linux.iso';

export const V86_ASSET_SHA256 = {
  bochsBios: '9535026e142f25cca520c2bbddaa7808e4a13d19e2a7a5651e6601e695cba442',
  bochsVgaBios: '8a1caca6760b2997f399403844e2a22b651ec48715f88f709d094f7ae46dd004',
  linuxIso: 'b311d065b9acc17e5bf1dd4d12f06e70efaf2f0d8b2c7be3bbbb25076f494885'
} as const;
