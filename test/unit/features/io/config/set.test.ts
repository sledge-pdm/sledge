import { describe, expect, it } from 'vitest';
import { getDefaultSettings, getFallbackedSettings } from '~/features/io/config/set';

describe('io/config/set', () => {
  it('getDefaultSettings returns fresh deep-cloned defaults', () => {
    const a = getDefaultSettings();
    const b = getDefaultSettings();

    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(a.globalConfigStore).not.toBe(b.globalConfigStore);
  });

  it('getFallbackedSettings merges provided globalConfigStore fields', () => {
    const fallbacked = getFallbackedSettings({
      globalConfigStore: {
        editor: {
          maxHistoryItemsCount: 999,
          maxLayerCount: 12,
        },
      },
    });

    expect(fallbacked.globalConfigStore.editor.maxHistoryItemsCount).toBe(999);
    expect(fallbacked.globalConfigStore.editor.maxLayerCount).toBe(12);
    expect(fallbacked.globalConfigStore.default.canvasSize.width).toBeDefined();
  });

  it('getFallbackedSettings accepts legacy root keyConfigStore', () => {
    const fallbacked = getFallbackedSettings({
      keyConfigStore: {
        save: [{ ctrl: true, key: 'x' }],
      },
    });

    expect(fallbacked.globalConfigStore.keyConfig.save).toEqual([{ ctrl: true, key: 'x' }]);
    expect(fallbacked.globalConfigStore.keyConfig.undo).toBeDefined();
  });
});
