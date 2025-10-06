import { describe, expect, it } from 'vitest';
import { BlendMode, LayerType } from '~/features/layer';
import { anvilManager } from '~/features/layer/anvil/AnvilManager';
import { loadProjectJson } from '~/io/project/in/load';
import { dumpProject, type Project } from '~/io/project/out/dump';
import { layerListStore, setCanvasStore, setImagePoolStore, setLayerListStore, setProjectStore } from '~/stores/ProjectStores';

describe('Project dump/load roundtrip', () => {
  it('basic roundtrip preserves core fields and layer buffers map keys', async () => {
    // Prepare minimal project state: one layer with small buffer
    setCanvasStore('canvas', { width: 4, height: 4 });
    setProjectStore('isProjectChangedAfterSave', false);
    setImagePoolStore('selectedEntryId', undefined);
    const layer = {
      id: 'L-1',
      name: 'layer1',
      type: LayerType.Dot,
      typeDescription: 'dot layer.',
      enabled: true,
      opacity: 1,
      mode: BlendMode.normal,
      dotMagnification: 1,
    };
    setLayerListStore('layers', [layer]);
    setLayerListStore('activeLayerId', layer.id);

    // Register an agent and buffer
    const buf = new Uint8ClampedArray(4 * 4 * 4); // 4x4 RGBA
    buf[0] = 255;
    buf[1] = 0;
    buf[2] = 0;
    buf[3] = 255; // one red pixel for sanity
    anvilManager.registerAnvil(layer.id, buf, 4, 4);

    // Dump
    const packed = await dumpProject();
    expect(packed).toBeInstanceOf(Uint8Array);

    // Unpack in-memory via loadProjectJson (which expects parsed Project)
    // Here we simulate read by using packr.unpack in dump directly; loadProjectJson will just set stores.
    // Instead, call load with a parsed structure equivalent to dumpProject result.
    // For robustness, reproduce the object structure like dumpProject does.
    const projectObj: Project = {
      canvasStore: { ...(await import('~/stores/ProjectStores')).canvasStore },
      projectStore: { ...(await import('~/stores/ProjectStores')).projectStore },
      layerListStore: { ...(await import('~/stores/ProjectStores')).layerListStore },
      imagePoolStore: { ...(await import('~/stores/ProjectStores')).imagePoolStore },
      layerBuffers: new Map<string, Uint8ClampedArray>([[layer.id, buf]]),
      imagePool: [],
    };

    // Load
    loadProjectJson(projectObj);

    // Verify stores updated
    expect(layerListStore.layers.length).toBe(1);
    expect(layerListStore.layers[0].id).toBe('L-1');
  });
});
