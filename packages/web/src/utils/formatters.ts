import { DOCKER_APP_VALUES, getDockerApp, isCatalogValue, RecommendationOutput, UserCriteria } from '@distro-tailor/core';
import { CONSTRAINT_DICTIONARY, type FormattedConstraint } from '../data/constraint-dictionary.js';
import { escapeHtml } from './dom.js';

export type { FormattedConstraint };

/**
 * Returns user-friendly human label and emoji icon for any constraint key and value.
 * Safely sanitizes dynamic user-supplied or unknown inputs using escapeHtml.
 */
export function formatConstraint(key: string, value: unknown): FormattedConstraint {
  if (key === 'maxRamMb') {
    return { label: `${Number(value) || 0} MB RAM`, icon: '🧠' };
  }
  if (key === 'prefersGui') {
    return { label: value ? 'Graphical Desktop (GUI)' : 'Headless / Terminal Only', icon: value ? '🖼️' : '⌨️' };
  }
  if (key === 'realtimeAudio') {
    return {
      label: value ? 'Pro Audio (Low-Latency Realtime Kernel)' : 'Standard Everyday Audio',
      icon: value ? '🎵' : '🔊'
    };
  }
  if (key === 'requiresCustomBuild') {
    return { label: value ? 'Custom Build Recipe Required' : 'Prebuilt ISO Preferred', icon: '🛠️' };
  }
  if (key === 'dockerApp') {
    const app = isCatalogValue(DOCKER_APP_VALUES, value) ? getDockerApp(value) : undefined;
    return {
      label: app ? `Docker: ${app.name}` : `Docker: ${escapeHtml(String(value))}`,
      icon: app ? app.icon : '🐳'
    };
  }
  if (key === 'desktopApps') {
    const list = Array.isArray(value) ? value : String(value).split(',').filter(Boolean);
    return { label: `Desktop Apps: ${list.length} selected`, icon: '📦' };
  }
  if (key === 'emulatorApps') {
    const list = Array.isArray(value) ? value : String(value).split(',').filter(Boolean);
    return { label: `Emulators: ${list.length} selected`, icon: '🎮' };
  }
  if (key === 'desktopEnv') {
    return { label: `Desktop: ${escapeHtml(String(value)).toUpperCase()}`, icon: '🖼️' };
  }
  if (key === 'enableDistrobox') {
    return { label: value ? 'Distrobox (Arch AUR)' : 'Native Only', icon: '🏛️' };
  }
  if (key === 'enableNix') {
    return { label: value ? 'Nix Package Layer' : 'No Nix', icon: '❄️' };
  }
  if (key === 'enableFlatpak') {
    return { label: value ? 'Flatpak Sandbox' : 'No Flatpak', icon: '📦' };
  }
  if (key === 'peripherals') {
    const list = Array.isArray(value) ? value : String(value).split(',').filter(Boolean);
    const nonStd = list.filter((p: string) => p !== 'standard');
    if (nonStd.length === 0) {
      return { label: 'Standard Mouse & Screen', icon: '🖥️' };
    }
    const labels = nonStd.map((p: string) => CONSTRAINT_DICTIONARY.peripheralNeed?.[p]?.label || p);
    return {
      label: `Peripherals: ${labels.join(', ')}`,
      icon: '🔌'
    };
  }

  const strVal = String(value);
  if (CONSTRAINT_DICTIONARY[key] && CONSTRAINT_DICTIONARY[key][strVal]) {
    return CONSTRAINT_DICTIONARY[key][strVal];
  }
  return { label: escapeHtml(`${key}: ${strVal}`), icon: '📌' };
}

/**
 * Generates formatted markdown text suitable for copying to Reddit, GitHub, or Discord.
 */
export function generateMarkdownSummary(
  evaluation: RecommendationOutput,
  criteria: UserCriteria = {},
  shareUrl?: string
): string {
  const best = evaluation.bestMatch;
  const url = shareUrl || (typeof window !== 'undefined' ? window.location.href : 'https://distrotailor.dev');
  const constraintsList = Object.entries(criteria)
    .map(([k, v]) => `• ${formatConstraint(k, v).icon} ${formatConstraint(k, v).label}`)
    .join('\n');

  return `🐧 **DistroTailor Recommendation: ${best.distro.name} (${best.score}% Match)**
*${best.distro.tagline}*

**Tailored Configuration:**
${constraintsList || '• Default profile'}

**Key Highlights:**
${best.distro.highlights.map((h) => `• ${h}`).join('\n')}

🔗 **View or customize this build:**
${url}`;
}

/** Formats the two-tier OS family and kernel paradigm into a badge label. */
export function formatOsEcosystem(distro: { osFamily?: string; kernelModel?: string }): string {
  const family = distro.osFamily || 'linux';
  const model = distro.kernelModel || 'monolithic-linux';

  const familyLabels: Record<string, string> = {
    linux: 'Linux',
    bsd: 'BSD',
    independent: 'Independent'
  };

  const modelLabels: Record<string, string> = {
    'monolithic-linux': 'Monolithic',
    'monolithic-bsd': 'Monolithic Unix',
    illumos: 'Illumos / Solaris',
    'hybrid-nt': 'Win32 / NT',
    'beos-modular': 'BeOS C++',
    'realmode-dos': '16-bit DOS',
    microkernel: 'Microkernel'
  };

  const fam = familyLabels[family] || family;
  const mod = modelLabels[model] || model;
  return `${fam} · ${mod}`;
}

