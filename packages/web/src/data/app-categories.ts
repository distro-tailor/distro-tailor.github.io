import {
  DesktopAppDefinition,
  DockerAppDefinition,
  EmulatorAppDefinition,
  UserCriteria
} from '@distro-tailor/core';

export interface AppCategoryMeta<T extends string = string> {
  id: T;
  label: string;
  icon: string;
}

export const DESKTOP_APP_CATEGORIES: readonly AppCategoryMeta<DesktopAppDefinition['category']>[] = [
  { id: 'browsers', label: 'Browsers', icon: '🌐' },
  { id: 'development', label: 'Development & Languages', icon: '💻' },
  { id: 'media', label: 'Media & Creative', icon: '🎬' },
  { id: 'productivity', label: 'Office & Productivity', icon: '📄' },
  { id: 'gaming', label: 'Gaming & Stores', icon: '🎮' },
  { id: 'utilities', label: 'System, Backup & Networking', icon: '🛠️' }
];

export const DOCKER_APP_CATEGORIES: readonly AppCategoryMeta<DockerAppDefinition['category']>[] = [
  { id: 'ai', label: 'AI & Machine Learning', icon: '🤖' },
  { id: 'media', label: 'Media & Photos', icon: '🎬' },
  { id: 'cloud', label: 'Cloud, Docs & Wiki', icon: '☁️' },
  { id: 'homelab', label: 'Homelab, Security & Automation', icon: '🏠' },
  { id: 'smart-home', label: 'Smart Home', icon: '🏡' },
  { id: 'web', label: 'Web Publishing & Proxy', icon: '🌐' }
];

export const EMULATOR_APP_CATEGORIES: readonly AppCategoryMeta<EmulatorAppDefinition['category']>[] = [
  { id: 'multi-system', label: 'Multi-System', icon: '🕹️' },
  { id: 'console', label: 'Consoles', icon: '🎮' },
  { id: 'handheld', label: 'Handhelds', icon: '📟' },
  { id: 'arcade', label: 'Arcade', icon: '👾' },
  { id: 'retro-pc', label: 'Retro PC', icon: '💾' },
  { id: 'compatibility', label: 'Windows & Android', icon: '🪟' },
  { id: 'system', label: 'Cross-Arch & VM', icon: '🧬' }
];

export function getDefaultDesktopCategory(criteria: UserCriteria): DesktopAppDefinition['category'] {
  if (criteria.useCase === 'gaming') return 'gaming';
  if (criteria.desktopApps?.includes('vscode') || criteria.useCase === 'server') return 'development';
  if (criteria.useCase === 'home-office') return 'productivity';
  return 'browsers';
}

export function getDefaultDockerCategory(criteria: UserCriteria): DockerAppDefinition['category'] {
  if (criteria.useCase === 'ai-gpu-compute') return 'ai';
  return 'homelab';
}

export function getDefaultEmulatorCategory(criteria: UserCriteria): EmulatorAppDefinition['category'] {
  if (criteria.useCase === 'gaming') return 'multi-system';
  return 'compatibility';
}
