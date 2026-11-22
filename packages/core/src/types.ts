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
  | 'game-server'
  | 'community-network'
  | 'offline-library'
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
  | 'independent';

export type KernelModel =
  | 'monolithic-linux'
  | 'monolithic-bsd'
  | 'illumos'
  | 'hybrid-nt'
  | 'beos-modular'
  | 'realmode-dos'
  | 'microkernel';

/**
 * How a distribution is licensed and paid for. DistroTailor only recommends free and/or open-source
 * systems; optional paid support or an optional commercial edition is fine (DISTRO_LICENSE_POLICY).
 * - foss: free and open source.
 * - foss-optional-paid: open-source core that is free to use, with optional paid support,
 *   subscriptions, or an enterprise edition (e.g. Ubuntu Pro, Proxmox subscriptions).
 * - foss-with-firmware: open-source OS that needs the board vendor's closed boot/GPU firmware, as
 *   every OS on that hardware does (e.g. Raspberry Pi, Apple Silicon).
 * - freemium-closed: closed-source core, or free only up to a usage cap. Not allowed.
 * - proprietary: closed source and paid. Not allowed.
 */
export type LicenseModel =
  | 'foss'
  | 'foss-optional-paid'
  | 'foss-with-firmware'
  | 'freemium-closed'
  | 'proprietary';

export interface DistroLicensing {
  model: LicenseModel;
  /** Main license(s), SPDX identifiers where possible (e.g. 'GPL-2.0-only', 'Apache-2.0'). */
  license: string;
  /** What is optional or paid, or which firmware is closed. */
  note?: string;
}

/**
 * A legal "catch" the user should know before relying on a recommendation (ROM ownership,
 * authorized-use-only tools, driver licence limits). Shown up front so nobody gets in trouble.
 */
export interface LegalCaveat {
  id: string;
  title: string;
  text: string;
  /** Always shown for these distros, on results and on their detail page. */
  distroIds?: readonly string[];
  /** Shown on results when the user's criteria match, whatever the top pick is. */
  appliesTo?: (criteria: UserCriteria) => boolean;
  /** Primary source for the claim (licence text, official docs). */
  sourceUrl?: string;
}

/**
 * A system that needs payment or a closed-source license for the feature the user chose. Never
 * recommended as the result; shown as an alternative with caveats beside the free options.
 */
export interface PaidAlternative {
  id: string;
  name: string;
  website: string;
  /** Use cases where this product is a well-known paid answer. */
  useCases: PrimaryUseCase[];
  licensing: DistroLicensing;
  /** What it genuinely does well. */
  pitch: string;
  /** What the user would have to pay for or accept (closed source, usage caps). */
  caveat: string;
  /** Registered free/open-source distros that cover the same need. */
  freeOptionIds: string[];
}

export interface DistroProfile {
  id: string;
  name: string;
  osFamily?: OsFamily;
  kernelModel?: KernelModel;
  /** Upstream base distribution when derived (e.g. 'Debian', 'Ubuntu', 'Fedora'). */
  basedOn?: string;
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

  // Licensing: required so every registered distro is checked against the free/open-source policy
  licensing: DistroLicensing;

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
  | 'fedora-dnf'
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
  | 'golang'
  | 'ruby'
  | 'rust'
  | 'dotnet'
  | 'java'
  | 'php'
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
  | 'fastfetch'
  | 'syncthing'
  | 'wireguard'
  | 'timeshift'
  | 'restic'
  | 'steam'
  | 'heroic'
  | 'lutris'
  | 'prism-launcher'
  | 'tor-browser'
  | 'onionshare'
  | 'qbittorrent'
  | 'weechat'
  | 'halloy'
  | 'handbrake'
  | 'kdenlive'
  | 'inkscape'
  | 'krita'
  | 'darktable'
  | 'gthumb'
  | 'audacity'
  | 'ardour'
  | 'kodi';

export type EmulatorAppId =
  | 'retroarch'
  | 'dosbox-staging'
  | 'dolphin'
  | 'pcsx2'
  | 'duckstation'
  | 'ppsspp'
  | 'scummvm'
  | 'mame'
  | 'wine'
  | 'bottles'
  | 'qemu-user'
  | 'qemu-system'
  | 'rpcs3'
  | 'waydroid'
  | 'box64'
  | 'mednafen'
  | 'mgba'
  | 'flycast';

export type NavigationAppId =
  | 'navit'
  | 'gpsd'
  | 'foxtrotgps'
  | 'opencpn'
  | 'mkgmap';

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
  | 'uptime-kuma'
  | 'vaultwarden'
  | 'gitea'
  | 'nginx-proxy-manager'
  | 'portainer'
  | 'ghost'
  | 'wikijs'
  | 'comfyui'
  | 'paperless-ngx'
  | 'n8n'
  | 'filebrowser'
  | 'thelounge'
  | 'sabnzbd'
  | 'frigate'
  | 'gitlab-ce'
  | 'bookstack'
  | 'navidrome'
  | 'adguard-home'
  | 'dockge'
  | 'caddy'
  | 'lychee'
  | 'meilisearch'
  | 'opensearch'
  | 'searxng'
  | 'prowlarr'
  | 'nzbhydra2';

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
  | 'server'
  | 'budget-laptop';

export type DesktopWorkflowStyle =
  | 'windows'
  | 'macos'
  | 'mobile-touch'
  | 'traditional-compact'
  | 'no-preference';

export type FileSystemPreference =
  | 'ext4'
  | 'btrfs'
  | 'zfs'
  | 'xfs'
  | 'f2fs'
  | 'fat32';

export type KernelFlavor =
  | 'lts-stable'
  | 'realtime-rt'
  | 'hardened'
  | 'zen-liquorix';

export type BootloaderPreference =
  | 'grub-hybrid'
  | 'systemd-boot'
  | 'u-boot'
  | 'efistub';

export type SecurityProfile =
  | 'standard-dac'
  | 'selinux'
  | 'apparmor'
  | 'amnesic-ram';

export type NetworkingStack =
  | 'networkmanager'
  | 'systemd-networkd'
  | 'nftables-pf'
  | 'busybox-minimal';

export type FirmwareMode = 'uefi' | 'legacy-bios';

export type SecureBootPolicy = 'required' | 'own-keys';

export type TpmUsage = 'measured-boot' | 'disk-unlock';

export type VirtualizationHost = 'kvm-qemu' | 'xen' | 'bhyve' | 'container-only';

export type DevicePassthrough = 'gpu-vfio' | 'pci-devices';

export type GuestPlatform = 'kvm' | 'vmware' | 'hyperv' | 'virtualbox';

/**
 * Where the machine will run. Not scored: it decides which legal notes apply (e.g. NVIDIA's
 * GeForce driver licence excludes datacenter deployment).
 */
export type DeploymentSite = 'home' | 'office' | 'datacenter' | 'community';

/** How the machine is powered; off-grid and unreliable power favour light, power-cut-proof systems. */
export type PowerSupply = 'mains' | 'unreliable' | 'solar-battery';

/** The site's internet connection; offline and slow sites favour offline-first, rarely-updated systems. */
export type InternetUplink = 'fast' | 'slow' | 'none';

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
  /** Everyday privacy: no telemetry by default and disk encryption offered at install. */
  privacyFocus?: boolean;
  peripheralNeed?: PeripheralNeed;
  peripherals?: PeripheralNeed[];

  // Low-level Systems-Engineering Dimensions
  fileSystem?: FileSystemPreference;
  kernelFlavor?: KernelFlavor;
  bootloader?: BootloaderPreference;
  securityProfile?: SecurityProfile;
  networkingStack?: NetworkingStack;
  firmwareMode?: FirmwareMode;
  secureBoot?: SecureBootPolicy;
  tpmUsage?: TpmUsage;
  virtHost?: VirtualizationHost;
  devicePassthrough?: DevicePassthrough;
  guestPlatform?: GuestPlatform;
  deploymentSite?: DeploymentSite;
  powerSupply?: PowerSupply;
  uplink?: InternetUplink;

  // Interactive Recipe Modifiers (App Suites & Turnkey Services)
  desktopEnv?: DesktopEnvId;
  enableDistrobox?: boolean;
  enableNix?: boolean;
  enableFlatpak?: boolean;
  dockerApp?: DockerAppId;
  dockerApps?: DockerAppId[];
  desktopApps?: DesktopAppId[];
  emulatorApps?: EmulatorAppId[];
  navigationApps?: NavigationAppId[];
}

export interface QuestionOption {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  appliesCriteria: Partial<UserCriteria>;
  isDefault?: boolean;
  /** Show this option only when it fits the answers so far (e.g. a Wi-Fi router only for network goals). */
  showIf?: (criteria: UserCriteria) => boolean;
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
  warnings?: string[];
}

export interface RecommendationOutput {
  topMatches: DistroScore[];
  allMatches: DistroScore[];
  bestMatch: DistroScore;
  customRecipeAvailable: boolean;
  recommendedRecipe?: GeneratedRecipe;
  summaryText: string;
  /** Paid/closed systems for the chosen use case, shown only as caveated alternatives. */
  paidAlternatives: PaidAlternative[];
  /** Legal catches for the top match and the chosen criteria. */
  legalCaveats: LegalCaveat[];
}
