import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDefaultGlobalConfig } from '~/config/GlobalConfig';
import { Consts } from '~/Consts';
import { saveGlobalSettings } from '~/features/io/config/save';
import { getFallbackedSettings } from '~/features/io/config/set';
import { getGlobalRootStore, setGlobalConfig } from '~/stores/GlobalStores';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';
import { setupInMemoryTextFs } from '../../../support/inMemoryTextFs';

describe('io/config/save (e2e)', () => {
  let platform: TestMockPlatform;
  let textFs: ReturnType<typeof setupInMemoryTextFs>;

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);
    textFs = setupInMemoryTextFs(platform);
    setGlobalConfig(makeDefaultGlobalConfig());
  });

  it('writes fallbacked config without global event when triggerGlobalEvent=false', async () => {
    const invoke = vi.spyOn(platform.core, 'invoke');
    setGlobalConfig('default', 'canvasSize', { width: 320, height: 240 });

    await saveGlobalSettings(false);

    const expected = getFallbackedSettings(getGlobalRootStore() as any);
    const saved = textFs.readText(Consts.globalConfigFileName, { baseDir: 'app-config' });
    expect(saved).toBeDefined();
    expect(JSON.parse(saved!)).toEqual(expected);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('emits onSettingsSaved via core.invoke when triggerGlobalEvent=true', async () => {
    const invoke = vi.spyOn(platform.core, 'invoke');
    setGlobalConfig('default', 'canvasSize', { width: 256, height: 128 });

    await saveGlobalSettings(true);

    const expected = getFallbackedSettings(getGlobalRootStore() as any);
    expect(invoke).toHaveBeenCalledWith('emit_global_event', {
      event: 'onSettingsSaved',
      msg: { config: expected },
    });
  });

  it('rethrows when writeTextFile fails', async () => {
    platform.fs.writeTextFile = vi.fn(async () => {
      throw new Error('write failed');
    }) as any;

    await expect(saveGlobalSettings(false)).rejects.toThrow('write failed');
  });
});
