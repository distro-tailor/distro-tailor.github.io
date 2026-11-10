import { DesktopEnvId, UserCriteria } from '@distro-tailor/core';

/**
 * Standard list of display servers and Wayland compositors supported by Makefile generation.
 */
export const SUPPORTED_DESKTOP_ENVS: DesktopEnvId[] = ['none', 'cage', 'xfce', 'kde', 'gnome'];

const SERVER_PLATFORMS = new Set<string>([
  'server',
  'vm',
  'container',
  'k8s-node',
  'router-firewall',
  'microcontroller'
]);

const SERVER_USE_CASES = new Set<string>([
  'server',
  'nas-storage',
  'smart-home',
  'hypervisor-vms',
  'k8s-cluster',
  'container-base',
  'router-networking',
  'iot-embedded'
]);

/**
 * Determines whether the user's tailored configuration represents a headless,
 * server, container, or network-appliance context (as opposed to an interactive desktop/gaming workstation).
 * Used to determine the visual hierarchy of Docker Turnkey Services vs Desktop App suites.
 */
export function isServerContext(criteria: UserCriteria): boolean {
  if (criteria.prefersGui === false) return true;
  if (criteria.platform && SERVER_PLATFORMS.has(criteria.platform)) return true;
  if (criteria.useCase && SERVER_USE_CASES.has(criteria.useCase)) return true;
  return false;
}
