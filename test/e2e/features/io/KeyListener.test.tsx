import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { makeDefaultKeyConfigStore } from '~/config/KeyConfig';
import KeyListener from '~/features/io/KeyListener';
import { setIOStore, setToolStore, toolStore } from '~/stores/EditorStores';
import { setKeyConfigStore } from '~/stores/GlobalStores';

const mocks = vi.hoisted(() => ({
  saveProject: vi.fn(),
}));

vi.mock('~/features/io/project/save', () => ({
  saveProject: mocks.saveProject,
}));

describe('KeyListener (e2e)', () => {
  let dispose: (() => void) | undefined;

  beforeEach(() => {
    mocks.saveProject.mockReset();

    const keyConfig = makeDefaultKeyConfigStore();
    keyConfig.save = [{ key: 's' }];
    keyConfig.sizeIncrease = [{ key: ']' }];
    keyConfig.layer_delete = [{ key: 'Delete' }];
    keyConfig.pipette = [{ key: 'p' }];
    setKeyConfigStore(keyConfig);

    setIOStore('savedLocation', { name: 'demo.sledge', path: 'C:/work' });

    setToolStore('activeToolCategory', 'pen');
    setToolStore('prevActiveCategory', 'eraser');
    setToolStore('tools', 'pen', 'presets', 'selected', 'default');
    setToolStore('tools', 'pen', 'presets', 'options', 'default', 'size', 5);

    const root = document.createElement('div');
    document.body.appendChild(root);
    dispose = render(() => KeyListener({}), root);
  });

  afterEach(() => {
    dispose?.();
    document.body.innerHTML = '';
  });

  it('save key triggers saveProject', async () => {
    await userEvent.keyboard('s');

    expect(mocks.saveProject).toHaveBeenCalledWith('demo.sledge', 'C:/work');
  });

  it('layer_delete key is ignored while input is focused', async () => {
    const beforeLayers = document.querySelectorAll('input').length;
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    await userEvent.keyboard('{Delete}');

    expect(document.activeElement).toBe(input);
    expect(document.querySelectorAll('input').length).toBe(beforeLayers + 1);
  });

  it('sizeIncrease key updates active preset size through real tool store', async () => {
    expect(toolStore.tools.pen.presets?.options.default.size).toBe(5);

    await userEvent.keyboard(']');

    expect(toolStore.tools.pen.presets?.options.default.size).toBe(6);
  });

  it('pipette key switches tool and next non-pipette key restores previous tool on keyup', async () => {
    await userEvent.keyboard('p');
    expect(toolStore.activeToolCategory).toBe('pipette');

    await userEvent.keyboard('x');
    expect(toolStore.activeToolCategory).toBe('pen');
  });
});
