import type { ReleaseData } from './Release';

export type os = 'sp' | 'macOS' | 'windows' | 'linux' | 'none';
export const osBuildInfos: { [key in os]: { name: string; extensions: string[]; information?: string } } = {
  sp: {
    name: 'sp',
    extensions: [],
    information: 'Mobile builds are not available yet.',
  },
  none: {
    name: 'None',
    extensions: [],
    information: "Device not supported. (It seems you're using an uncommon device.)",
  },
  macOS: {
    name: 'macOS',
    extensions: ['dmg', 'tar.gz'],
    information: `After installation, enter the command below in bash.
(Note: you should enter this every time you update sledge.)

> xattr -rc /Applications/sledge.app`,
  },
  windows: {
    name: 'Windows',
    extensions: ['msi', 'exe'],
    information: `.msi(wix) and .exe(nsis) are supposed to works identically.`,
  },
  linux: {
    name: 'Linux',
    extensions: ['rpm', 'AppImage', 'deb'],
    information: `.deb       for Debian-based distros (e.g., Ubuntu)
.rpm       for Red Hat-based distros (e.g., Fedora, CentOS)
.AppImage  for portable applications`,
  },
};

export const getReleaseData = async (apiUrl: string, pat?: string): Promise<ReleaseData | undefined> => {
  const response = await fetch(apiUrl, {
    cache: 'no-store',
  });
  const data = await response.json();

  return data;
};

export const getLatestVersion = async (apiUrl: string, pat?: string): Promise<string | undefined> => {
  const data = await getReleaseData(apiUrl, pat);
  return data?.name;
};
