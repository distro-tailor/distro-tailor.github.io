/**
 * Extracts the distro packages a generated recipe installs, so scripts/check-packages.ts can
 * verify they exist in the target repository index. Pure functions: no network, easily tested.
 */

export type PackageManager = 'apt' | 'apk';

export interface ExtractedPackage {
  manager: PackageManager;
  name: string;
}

/** Joins shell line continuations so a multi-line install command becomes a single line. */
function joinContinuations(text: string): string {
  return text.replace(/\\\r?\n\s*/g, ' ');
}

const INSTALL_PATTERNS: Array<{ manager: PackageManager; regex: RegExp }> = [
  { manager: 'apt', regex: /apt(?:-get)?\s+install\b([^\n]*)/g },
  { manager: 'apk', regex: /apk\s+add\b([^\n]*)/g }
];

/** Characters that end an install command's package list. */
const COMMAND_END = /(&&|\|\||;|\||>|<)/;

function isPackageToken(token: string): boolean {
  if (!token || token.startsWith('-')) return false;
  // Skip shell and make syntax: variables, quoting, redirects, globs, paths and keywords.
  if (/[$'"`()\\*=<>{}[\]/@:]/.test(token)) return false;
  if (['fi', 'then', 'do', 'done', 'else', 'elif', 'echo'].includes(token)) return false;
  return /^[a-z0-9][a-z0-9+.\-_]*$/.test(token);
}

/** Packages installed by `apt-get install` / `apk add` commands in a recipe file's text. */
export function extractInstalledPackages(text: string): ExtractedPackage[] {
  const joined = joinContinuations(text);
  const found = new Map<string, ExtractedPackage>();
  for (const { manager, regex } of INSTALL_PATTERNS) {
    for (const match of joined.matchAll(regex)) {
      const list = match[1].split(COMMAND_END)[0];
      for (const token of list.split(/\s+/)) {
        if (isPackageToken(token)) found.set(`${manager}:${token}`, { manager, name: token });
      }
    }
  }
  return [...found.values()];
}

/** Packages in a cloud-config `packages:` YAML list. */
export function extractCloudConfigPackages(yaml: string): ExtractedPackage[] {
  const result: ExtractedPackage[] = [];
  const lines = yaml.split('\n');
  const start = lines.findIndex((l) => /^packages:\s*$/.test(l));
  if (start === -1) return result;
  for (const line of lines.slice(start + 1)) {
    const item = line.match(/^\s+-\s+([a-z0-9][a-z0-9+.\-_]*)\s*$/);
    if (!item) break;
    result.push({ manager: 'apt', name: item[1] });
  }
  return result;
}
