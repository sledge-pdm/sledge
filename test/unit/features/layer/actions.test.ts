import { LayerType } from '@sledge-pdm/core';
import { BlendMode } from '@sledge-pdm/frasco';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setGlobalConfig } from '~/stores/GlobalStores';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';

const mocks = vi.hoisted(() => ({
  doCommands: vi.fn(),
  logUserInfo: vi.fn(),
  logUserWarn: vi.fn(),
}));

vi.mock('~/features/history/service', () => ({
  doCommands: mocks.doCommands,
}));

vi.mock('~/features/log/service', () => ({
  logUserInfo: mocks.logUserInfo,
  logUserWarn: mocks.logUserWarn,
}));

import { addLayer, addLayerTo, removeLayer, reorderLayer, setLayerProp, toggleLayerVisibility } from '~/features/layer/actions';

const makeLayer = (id: string, enabled: boolean = true) => ({
  id,
  name: id.toUpperCase(),
  type: LayerType.Dot,
  enabled,
  opacity: 1,
  mode: BlendMode.normal,
  cutFreeze: false,
});

describe('features/layer/actions', () => {
  beforeEach(() => {
    setProjectStore('layers', 'layers', [makeLayer('l1', true), makeLayer('l2', false), makeLayer('l3', true)]);
    setProjectStore('layers', 'state', 'activeLayerId', 'l1');
    setProjectStore('layers', 'state', 'selectionEnabled', true);
    setProjectStore('layers', 'state', 'selected', new Set(['l1', 'l2']));
    setProjectStore('layers', 'state', 'baseLayer', { colorMode: 'transparent' });
    setGlobalConfig('editor', 'maxLayerCount', 64);

    mocks.doCommands.mockReset();
    mocks.logUserInfo.mockReset();
    mocks.logUserWarn.mockReset();
  });

  it('addLayer creates layer_add command at index 0', () => {
    addLayer({ name: 'new layer' }, { register: false });

    expect(mocks.doCommands).toHaveBeenCalledTimes(1);
    const [command, options] = mocks.doCommands.mock.calls[0];
    expect(command.type).toBe('layer_add');
    expect(command.serializeProps()).toEqual(
      expect.objectContaining({
        index: 0,
        layer: expect.objectContaining({ name: 'new layer' }),
      })
    );
    expect(options).toEqual({ register: false });
  });

  it('addLayerTo passes index and uniqueName option to command', () => {
    addLayerTo(2, { name: 'inserted' }, { uniqueName: false, register: false });

    expect(mocks.doCommands).toHaveBeenCalledTimes(1);
    const [command] = mocks.doCommands.mock.calls[0];
    expect(command.serializeProps()).toEqual(
      expect.objectContaining({
        index: 2,
        uniqueName: false,
      })
    );
  });

  it('addLayer blocks when configured max layer count is reached', () => {
    setGlobalConfig('editor', 'maxLayerCount', 3);

    const result = addLayer({ name: 'overflow' }, { register: false });

    expect(result).toBe(false);
    expect(mocks.doCommands).not.toHaveBeenCalled();
    expect(mocks.logUserWarn).toHaveBeenCalledWith('Cannot add more layers. Maximum layer count (3) reached.');
  });

  it('removeLayer is no-op for undefined or unknown id', () => {
    removeLayer(undefined);
    removeLayer('missing');

    expect(mocks.doCommands).not.toHaveBeenCalled();
  });

  it('removeLayer creates layer_remove command for existing layer', () => {
    removeLayer('l1', { register: false });

    expect(mocks.doCommands).toHaveBeenCalledTimes(1);
    const [command, options] = mocks.doCommands.mock.calls[0];
    expect(command.type).toBe('layer_remove');
    expect(command.serializeProps()).toEqual(expect.objectContaining({ layerId: 'l1' }));
    expect(options).toEqual({ register: false });
  });

  it('reorderLayer builds before/after order and can no-op invalid source index', () => {
    reorderLayer(0, 2, { register: false });

    expect(mocks.doCommands).toHaveBeenCalledTimes(1);
    const [command] = mocks.doCommands.mock.calls[0];
    expect(command.type).toBe('layer_reorder');
    expect(command.serializeProps()).toEqual({
      beforeOrder: ['l1', 'l2', 'l3'],
      afterOrder: ['l2', 'l3', 'l1'],
    });

    mocks.doCommands.mockClear();
    reorderLayer(99, 0, { register: false });
    expect(mocks.doCommands).not.toHaveBeenCalled();
  });

  it('setLayerProp ignores id/no-change and creates layer_props only on change', () => {
    setLayerProp('l1', 'id', 'x' as any, { register: false });
    setLayerProp('l1', 'enabled', true, { register: false });
    setLayerProp('missing', 'enabled', false, { register: false });
    expect(mocks.doCommands).not.toHaveBeenCalled();

    setLayerProp('l1', 'enabled', false, { register: false });
    expect(mocks.doCommands).toHaveBeenCalledTimes(1);
    const [command] = mocks.doCommands.mock.calls[0];
    expect(command.type).toBe('layer_props');
    expect(command.serializeProps()).toEqual(
      expect.objectContaining({
        layerId: 'l1',
        oldLayerProps: expect.objectContaining({ enabled: true }),
        newLayerProps: expect.objectContaining({ enabled: false }),
      })
    );
  });

  it('toggleLayerVisibility updates target layers and clears layer selection state', () => {
    toggleLayerVisibility(['l1', 'l2']);

    expect(mocks.doCommands).toHaveBeenCalledTimes(1);
    const [command] = mocks.doCommands.mock.calls[0];
    expect(command.type).toBe('layer_props');
    expect(command.serializeProps()).toEqual(
      expect.objectContaining({
        layerId: 'l2',
        newLayerProps: expect.objectContaining({ enabled: true }),
      })
    );
    expect(projectStore.layers.state.selectionEnabled).toBe(false);
    expect(Array.from(projectStore.layers.state.selected)).toEqual([]);
    expect(mocks.logUserInfo).toHaveBeenCalledTimes(1);
  });
});
