/**
 * URL Schema Versioning and Migration Engine for DistroTailor.
 * 
 * Ensures permalinks shared across forum posts, GitHub issues, and social chats
 * never suffer from URL bit rot as taxonomy and questions evolve.
 */

export const CURRENT_SCHEMA_VERSION = 1;

export interface MigrationResult {
  version: number;
  migrated: boolean;
  warnings: string[];
  params: Record<string, string>;
}

/**
 * Migration functions: fromVersion -> transform parameters to fromVersion + 1.
 */
export type SchemaMigrator = (
  params: Record<string, string>,
  warnings: string[]
) => Record<string, string>;

export const SCHEMA_MIGRATIONS: Record<number, SchemaMigrator> = {
  // Example for future migrations:
  // 1: (params, warnings) => {
  //   if (params.useCase === 'old-name') {
  //     params.useCase = 'new-name';
  //     warnings.push("Migrated useCase 'old-name' to 'new-name'");
  //   }
  //   return params;
  // }
};

/**
 * Criteria value aliases for backward compatibility with renamed or simplified taxonomy options.
 */
export const CRITERIA_VALUE_ALIASES: Record<string, Record<string, string>> = {
  useCase: {
    'home-automation': 'smart-home',
    'single-app': 'appliance-product',
    'kodi-media': 'media-center',
    'retro-gaming': 'gaming',
    'ai-ml': 'ai-gpu-compute',
    'crypto-mining': 'ai-gpu-compute'
  },
  platform: {
    rpi: 'embedded-sbc',
    raspberrypi: 'embedded-sbc',
    pc: 'bare-metal'
  },
  architecture: {
    x86: 'x86_64',
    amd64: 'x86_64',
    aarch64: 'arm64'
  }
};

/**
 * Migrates URL parameters from an arbitrary schema version to CURRENT_SCHEMA_VERSION.
 * Handles unversioned legacy links, renamed keys, and aliases.
 */
export function migrateUrlParameters(rawParams: Record<string, string>): MigrationResult {
  const warnings: string[] = [];
  const versionParam = rawParams.v || rawParams.version;
  const inputVersion = versionParam ? parseInt(versionParam, 10) : 1;

  let currentParams: Record<string, string> = { ...rawParams };
  let currentVersion = isNaN(inputVersion) ? 1 : inputVersion;
  let migrated = false;

  // Run sequential step-by-step schema migrations if input is from older version
  while (currentVersion < CURRENT_SCHEMA_VERSION) {
    const migrator = SCHEMA_MIGRATIONS[currentVersion];
    if (migrator) {
      currentParams = migrator(currentParams, warnings);
      migrated = true;
    }
    currentVersion++;
  }

  // Apply value alias mappings
  for (const [key, aliases] of Object.entries(CRITERIA_VALUE_ALIASES)) {
    const val = currentParams[key];
    if (val && aliases[val]) {
      const canonical = aliases[val];
      warnings.push(`Aliased '${key}=${val}' to canonical '${canonical}'`);
      currentParams[key] = canonical;
      migrated = true;
    }
  }

  // Set the current schema version
  if (currentParams.v !== String(CURRENT_SCHEMA_VERSION)) {
    currentParams.v = String(CURRENT_SCHEMA_VERSION);
    if (!versionParam) {
      migrated = true; // Added missing version parameter
    }
  }

  return {
    version: CURRENT_SCHEMA_VERSION,
    migrated,
    warnings,
    params: currentParams
  };
}
