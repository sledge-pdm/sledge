import { vi } from 'vitest';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';

type FsOptions = { baseDir?: string };

const toKey = (targetPath: string, options?: FsOptions) => `${options?.baseDir ?? ''}:${targetPath}`;

export const setupInMemoryTextFs = (platform: TestMockPlatform, baseDir = 'app-config') => {
  const files = new Map<string, string>();
  const dirs = new Set<string>();

  platform.fs.BaseDirectory = {
    AppConfig: baseDir,
  } as any;

  platform.fs.exists = vi.fn(async (targetPath: string, options?: FsOptions) => {
    const key = targetPath === '' ? `${options?.baseDir ?? ''}:` : toKey(targetPath, options);
    return files.has(key) || dirs.has(key);
  }) as any;

  platform.fs.mkdir = vi.fn(async (targetPath: string, options?: FsOptions) => {
    const key = targetPath === '' ? `${options?.baseDir ?? ''}:` : toKey(targetPath, options);
    dirs.add(key);
  }) as any;

  platform.fs.writeTextFile = vi.fn(async (targetPath: string, content: string, options?: FsOptions) => {
    files.set(toKey(targetPath, options), content);
  }) as any;

  platform.fs.readTextFile = vi.fn(async (targetPath: string, options?: FsOptions) => files.get(toKey(targetPath, options)) ?? '') as any;

  return {
    files,
    dirs,
    readText: (targetPath: string, options?: FsOptions) => files.get(toKey(targetPath, options)),
  };
};
