/**
 * Pinned SHA-256 checksums for artifacts downloaded by generated recipes.
 * Recipes run as root, so every download is verified before it is extracted or executed.
 *
 * Sources (re-check when bumping a version):
 * - Alpine: https://dl-cdn.alpinelinux.org/alpine/v3.20/releases/<arch>/alpine-minirootfs-3.20.0-<arch>.tar.gz.sha256
 * - Buildroot: https://buildroot.org/downloads/buildroot-2024.02.1.tar.gz.sign
 * - v86 BIOS: copy/v86 at V86_ASSETS_COMMIT (files unchanged since 2016/2017)
 * - v86 Linux ISO: https://copy.sh/v86/images/linux.iso (Last-Modified 2016-05-25)
 */

export const ALPINE_MINIROOTFS_SHA256: Readonly<Record<'x86_64' | 'aarch64', string>> = {
  x86_64: '602efda518516787c716320bd46a3f50e83a74bb749e55483c2f4a9c9f8b9a38',
  aarch64: '83a79199bf3112c65e62ddf1732b051daf62ed2ddf5a8413c440dc25956116f0'
};

export const BUILDROOT_TARBALL_SHA256 = '7ebc1aab9f5eec758f47de0f902a5efff249771b9581e3419df212d8095a1182';

/** v86 npm release served from jsDelivr (pinned instead of floating "latest"). */
export const V86_NPM_VERSION = '0.5.473';
/** copy/v86 commit the BIOS images are fetched from (pinned instead of "master"). */
export const V86_ASSETS_COMMIT = '315b2b0b758703ef0e6cc7b4088d6068f83f3c20';

export const V86_ASSET_SHA256 = {
  bochsBios: '9535026e142f25cca520c2bbddaa7808e4a13d19e2a7a5651e6601e695cba442',
  bochsVgaBios: '8a1caca6760b2997f399403844e2a22b651ec48715f88f709d094f7ae46dd004',
  linuxIso: 'b311d065b9acc17e5bf1dd4d12f06e70efaf2f0d8b2c7be3bbbb25076f494885'
} as const;
