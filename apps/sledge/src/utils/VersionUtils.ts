import { getLatestVersion } from '@sledge/core';
import { getVersion } from '@tauri-apps/api/app';
import { saveGlobalSettings } from '~/io/config/save';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';

export const getReleaseApiUrl = () => {
  const releaseApiUrl =
    import.meta.env.VITE_GITHUB_REST_API_URL +
    '/repos/' +
    import.meta.env.VITE_GITHUB_OWNER +
    '/' +
    import.meta.env.VITE_GITHUB_REPO +
    '/releases/latest';
  return releaseApiUrl;
};

// smaller = newer
interface SemanticVersionSuffix {
  name: string;
  order: number;
}

const availableSuffixes: Record<string, SemanticVersionSuffix> = {
  '': { name: 'stable', order: 100 },
  prealpha: { name: 'prealpha', order: 700 },
};

interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  suffix: SemanticVersionSuffix;
}

// "vX.Y.Z[-S]" or "X.Y.Z[-S]" format
const parseSemanticVersion = (versionStr: string): SemanticVersion => {
  const regex = /v?(\d+)\.(\d+)\.(\d+)(?:-(\w+))?/;
  const match = versionStr.match(regex);
  if (!match) throw new Error('Invalid version format');

  const [, major, minor, patch, suffix] = match;

  if (suffix && !availableSuffixes[suffix] && !Object.values(availableSuffixes).some((s) => s.name === suffix)) {
    throw new Error(`Unknown version suffix: ${suffix}`);
  }

  return {
    major: parseInt(major, 10),
    minor: parseInt(minor, 10),
    patch: parseInt(patch, 10),
    suffix: suffix ? availableSuffixes[suffix] || { name: suffix, order: 500 } : availableSuffixes[''], // default to stable if no suffix
  };
};

// Compare two semantic versions
// Returns a negative number if v1 < v2, positive if v1 > v2
const compareSemanticVersions = (v1: SemanticVersion | string, v2: SemanticVersion | string): number => {
  if (typeof v1 === 'string') v1 = parseSemanticVersion(v1);
  if (typeof v2 === 'string') v2 = parseSemanticVersion(v2);

  if (v1.major !== v2.major) return v1.major - v2.major;
  if (v1.minor !== v2.minor) return v1.minor - v2.minor;
  if (v1.patch !== v2.patch) return v1.patch - v2.patch;
  return v2.suffix.order - v1.suffix.order;
};

export const getCurrentVersion = async (): Promise<string> => {
  return await getVersion();
};

export const isNewVersionAvailable = async (considerSkip: boolean): Promise<boolean | undefined> => {
  const current = await getCurrentVersion();
  const latestVersion = await getLatestVersion(getReleaseApiUrl());

  if (!latestVersion) return undefined;

  if (considerSkip && globalConfig.misc.skippedVersions.includes(latestVersion)) {
    return false;
  }

  return compareSemanticVersions(current, latestVersion) < 0;
};

export const addSkippedVersion = (version: string): void => {
  setGlobalConfig('misc', 'skippedVersions', (prev: string[]) => {
    if (!prev.includes(version)) {
      return [...prev, version];
    }
    return prev;
  });
  saveGlobalSettings(true);
};

//   const test1 = compareSemanticVersions('0.1.0', '1.1.1-prealpha');
//   console.log('Comparison Result:', test1); // Should be negative since 0.1.0 < 1.1.1-prealpha
//   const test2 = compareSemanticVersions('1.1.1-prealpha', '1.1.1');
//   console.log('Comparison Result:', test2); // Should be negative since 1.1.1-prealpha < 1.1.1
//   const test3 = compareSemanticVersions('1.1.1', '1.1.1-prealpha');
//   console.log('Comparison Result:', test3); // Should be positive since 1.1.1 > 1.1.1-prealpha
//   const test4 = compareSemanticVersions('1.1.0-prealpha', '1.0.0-prealpha');
//   console.log('Comparison Result:', test4); // Should be positive since 1.1.0-prealpha > 1.0.0-prealpha
//   const test5 = compareSemanticVersions('2.1.0-prealpha', '1.0.0-prealpha');
//   console.log('Comparison Result:', test5); // Should be positive since 2.1.0-prealpha > 1.0.0-prealpha
