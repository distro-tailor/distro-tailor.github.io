import { DesktopAppDefinition, DockerAppDefinition } from '@distro-tailor/core';

export interface DesktopAppCategoryMeta {
  id: DesktopAppDefinition['category'];
  label: string;
  icon: string;
}

export interface DockerAppCategoryMeta {
  id: DockerAppDefinition['category'];
  label: string;
  icon: string;
}

export const DESKTOP_APP_CATEGORIES: readonly DesktopAppCategoryMeta[] = [
  { id: 'browsers', label: 'Browsers', icon: '🌐' },
  { id: 'development', label: 'Development & Languages', icon: '💻' },
  { id: 'media', label: 'Media & Creative', icon: '🎬' },
  { id: 'productivity', label: 'Office & Productivity', icon: '📄' },
  { id: 'gaming', label: 'Gaming & Stores', icon: '🎮' },
  { id: 'utilities', label: 'System, Backup & Networking', icon: '🛠️' }
];

export const DOCKER_APP_CATEGORIES: readonly DockerAppCategoryMeta[] = [
  { id: 'ai', label: 'AI & Machine Learning', icon: '🤖' },
  { id: 'media', label: 'Media & Photos', icon: '🎬' },
  { id: 'cloud', label: 'Cloud, Docs & Wiki', icon: '☁️' },
  { id: 'homelab', label: 'Homelab, Security & Automation', icon: '🏠' },
  { id: 'smart-home', label: 'Smart Home', icon: '🏡' },
  { id: 'web', label: 'Web Publishing & Proxy', icon: '🌐' }
];
