import { BlendMode } from '@sledge-pdm/frasco';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { historyManager } from '~/features/history';
import { clearLayersFromUser, removeLayersFromUser, setActiveLayerId } from '~/features/layer/service';
import { setGlobalConfig } from '~/stores/GlobalStores';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';

const layer = (id: string, enabled: boolean = true) => ({
  id,
  name: id.toUpperCase(),
  type: 1 as any,
  enabled,
  opacity: 1,
  mode: BlendMode.normal,
  cutFreeze: false,
});

describe('layer service user operations', () => {
  let platform: TestMockPlatform;

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);

    setProjectStore('canvas', 'size', { width: 4, height: 4 });
    setProjectStore('layers', 'layers', [layer('l1', true), layer('l2', true), layer('l3', false)] as any);
    setProjectStore('layers', 'state', 'activeLayerId', 'l1');
    setProjectStore('layers', 'state', 'selectionEnabled', false);
    setProjectStore('layers', 'state', 'selected', new Set<string>());
    setProjectStore('layers', 'state', 'baseLayer', { colorMode: 'transparent' });

    setGlobalConfig('editor', 'requireConfirmBeforeLayerRemove', true);
    setGlobalConfig('editor', 'requireConfirmBeforeLayerClear', true);

    historyManager.clearHistory();
  });

  it('removeLayersFromUser does nothing when no target exists', async () => {
    setProjectStore('layers', 'state', 'activeLayerId', '');

    await removeLayersFromUser([]);

    expect(projectStore.layers.layers.map((item) => item.id)).toEqual(['l1', 'l2', 'l3']);
  });

  it('removeLayersFromUser rejects removing all layers', async () => {
    setProjectStore('layers', 'state', 'selectionEnabled', true);
    setProjectStore('layers', 'state', 'selected', new Set(['l1', 'l2', 'l3']));

    await removeLayersFromUser();

    expect(projectStore.layers.layers.map((item) => item.id)).toEqual(['l1', 'l2', 'l3']);
  });

  it('removeLayersFromUser respects confirmation result and leaves selection when cancelled', async () => {
    platform.dialog.confirm = vi.fn(async () => false) as any;
    setProjectStore('layers', 'state', 'selectionEnabled', true);
    setProjectStore('layers', 'state', 'selected', new Set(['l1', 'l2']));

    await removeLayersFromUser();

    expect(projectStore.layers.layers.map((item) => item.id)).toEqual(['l1', 'l2', 'l3']);
    expect(projectStore.layers.state.selectionEnabled).toBe(true);
    expect(Array.from(projectStore.layers.state.selected)).toEqual(['l1', 'l2']);
  });

  it('removeLayersFromUser removes targets and resets selection', async () => {
    setGlobalConfig('editor', 'requireConfirmBeforeLayerRemove', false);
    setProjectStore('layers', 'state', 'selectionEnabled', true);
    setProjectStore('layers', 'state', 'selected', new Set(['l1', 'l2']));

    await removeLayersFromUser();

    expect(projectStore.layers.layers.map((item) => item.id)).toEqual(['l3']);
    expect(projectStore.layers.state.selectionEnabled).toBe(false);
    expect(Array.from(projectStore.layers.state.selected)).toEqual([]);
  });

  it('clearLayersFromUser keeps state when confirmation is cancelled', async () => {
    platform.dialog.confirm = vi.fn(async () => false) as any;
    setProjectStore('layers', 'state', 'selectionEnabled', true);
    setProjectStore('layers', 'state', 'selected', new Set(['l1', 'l2']));

    await clearLayersFromUser();

    expect(projectStore.layers.layers.map((item) => item.id)).toEqual(['l1', 'l2', 'l3']);
    expect(projectStore.layers.state.selectionEnabled).toBe(true);
    expect(Array.from(projectStore.layers.state.selected)).toEqual(['l1', 'l2']);
  });

  it('setActiveLayerId blocks switching to disabled layer', () => {
    setActiveLayerId('l3');

    expect(projectStore.layers.state.activeLayerId).toBe('l1');
  });

  it('setActiveLayerId switches to enabled layer', () => {
    setActiveLayerId('l2');

    expect(projectStore.layers.state.activeLayerId).toBe('l2');
  });
});
