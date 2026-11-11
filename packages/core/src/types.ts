export type PlatformTarget =
  | 'bare-metal'
  | 'vm'
  | 'container'
  | 'kiosk'
  | 'embedded-sbc'
  | 'microcontroller'
  | 'browser-wasm'
  | 'wsl2'
  | 'router-firewall'
  | 'k8s-node'
  | 'desktop'
  | 'server';

export type CpuArchitecture =
  | 'x86_64'
  | 'arm64'
  | 'armv7'
  | 'riscv64'
  | 'mips'
  | 'nommu'
  | 'wasm32';

export type StorageFootprint =
  | 'micro'      // < 16 MB (BusyBox / uClibc / static)
  | 'minimal'    // 16 MB - 100 MB (Alpine / minimal server)
  | 'lean'       // 100 MB - 1 GB (DietPi / Arch netinst)
  | 'standard'   // 1 GB - 5 GB (Debian / Fedora / Ubuntu Server)
  | 'full';      // > 5 GB (Full Desktop / Workstation)

export type InitSystem =
  | 'systemd'
  | 'openrc'
  | 'runit'
  | 's6'
  | 'busybox'
  | 'bsd-rc'
  | 'none-container'
  | 'custom';

export type CLibrary =
  | 'glibc'
  | 'musl'
  | 'uclibc-ng'
  | 'bsd-libc'
  | 'none';

export type StateModel =
  | 'mutable'
  | 'declarative'      // NixOS, Guix
  | 'immutable-ostree' // Silverblue, Flatcar
  | 'stateless-ram'    // Alpine diskless, Porteus, Puppy
  | 'read-only-rootfs';

export type ExperienceLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'systems-engineer';

export type PrimaryUseCase =
  | 'desktop'
  | 'gaming'
  | 'media-center'
  | 'education-kids'
  | 'nas-storage'
  | 'smart-home'
  | 'appliance-product'
  | 'ai-gpu-compute'
  | 'hypervisor-vms'
  | 'home-office'
  | 'creative-studio'
  | 'server'
  | 'k8s-cluster'
  | 'container-base'
  | 'iot-embedded'
  | 'kiosk-signage'
  | 'router-networking'
  | 'security-pentest'
  | 'browser-wasm';

export interface AlternativeComparison {
  popularAlternative: string; // e.g. "Vanilla Ubuntu", "Red Hat Enterprise Linux (RHEL)", "RetroPie"
  relation: 'upstream' | 'fork' | 'competitor' | 'enterprise-sibling';
  headline: string; // e.g. "Why Linux Mint instead of Vanilla Ubuntu?"
  whyThisInstead: string; // Clear, technically sound reason why this tailored choice fits better
  tradeoffNotice?: string; // Transparent admission of when the alternative might still be preferred
}

export type OsFamily =
  | 'linux'
  | 'bsd'
  | 'dos'
  | 'nt-compatible'
  | 'illumos'
  | 'independent';

export interface DistroProfile {
  id: string;
  name: string;
  osFamily?: OsFamily;
  tagline: string;
  description: string;
  website: string;
  documentationUrl: string;
  logoEmoji?: string;

  // Technical attributes
  platforms: PlatformTarget[];
  architectures: CpuArchitecture[];
  footprint: StorageFootprint;
  minRamMb: number;
  initSystems: InitSystem[];
  cLibraries: CLibrary[];
  stateModel: StateModel;
  experienceLevel: ExperienceLevel;
  primaryUseCases: PrimaryUseCase[];

  // Package Management
  packageManager?: string;
  rollingRelease: boolean;

  // Strengths & tradeoffs
  highlights: string[];
  tradeoffs: string[];

  // Transparent rationales comparing against common/popular defaults (e.g. Mint vs Ubuntu, Fedora vs RHEL)
  alternativeComparisons?: AlternativeComparison[];

  // Off-the-shelf links
  prebuiltImage?: {
    downloadUrl: string;
    quickstartCommand?: string;
    dockerPull?: string;
  };

  // Associated custom recipe generator
  recipeGeneratorId?: RecipeGeneratorId;
}

export type RecipeGeneratorId =
  | 'debootstrap-debian'
  | 'alpine-chroot'
  | 'buildroot-embedded'
  | 'kiosk-web'
  | 'distroless-docker'
  | 'wasm-browser'
  | 'cloud-init-qcow2'
  | 'wsl2-debian'
  | 'proxmox-lxc'
  | 'nixos-flake';

export type DesktopAppId =
  | 'firefox'
  | 'chromium'
  | 'brave'
  | 'vscode'
  | 'git-dev'
  | 'neovim'
  | 'nodejs'
  | 'python'
  | 'vlc'
  | 'obs'
  | 'gimp'
  | 'blender'
  | 'spotify'
  | 'libreoffice'
  | 'discord'
  | 'obsidian'
  | 'telegram'
  | 'btop'
  | 'fastfetch';

export type EmulatorAppId =
  | 'retroarch'
  | 'dosbox-staging'
  | 'dolphin'
  | 'pcsx2'
  | 'duckstation'
  | 'ppsspp'
  | 'scummvm'
  | 'mame';

export type DesktopEnvId =
  | 'none'
  | 'cage'
  | 'xfce'
  | 'kde'
  | 'gnome';

export type DockerAppId =
  | 'none'
  | 'immich'
  | 'home-assistant'
  | 'jellyfin'
  | 'pihole'
  | 'ollama'
  | 'nextcloud'
  | 'lamp-wordpress'
  | 'tailscale'
  | 'uptime-kuma';

export type ReleaseCadence = 'lts' | 'rolling' | 'standard';
export type DriverPhilosophy = 'seamless-proprietary' | 'free-software-only' | 'no-preference';
export type BootMedium = 'nvme-ssd' | 'sd-card-usb' | 'pxe-diskless';
export type PeripheralNeed =
  | 'touchscreen'
  | 'printer-scanner'
  | 'vr-headset'
  | 'drawing-tablet'
  | 'mixed-dpi'
  | 'standard';

export type FormFactor =
  | 'desktop'
  | 'laptop'
  | 'handheld'
  | 'low-power'
  | 'mac'
  | 'sbc'
  | 'server';

export type DesktopWorkflowStyle =
  | 'windows'
  | 'macos'
  | 'mobile-touch'
  | 'traditional-compact'
  | 'no-preference';

export interface UserCriteria {
  useCase?: PrimaryUseCase;
  platform?: PlatformTarget;
  architecture?: CpuArchitecture;
  formFactor?: FormFactor;
  maxRamMb?: number;
  footprint?: StorageFootprint;
  initPreference?: InitSystem | 'no-preference';
  cLibPreference?: CLibrary | 'no-preference';
  statePreference?: StateModel | 'no-preference';
  experienceLevel?: ExperienceLevel;
  prefersGui?: boolean;
  workflowStyle?: DesktopWorkflowStyle;
  requiresCustomBuild?: boolean;
  releaseCadence?: ReleaseCadence;
  driverPhilosophy?: DriverPhilosophy;
  bootMedium?: BootMedium;
  realtimeAudio?: boolean;
  peripheralNeed?: PeripheralNeed;
  peripherals?: PeripheralNeed[];

  // Interactive Recipe Modifiers (App Suites & Turnkey Services)
  desktopEnv?: DesktopEnvId;
  enableDistrobox?: boolean;
  enableNix?: boolean;
  enableFlatpak?: boolean;
  dockerApp?: DockerAppId;
  desktopApps?: DesktopAppId[];
  emulatorApps?: EmulatorAppId[];
}

export interface QuestionOption {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  appliesCriteria: Partial<UserCriteria>;
  isDefault?: boolean;
}

export interface QuestionTip {
  icon?: string;
  title: string;
  text: string;
}

export interface Question {
  id: string;
  order: number;
  prompt: string;
  subtext?: string;
  category: 'platform' | 'hardware' | 'lifecycle' | 'software' | 'preferences';
  options: QuestionOption[];
  shouldAsk?: (criteriaSoFar: UserCriteria) => boolean;
  tip?: QuestionTip;
  isOptional?: boolean;
  isMultiSelect?: boolean;
}

export interface MatchReason {
  feature: string;
  matched: boolean;
  explanation: string;
}

export interface DistroScore {
  distro: DistroProfile;
  score: number; // 0 - 100
  reasons: MatchReason[];
}

export type TargetFormat =
  | 'iso'
  | 'disk-image'
  | 'tarball'
  | 'dockerfile'
  | 'buildroot'
  | 'qcow2'
  | 'wsl2'
  | 'lxc-template';

export interface GeneratedRecipe {
  id: RecipeGeneratorId;
  title: string;
  summary: string;
  targetFormat: TargetFormat;
  estimatedBuildTimeMinutes: number;
  hostDependencies: string[];
  files: Array<{
    filename: string;
    description: string;
    content: string;
    executable?: boolean;
  }>;
  quickstartCommands: string[];
}

export interface RecommendationOutput {
  topMatches: DistroScore[];
  allMatches: DistroScore[];
  bestMatch: DistroScore;
  customRecipeAvailable: boolean;
  recommendedRecipe?: GeneratedRecipe;
  summaryText: string;
}
