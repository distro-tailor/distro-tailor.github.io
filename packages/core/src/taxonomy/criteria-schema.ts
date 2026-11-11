import {
  BootMedium,
  CLibrary,
  CpuArchitecture,
  DesktopAppId,
  DesktopEnvId,
  DesktopWorkflowStyle,
  DockerAppId,
  DriverPhilosophy,
  EmulatorAppId,
  ExperienceLevel,
  FormFactor,
  InitSystem,
  PeripheralNeed,
  PlatformTarget,
  PrimaryUseCase,
  ReleaseCadence,
  StateModel,
  StorageFootprint,
  UserCriteria
} from '../types.js';

/**
 * Runtime allowlists for every enumerated UserCriteria field.
 * Typed as Record<Union, true> so the compiler fails if a union member is added or removed
 * without updating the matching catalog.
 *
 * Criteria values are interpolated verbatim into generated Makefiles and shell scripts,
 * so anything arriving from a shared URL, CLI flag, or JSON payload must pass through
 * sanitizeCriteria() before reaching a recipe generator.
 */
type EnumCatalog<T extends string> = Readonly<Record<T, true>>;

const NO_PREFERENCE = { 'no-preference': true } as const;

export const USE_CASE_VALUES: EnumCatalog<PrimaryUseCase> = {
  desktop: true,
  gaming: true,
  'media-center': true,
  'education-kids': true,
  'nas-storage': true,
  'smart-home': true,
  'appliance-product': true,
  'ai-gpu-compute': true,
  'hypervisor-vms': true,
  'home-office': true,
  'creative-studio': true,
  server: true,
  'k8s-cluster': true,
  'container-base': true,
  'iot-embedded': true,
  'kiosk-signage': true,
  'router-networking': true,
  'security-pentest': true,
  'browser-wasm': true
};

export const PLATFORM_VALUES: EnumCatalog<PlatformTarget> = {
  'bare-metal': true,
  vm: true,
  container: true,
  kiosk: true,
  'embedded-sbc': true,
  microcontroller: true,
  'browser-wasm': true,
  wsl2: true,
  'router-firewall': true,
  'k8s-node': true,
  desktop: true,
  server: true
};

export const ARCHITECTURE_VALUES: EnumCatalog<CpuArchitecture> = {
  x86_64: true,
  arm64: true,
  armv7: true,
  riscv64: true,
  mips: true,
  nommu: true,
  wasm32: true
};

export const FORM_FACTOR_VALUES: EnumCatalog<FormFactor> = {
  desktop: true,
  laptop: true,
  handheld: true,
  'low-power': true,
  mac: true,
  sbc: true,
  server: true
};

export const FOOTPRINT_VALUES: EnumCatalog<StorageFootprint> = {
  micro: true,
  minimal: true,
  lean: true,
  standard: true,
  full: true
};

export const INIT_PREFERENCE_VALUES: EnumCatalog<InitSystem | 'no-preference'> = {
  systemd: true,
  openrc: true,
  runit: true,
  s6: true,
  busybox: true,
  'none-container': true,
  custom: true,
  ...NO_PREFERENCE
};

export const CLIB_PREFERENCE_VALUES: EnumCatalog<CLibrary | 'no-preference'> = {
  glibc: true,
  musl: true,
  'uclibc-ng': true,
  none: true,
  ...NO_PREFERENCE
};

export const STATE_PREFERENCE_VALUES: EnumCatalog<StateModel | 'no-preference'> = {
  mutable: true,
  declarative: true,
  'immutable-ostree': true,
  'stateless-ram': true,
  'read-only-rootfs': true,
  ...NO_PREFERENCE
};

export const EXPERIENCE_LEVEL_VALUES: EnumCatalog<ExperienceLevel> = {
  beginner: true,
  intermediate: true,
  advanced: true,
  'systems-engineer': true
};

export const WORKFLOW_STYLE_VALUES: EnumCatalog<DesktopWorkflowStyle> = {
  windows: true,
  macos: true,
  'mobile-touch': true,
  'traditional-compact': true,
  'no-preference': true
};

export const RELEASE_CADENCE_VALUES: EnumCatalog<ReleaseCadence> = {
  lts: true,
  rolling: true,
  standard: true
};

export const DRIVER_PHILOSOPHY_VALUES: EnumCatalog<DriverPhilosophy> = {
  'seamless-proprietary': true,
  'free-software-only': true,
  'no-preference': true
};

export const BOOT_MEDIUM_VALUES: EnumCatalog<BootMedium> = {
  'nvme-ssd': true,
  'sd-card-usb': true,
  'pxe-diskless': true
};

export const PERIPHERAL_VALUES: EnumCatalog<PeripheralNeed> = {
  touchscreen: true,
  'printer-scanner': true,
  'vr-headset': true,
  'drawing-tablet': true,
  'mixed-dpi': true,
  standard: true
};

export const DESKTOP_ENV_VALUES: EnumCatalog<DesktopEnvId> = {
  none: true,
  cage: true,
  xfce: true,
  kde: true,
  gnome: true
};

export const DOCKER_APP_VALUES: EnumCatalog<DockerAppId> = {
  none: true,
  immich: true,
  'home-assistant': true,
  jellyfin: true,
  pihole: true,
  ollama: true,
  nextcloud: true,
  'lamp-wordpress': true,
  tailscale: true,
  'uptime-kuma': true
};

export const DESKTOP_APP_VALUES: EnumCatalog<DesktopAppId> = {
  firefox: true,
  chromium: true,
  brave: true,
  vscode: true,
  'git-dev': true,
  neovim: true,
  nodejs: true,
  python: true,
  vlc: true,
  obs: true,
  gimp: true,
  blender: true,
  spotify: true,
  libreoffice: true,
  discord: true,
  obsidian: true,
  telegram: true,
  btop: true,
  fastfetch: true
};

export const EMULATOR_APP_VALUES: EnumCatalog<EmulatorAppId> = {
  retroarch: true,
  'dosbox-staging': true,
  dolphin: true,
  pcsx2: true,
  duckstation: true,
  ppsspp: true,
  scummvm: true,
  mame: true
};

/** Untrusted criteria shape: same keys as UserCriteria, values not yet validated. */
export type UntrustedCriteria = { [K in keyof UserCriteria]?: unknown };

export function isCatalogValue<T extends string>(catalog: EnumCatalog<T>, value: unknown): value is T {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(catalog, value);
}

function pickEnum<T extends string>(catalog: EnumCatalog<T>, value: unknown): T | undefined {
  return isCatalogValue(catalog, value) ? value : undefined;
}

function pickEnumList<T extends string>(catalog: EnumCatalog<T>, value: unknown): T[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is T => isCatalogValue(catalog, item));
}

function pickBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function pickPositiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * Returns a copy of the criteria containing only allowlisted values.
 * Unknown enum values, list entries, and malformed numbers/booleans are dropped.
 */
export function sanitizeCriteria(input: UntrustedCriteria): UserCriteria {
  const candidate: UserCriteria = {
    useCase: pickEnum(USE_CASE_VALUES, input.useCase),
    platform: pickEnum(PLATFORM_VALUES, input.platform),
    architecture: pickEnum(ARCHITECTURE_VALUES, input.architecture),
    formFactor: pickEnum(FORM_FACTOR_VALUES, input.formFactor),
    maxRamMb: pickPositiveNumber(input.maxRamMb),
    footprint: pickEnum(FOOTPRINT_VALUES, input.footprint),
    initPreference: pickEnum(INIT_PREFERENCE_VALUES, input.initPreference),
    cLibPreference: pickEnum(CLIB_PREFERENCE_VALUES, input.cLibPreference),
    statePreference: pickEnum(STATE_PREFERENCE_VALUES, input.statePreference),
    experienceLevel: pickEnum(EXPERIENCE_LEVEL_VALUES, input.experienceLevel),
    prefersGui: pickBoolean(input.prefersGui),
    workflowStyle: pickEnum(WORKFLOW_STYLE_VALUES, input.workflowStyle),
    requiresCustomBuild: pickBoolean(input.requiresCustomBuild),
    releaseCadence: pickEnum(RELEASE_CADENCE_VALUES, input.releaseCadence),
    driverPhilosophy: pickEnum(DRIVER_PHILOSOPHY_VALUES, input.driverPhilosophy),
    bootMedium: pickEnum(BOOT_MEDIUM_VALUES, input.bootMedium),
    realtimeAudio: pickBoolean(input.realtimeAudio),
    peripheralNeed: pickEnum(PERIPHERAL_VALUES, input.peripheralNeed),
    peripherals: pickEnumList(PERIPHERAL_VALUES, input.peripherals),
    desktopEnv: pickEnum(DESKTOP_ENV_VALUES, input.desktopEnv),
    enableDistrobox: pickBoolean(input.enableDistrobox),
    enableNix: pickBoolean(input.enableNix),
    enableFlatpak: pickBoolean(input.enableFlatpak),
    dockerApp: pickEnum(DOCKER_APP_VALUES, input.dockerApp),
    desktopApps: pickEnumList(DESKTOP_APP_VALUES, input.desktopApps),
    emulatorApps: pickEnumList(EMULATOR_APP_VALUES, input.emulatorApps)
  };

  // Omit absent keys so callers that inspect Object.keys() see only supplied criteria.
  const sanitized: UserCriteria = {};
  for (const key of Object.keys(candidate) as (keyof UserCriteria)[]) {
    if (candidate[key] !== undefined) {
      Object.assign(sanitized, { [key]: candidate[key] });
    }
  }
  return sanitized;
}
