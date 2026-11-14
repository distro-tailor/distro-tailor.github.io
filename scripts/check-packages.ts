/**
 * Verifies that every distro package installed by a generated recipe exists in the target
 * repository, so a typo or a package that lives in a different component (for example Debian
 * "contrib") is caught before users hit a failed build.
 *
 *   npm run check:packages
 *
 * Recipes are generated for every single criteria value, on x86_64 and arm64, plus a "kitchen
 * sink" combination. Their `apt-get install` / `apk add` / cloud-config package lists are
 * compared with the Debian bookworm and Alpine indexes. Exits 1 when a package is missing for
 * an architecture or is only available outside Debian's default "main" component.
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { gunzipSync } from 'node:zlib';
import * as core from '../packages/core/src/index.js';
import type { RecipeGeneratorId, UserCriteria } from '../packages/core/src/index.js';
import { ALPINE_BRANCH, ALPINE_MIRROR } from '../packages/core/src/generators/checksums.js';
import { ExtractedPackage, extractCloudConfigPackages, extractInstalledPackages } from './package-extract.js';

const DEBIAN_MIRROR = 'https://deb.debian.org/debian';
const DEBIAN_SUITE = 'bookworm';
const DEBIAN_COMPONENTS = ['main', 'contrib', 'non-free', 'non-free-firmware'] as const;
const DEBIAN_ARCHES = { x86_64: 'amd64', arm64: 'arm64' } as const;
const ALPINE_ARCHES = { x86_64: 'x86_64', arm64: 'aarch64' } as const;
const ALPINE_REPOS = ['main', 'community'] as const;
const FETCH_ATTEMPTS = 3;

type Arch = keyof typeof DEBIAN_ARCHES;

interface Finding {
  recipe: string;
  arch: Arch;
  manager: 'apt' | 'apk';
  name: string;
  problem: 'missing' | 'not-in-main';
  detail: string;
}

async function download(url: string): Promise<Buffer> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Failed to download ${url}: ${String(lastError)}`);
}

/** Debian: package name (and "Provides") -> components that contain it. */
async function loadDebianIndex(arch: string): Promise<Map<string, Set<string>>> {
  const index = new Map<string, Set<string>>();
  const add = (name: string, component: string) => {
    if (!index.has(name)) index.set(name, new Set());
    index.get(name)!.add(component);
  };
  for (const component of DEBIAN_COMPONENTS) {
    const url = `${DEBIAN_MIRROR}/dists/${DEBIAN_SUITE}/${component}/binary-${arch}/Packages.gz`;
    let text: string;
    try {
      text = gunzipSync(await download(url)).toString('utf8');
    } catch {
      continue; // a component may have no index for this architecture
    }
    for (const stanza of text.split('\n\n')) {
      const name = stanza.match(/^Package: (.+)$/m)?.[1];
      if (!name) continue;
      add(name, component);
      const provides = stanza.match(/^Provides: (.+)$/m)?.[1];
      for (const entry of provides?.split(',') ?? []) {
        const provided = entry.trim().split(/[\s(]/)[0];
        if (provided) add(provided, component);
      }
    }
  }
  return index;
}

/** Alpine: package name, provided names, and shared-object/command aliases. */
async function loadAlpineIndex(arch: string): Promise<Set<string>> {
  const names = new Set<string>();
  for (const repo of ALPINE_REPOS) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'distro-tailor-apkindex-'));
    try {
      const file = path.join(tmp, 'APKINDEX.tar.gz');
      fs.writeFileSync(file, await download(`${ALPINE_MIRROR}/${repo}/${arch}/APKINDEX.tar.gz`));
      const text = execFileSync('tar', ['-xzOf', file, 'APKINDEX'], { maxBuffer: 256 * 1024 * 1024 }).toString('utf8');
      for (const line of text.split('\n')) {
        if (line.startsWith('P:')) names.add(line.slice(2));
        if (line.startsWith('p:')) {
          for (const provided of line.slice(2).split(' ')) names.add(provided.split(/[=<>~]/)[0]);
        }
      }
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }
  return names;
}

function criteriaCases(arch: Arch): UserCriteria[] {
  const values = (catalog: object) => Object.keys(catalog);
  const singles: Record<string, string[]> = {
    useCase: values(core.USE_CASE_VALUES),
    platform: values(core.PLATFORM_VALUES),
    formFactor: values(core.FORM_FACTOR_VALUES),
    desktopEnv: values(core.DESKTOP_ENV_VALUES),
    dockerApp: values(core.DOCKER_APP_VALUES),
    fileSystem: values(core.FILESYSTEM_VALUES),
    kernelFlavor: values(core.KERNEL_FLAVOR_VALUES),
    bootloader: values(core.BOOTLOADER_VALUES),
    securityProfile: values(core.SECURITY_PROFILE_VALUES),
    networkingStack: values(core.NETWORKING_STACK_VALUES),
    firmwareMode: values(core.FIRMWARE_MODE_VALUES),
    secureBoot: values(core.SECURE_BOOT_VALUES),
    tpmUsage: values(core.TPM_USAGE_VALUES),
    virtHost: values(core.VIRT_HOST_VALUES),
    devicePassthrough: values(core.DEVICE_PASSTHROUGH_VALUES),
    guestPlatform: values(core.GUEST_PLATFORM_VALUES)
  };
  const cases: UserCriteria[] = [{ architecture: arch }];
  for (const [key, options] of Object.entries(singles)) {
    for (const value of options) cases.push({ architecture: arch, [key]: value } as UserCriteria);
  }
  cases.push({
    architecture: arch,
    prefersGui: true,
    desktopEnv: 'kde',
    enableDistrobox: true,
    enableFlatpak: true,
    enableNix: true,
    formFactor: 'laptop',
    desktopApps: values(core.DESKTOP_APP_VALUES) as UserCriteria['desktopApps'],
    emulatorApps: values(core.EMULATOR_APP_VALUES) as UserCriteria['emulatorApps'],
    navigationApps: values(core.NAVIGATION_APP_VALUES) as UserCriteria['navigationApps']
  });
  for (const formFactor of ['handheld', 'low-power', 'mac'] as const) {
    cases.push({ architecture: arch, formFactor });
  }
  for (const desktopEnv of ['cage', 'xfce', 'gnome'] as const) {
    cases.push({ architecture: arch, desktopEnv, prefersGui: true });
  }
  return cases;
}

function packagesOf(id: RecipeGeneratorId, criteria: UserCriteria): { packages: ExtractedPackage[]; enablesContrib: boolean } {
  const recipe = core.RECIPE_GENERATORS[id](criteria);
  const packages: ExtractedPackage[] = [];
  let enablesContrib = false;
  for (const file of recipe.files) {
    packages.push(...extractInstalledPackages(file.content));
    if (file.filename === 'user-data') packages.push(...extractCloudConfigPackages(file.content));
    if (/\bmain contrib\b/.test(file.content)) enablesContrib = true;
  }
  return { packages, enablesContrib };
}

async function main(): Promise<void> {
  const findings: Finding[] = [];
  const checked = new Set<string>();
  const generatorIds = Object.keys(core.RECIPE_GENERATORS) as RecipeGeneratorId[];

  for (const arch of Object.keys(DEBIAN_ARCHES) as Arch[]) {
    console.log(`Loading ${arch} package indexes (Debian ${DEBIAN_SUITE}, Alpine ${ALPINE_BRANCH})...`);
    const debian = await loadDebianIndex(DEBIAN_ARCHES[arch]);
    const alpine = await loadAlpineIndex(ALPINE_ARCHES[arch]);

    for (const id of generatorIds) {
      const seen = new Set<string>();
      for (const criteria of criteriaCases(arch)) {
        const { packages, enablesContrib } = packagesOf(id, criteria);
        for (const pkg of packages) {
          const key = `${pkg.manager}:${pkg.name}`;
          if (seen.has(key)) continue;
          seen.add(key);
          checked.add(`${arch}:${key}`);

          if (pkg.manager === 'apt') {
            const components = debian.get(pkg.name);
            if (!components) {
              findings.push({ recipe: id, arch, manager: 'apt', name: pkg.name, problem: 'missing', detail: `not in Debian ${DEBIAN_SUITE}/${arch}` });
            } else if (!components.has('main') && !(enablesContrib && components.has('contrib'))) {
              findings.push({ recipe: id, arch, manager: 'apt', name: pkg.name, problem: 'not-in-main', detail: `only in ${[...components].join(', ')} (not enabled by default)` });
            }
          } else if (!alpine.has(pkg.name)) {
            findings.push({ recipe: id, arch, manager: 'apk', name: pkg.name, problem: 'missing', detail: `not in Alpine ${ALPINE_BRANCH}/${ALPINE_ARCHES[arch]} main or community` });
          }
        }
      }
    }
  }

  const lines = [`# Recipe package check`, '', `Checked ${checked.size} package/architecture pairs.`, ''];
  if (findings.length === 0) {
    lines.push('All packages exist in their target repositories.');
  } else {
    lines.push('| Recipe | Arch | Manager | Package | Problem |', '| :--- | :--- | :--- | :--- | :--- |');
    for (const f of findings) lines.push(`| ${f.recipe} | ${f.arch} | ${f.manager} | \`${f.name}\` | ${f.detail} |`);
  }
  const report = lines.join('\n') + '\n';
  console.log('\n' + report);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
  process.exit(findings.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
