import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LayerItem from '~/components/section/editor/layer/LayerItem';
import { runExclusive } from '~/features/busy';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { closeContextMenu } from '~/utils/contextMenu/store';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';
import { buildLayer, registerLayers, resetStore, setupWebGL } from '../../features/history/helpers';

describe('LayerItem Cut context menu (e2e)', () => {
  let dispose: (() => void) | undefined;
  let platform: TestMockPlatform;

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);
    document.body.innerHTML = '';
    setupWebGL();
    selectionManager.clearAll();
    const layers = [buildLayer('active'), buildLayer('selected-a'), buildLayer('selected-b')];
    resetStore(layers);
    registerLayers(layers, 1, 1);
    const root = document.createElement('div');
    document.body.appendChild(root);
    dispose = render(() => <LayerItem layer={projectStore.layers.layers[1]} index={1} />, root);
  });

  afterEach(() => {
    closeContextMenu();
    dispose?.();
    document.body.innerHTML = '';
  });

  const openMenu = () => {
    const item = document.querySelector('[data-layer-id="selected-a"]')!;
    item.children[1].dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 }));
  };

  const chooseCut = async () => {
    const cut = Array.from(document.querySelectorAll<HTMLElement>('ul.menu li')).find((item) => item.textContent?.trim() === 'Cut.');
    expect(cut).toBeDefined();
    cut!.click();
    await vi.waitFor(() => expect(projectStore.layers.layers[1].cutFreeze).toBe(true));
  };

  it('offers Cut for the selected group shown in the label without activating the clicked layer', async () => {
    setProjectStore('layers', 'state', 'selectionEnabled', true);
    setProjectStore('layers', 'state', 'selected', new Set(['selected-b', 'selected-a']));
    const writeText = vi.spyOn(platform.clipboard, 'writeText');
    openMenu();
    expect(document.querySelector('ul.menu')?.textContent).toContain('2 layers: selected-a, selected-b');
    await chooseCut();
    expect(projectStore.layers.layers.map((layer) => layer.cutFreeze)).toEqual([false, true, true]);
    expect(JSON.parse((writeText.mock.calls as unknown as [string][])[0][0]).layerIds).toEqual(['selected-a', 'selected-b']);
    expect(projectStore.layers.state.activeLayerId).toBe('active');
    expect(projectStore.layers.state.selected).toEqual(new Set(['selected-a', 'selected-b']));
  });

  it('cuts the right-clicked layer when selection mode is off, even with a pixel selection', async () => {
    selectionManager.setBack(new SelectionMask(1, 1, new Uint8Array([1])));
    const writeText = vi.spyOn(platform.clipboard, 'writeText');
    openMenu();
    await chooseCut();
    expect(writeText).toHaveBeenCalledWith('selected-a');
    expect(projectStore.layers.layers.map((layer) => layer.cutFreeze)).toEqual([false, true, false]);
    expect(projectStore.layers.state.activeLayerId).toBe('active');
  });

  it('does not open the layer menu while an exclusive operation is running', async () => {
    await runExclusive('save', async () => {
      openMenu();
      expect(document.querySelector('ul.menu')).toBeNull();
    });
  });
});
