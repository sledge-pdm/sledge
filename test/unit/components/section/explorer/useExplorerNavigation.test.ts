import { describe, expect, it, vi } from 'vitest';
import { useExplorerNavigation } from '~/components/section/explorer/utils/useExplorerNavigation';

const createNavigation = (openable: Set<string>) => {
  const onReadError = vi.fn();
  const navigation = useExplorerNavigation<string>({
    read: async (path) => {
      if (!openable.has(path)) throw new Error(`cannot open ${path}`);
      return `entries of ${path}`;
    },
    onReadError,
  });
  return { ...navigation, onReadError };
};

describe('components/section/explorer/useExplorerNavigation', () => {
  it('keeps the last opened path when a pushed path cannot be opened', async () => {
    const nav = createNavigation(new Set(['/a']));
    await nav.replace('/a');

    expect(await nav.push('/missing')).toBe(false);

    expect(nav.currentPath()).toBe('/a');
    expect(nav.content()).toBe('entries of /a');
    expect(nav.onReadError).toHaveBeenCalledWith('/missing', expect.any(Error));
  });

  it('does not record a path that could not be opened in the histories', async () => {
    const nav = createNavigation(new Set(['/a', '/b']));
    await nav.replace('/a');
    await nav.push('/b');
    await nav.push('/missing');

    expect(await nav.back()).toBe(true);
    expect(nav.currentPath()).toBe('/a');
    expect(await nav.forward()).toBe(true);
    expect(nav.currentPath()).toBe('/b');
    expect(await nav.forward()).toBe(false);
  });

  it('drops a history entry that can no longer be opened', async () => {
    const openable = new Set(['/a', '/b', '/c']);
    const nav = createNavigation(openable);
    await nav.replace('/a');
    await nav.push('/b');
    await nav.push('/c');
    openable.delete('/b');

    expect(await nav.back()).toBe(false);
    expect(nav.currentPath()).toBe('/c');
    expect(await nav.back()).toBe(true);
    expect(nav.currentPath()).toBe('/a');
  });

  it('ignores a read that finishes after a newer navigation started', async () => {
    let releaseSlow: () => void = () => {};
    const nav = useExplorerNavigation<string>({
      read: (path) => (path === '/slow' ? new Promise<string>((resolve) => (releaseSlow = () => resolve('slow'))) : Promise.resolve(path)),
    });

    const slow = nav.push('/slow');
    await nav.push('/fast');
    releaseSlow();

    expect(await slow).toBe(false);
    expect(nav.currentPath()).toBe('/fast');
  });
});
