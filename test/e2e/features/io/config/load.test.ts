import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Consts } from '~/Consts';
import {
  GLOBAL_CONFIG_ERROR_FAILED_FILE_READ,
  GLOBAL_CONFIG_ERROR_FAILED_PARSE_JSON,
  GLOBAL_CONFIG_ERROR_FILE_NOT_FOUND,
  loadGlobalConfig,
} from '~/features/io/config/load';
import { getDefaultSettings, getFallbackedSettings } from '~/features/io/config/set';
import { ErrorTypes } from '~/features/io/project/ProjectLoader';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';
import { setupInMemoryTextFs } from '../../../support/inMemoryTextFs';

describe('io/config/load (e2e)', () => {
  let platform: TestMockPlatform;
  let textFs: ReturnType<typeof setupInMemoryTextFs>;

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);
    textFs = setupInMemoryTextFs(platform);
    setGlobalConfig(getDefaultSettings().globalConfigStore);
  });

  it('returns defaults and persists config when file is missing', async () => {
    const invoke = vi.spyOn(platform.core, 'invoke');
    const defaults = getDefaultSettings();

    const result = await loadGlobalConfig();

    expect(result.store).toEqual(defaults);
    expect(result.error).toEqual({
      type: ErrorTypes.FILE_NOT_FOUND,
      detail: GLOBAL_CONFIG_ERROR_FILE_NOT_FOUND,
    });
    expect(globalConfig).toEqual(defaults.globalConfigStore);
    const saved = textFs.readText(Consts.globalConfigFileName, { baseDir: 'app-config' });
    expect(saved).toBeDefined();
    expect(JSON.parse(saved!)).toEqual(defaults);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('returns defaults when readTextFile fails', async () => {
    const defaults = getDefaultSettings();
    platform.fs.exists = vi.fn(async (targetPath: string) => targetPath === Consts.globalConfigFileName) as any;
    platform.fs.readTextFile = vi.fn(async () => {
      throw new Error('read failed');
    }) as any;

    const result = await loadGlobalConfig();

    expect(result.store).toEqual(defaults);
    expect(result.error?.type).toBe(ErrorTypes.INTERNAL_ERROR);
    expect(result.error?.detail).toBe(GLOBAL_CONFIG_ERROR_FAILED_FILE_READ);
    const saved = textFs.readText(Consts.globalConfigFileName, { baseDir: 'app-config' });
    expect(saved).toBeDefined();
    expect(JSON.parse(saved!)).toEqual(defaults);
  });

  it('returns defaults when config JSON is invalid', async () => {
    const defaults = getDefaultSettings();
    textFs.files.set(`app-config:${Consts.globalConfigFileName}`, '{broken-json');

    const result = await loadGlobalConfig();

    expect(result.store).toEqual(defaults);
    expect(result.error?.type).toBe(ErrorTypes.INTERNAL_ERROR);
    expect(result.error?.detail).toBe(GLOBAL_CONFIG_ERROR_FAILED_PARSE_JSON);
    const saved = textFs.readText(Consts.globalConfigFileName, { baseDir: 'app-config' });
    expect(saved).toBeDefined();
    expect(JSON.parse(saved!)).toEqual(defaults);
  });

  it('loads fallbacked settings from valid config JSON and persists normalized result', async () => {
    const raw = {
      globalConfigStore: {
        default: {
          canvasSize: { width: 320, height: 240 },
        },
      },
    };
    textFs.files.set(`app-config:${Consts.globalConfigFileName}`, JSON.stringify(raw));

    const result = await loadGlobalConfig();
    const expected = getFallbackedSettings(raw);

    expect(result.store).toEqual(expected);
    expect(result.error).toBeUndefined();
    expect(globalConfig.default.canvasSize).toEqual({ width: 320, height: 240 });
    const saved = textFs.readText(Consts.globalConfigFileName, { baseDir: 'app-config' });
    expect(saved).toBeDefined();
    expect(JSON.parse(saved!)).toEqual(expected);
  });
});
