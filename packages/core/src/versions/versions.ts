import type { ReleaseData } from './Release';

export type os = 'sp' | 'macOS' | 'windows' | 'linux' | 'none';
export const osExtensions: { [key in os]: { name: string; extensions: string[] } } = {
  sp: {
    name: 'sp',
    extensions: [],
  },
  none: {
    name: 'None',
    extensions: [],
  },
  macOS: {
    name: 'macOS',
    extensions: ['dmg', 'tar.gz'],
  },
  windows: {
    name: 'Windows',
    extensions: ['msi', 'exe'],
  },
  linux: {
    name: 'Linux',
    extensions: ['rpm', 'AppImage', 'deb'],
  },
};

export const getReleaseData = async (apiUrl: string): Promise<ReleaseData | undefined> => {
  const response = await fetch(apiUrl);
  const data = await response.json();

  return data;
};

export const getLatestVersion = async (apiUrl: string): Promise<string | undefined> => {
  const data = await getReleaseData(apiUrl);
  return data?.name;
};
