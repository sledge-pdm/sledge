import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveBlobViaTauri } from '~/features/io/export/export';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';

describe('io/export/saveBlobViaTauri', () => {
  let platform: TestMockPlatform;

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);
  });

  it('creates target directory and writes file when it does not exist', async () => {
    const exists = vi.fn(async (targetPath: string) => false);
    const mkdir = vi.fn(async () => {});
    const writeFile = vi.fn(async () => {});
    platform.fs.exists = exists as any;
    platform.fs.mkdir = mkdir as any;
    platform.fs.writeFile = writeFile as any;

    const result = await saveBlobViaTauri(new Blob([new Uint8Array([1, 2, 3])]), 'C:/export', 'a.png');

    expect(result).toEqual({ path: 'C:/export', name: 'a.png' });
    expect(mkdir).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledTimes(1);
  });

  it('returns undefined when overwrite confirmation is rejected', async () => {
    const exists = vi.fn(async (targetPath: string) => true);
    const writeFile = vi.fn(async () => {});
    const confirm = vi.fn(async () => false);
    platform.fs.exists = exists as any;
    platform.fs.writeFile = writeFile as any;
    platform.dialog.confirm = confirm as any;

    const result = await saveBlobViaTauri(new Blob([new Uint8Array([1])]), 'C:/export', 'already.png');

    expect(result).toBeUndefined();
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('overwrites file when confirmation is accepted', async () => {
    const exists = vi.fn(async (targetPath: string) => targetPath === 'C:/export' || targetPath === 'C:/export/already.png').mockName('exists');
    const writeFile = vi.fn(async () => {});
    const confirm = vi.fn(async () => true);
    platform.fs.exists = exists as any;
    platform.fs.writeFile = writeFile as any;
    platform.dialog.confirm = confirm as any;

    const result = await saveBlobViaTauri(new Blob([new Uint8Array([5])]), 'C:/export', 'already.png');

    expect(result).toEqual({ path: 'C:/export', name: 'already.png' });
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledTimes(1);
  });
});
