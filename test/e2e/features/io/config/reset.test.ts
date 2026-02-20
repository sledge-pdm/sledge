import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDefaultGlobalConfig } from '~/config/GlobalConfig';
import { Consts } from '~/Consts';
import { resetToDefaultConfig } from '~/features/io/config/reset';
import { getDefaultSettings } from '~/features/io/config/set';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';
import { setupInMemoryTextFs } from '../../../support/inMemoryTextFs';

describe('io/config/reset (e2e)', () => {
  let platform: TestMockPlatform;
  let textFs: ReturnType<typeof setupInMemoryTextFs>;

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);
    platform.core.isTauri = vi.fn(() => true) as any;
    textFs = setupInMemoryTextFs(platform);

    setGlobalConfig(makeDefaultGlobalConfig());
    setGlobalConfig('default', 'canvasSize', { width: 320, height: 240 });
  });

  it('loads defaults into global store, persists them, and emits settings event', async () => {
    const invoke = vi.spyOn(platform.core, 'invoke');
    const defaults = getDefaultSettings();

    await resetToDefaultConfig();

    expect(globalConfig.default.canvasSize).toEqual(defaults.globalConfigStore.default.canvasSize);
    const saved = textFs.readText(Consts.globalConfigFileName, { baseDir: 'app-config' });
    expect(saved).toBeDefined();
    expect(JSON.parse(saved!)).toEqual(defaults);
    expect(invoke).toHaveBeenCalledWith('emit_global_event', {
      event: 'onSettingsSaved',
      msg: { config: defaults },
    });
  });

  it('rethrows when persisting defaults fails', async () => {
    platform.fs.writeTextFile = vi.fn(async () => {
      throw new Error('write failed');
    }) as any;

    await expect(resetToDefaultConfig()).rejects.toThrow('write failed');
  });
});
