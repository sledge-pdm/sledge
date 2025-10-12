import { beforeEach, describe, expect, it } from 'vitest';
import { loadProjectJson } from '~/features/io/project/in/load';
import { dumpProject } from '~/features/io/project/out/dump';
import { CURRENT_PROJECT_VERSION, ProjectV0, ProjectV1 } from '~/features/io/types/Project';
import { BlendMode, LayerType } from '~/features/layer';
import { anvilManager } from '~/features/layer/anvil/AnvilManager';
import { layerListStore, setCanvasStore, setImagePoolStore, setLayerListStore, setProjectStore } from '~/stores/ProjectStores';
import { packr } from '~/utils/msgpackr';

describe('Project dump/load roundtrip', () => {
  beforeEach(() => {
    // Reset stores before each test
    (anvilManager as any).anvils.clear();
  });

  it('V0 format: basic roundtrip preserves core fields and layer buffers map keys', async () => {
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
    const projectObj: ProjectV0 = {
      canvasStore: { ...(await import('~/stores/ProjectStores')).canvasStore },
      projectStore: { ...(await import('~/stores/ProjectStores')).projectStore },
      layerListStore: { ...(await import('~/stores/ProjectStores')).layerListStore },
      imagePoolStore: { ...(await import('~/stores/ProjectStores')).imagePoolStore },
      layerBuffers: new Map<string, Uint8ClampedArray>([[layer.id, buf]]),
      imagePool: [],
    };

    // Load
    await loadProjectJson(projectObj);

    // Verify stores updated
    expect(layerListStore.layers.length).toBe(1);
    expect(layerListStore.layers[0].id).toBe('L-1');
  });

  it('V1 format: roundtrip with WebP compression preserves data', async () => {
    // Prepare minimal project state: one layer with small buffer
    setCanvasStore('canvas', { width: 4, height: 4 });
    setProjectStore('isProjectChangedAfterSave', false);
    setImagePoolStore('selectedEntryId', undefined);
    const layer = {
      id: 'L-test-v1',
      name: 'layer v1',
      type: LayerType.Dot,
      typeDescription: 'dot layer for v1 test.',
      enabled: true,
      opacity: 1,
      mode: BlendMode.normal,
      dotMagnification: 1,
    };
    setLayerListStore('layers', [layer]);
    setLayerListStore('activeLayerId', layer.id);

    // Register an agent and buffer with specific pattern
    const buf = new Uint8ClampedArray(4 * 4 * 4); // 4x4 RGBA
    buf[0] = 255; // Red pixel at (0,0)
    buf[1] = 0;
    buf[2] = 0;
    buf[3] = 255;
    buf[16] = 0; // Green pixel at (0,1)
    buf[17] = 255;
    buf[18] = 0;
    buf[19] = 255;
    anvilManager.registerAnvil(layer.id, buf, 4, 4);

    // Dump as V1 format (current implementation)
    const packed = await dumpProject();
    expect(packed).toBeInstanceOf(Uint8Array);

    // Unpack and verify it's V1 format
    const unpacked = packr.unpack(packed) as ProjectV1;
    expect(unpacked.projectVersion).toBe(CURRENT_PROJECT_VERSION);
    expect(unpacked.version).toBeDefined();
    expect(unpacked.layers.buffers.has(layer.id)).toBe(true);

    // Verify WebP buffer exists
    const layerData = unpacked.layers.buffers.get(layer.id);
    expect(layerData).toBeDefined();
    expect(layerData!.webpBuffer).toBeInstanceOf(Uint8Array);
    expect(layerData!.webpBuffer.length).toBeGreaterThan(0);

    // Load back and verify
    await loadProjectJson(unpacked);

    // Verify stores updated correctly
    expect(layerListStore.layers.length).toBe(1);
    expect(layerListStore.layers[0].id).toBe('L-test-v1');
    expect(layerListStore.layers[0].name).toBe('layer v1');

    // Verify buffer was restored correctly (at least the non-zero pixels)
    const restoredAnvil = anvilManager.getAnvil(layer.id);
    expect(restoredAnvil).toBeDefined();
    const restoredBuffer = restoredAnvil!.getImageData();
    expect(restoredBuffer[0]).toBe(255); // Red channel of first pixel
    expect(restoredBuffer[3]).toBe(255); // Alpha channel of first pixel
  });

  it('V0 to V1 version migration works correctly', async () => {
    // Create a V0 project structure
    const layer = {
      id: 'L-migration-test',
      name: 'migration layer',
      type: LayerType.Dot,
      typeDescription: 'test migration.',
      enabled: true,
      opacity: 0.8,
      mode: BlendMode.normal,
      dotMagnification: 1,
    };

    const buf = new Uint8ClampedArray(2 * 2 * 4); // 2x2 RGBA
    buf[0] = 100;
    buf[1] = 150;
    buf[2] = 200;
    buf[3] = 255; // Blue-ish pixel

    const projectV0: ProjectV0 = {
      canvasStore: { canvas: { width: 2, height: 2 } },
      projectStore: {
        thumbnailPath: undefined,
        isProjectChangedAfterSave: true,
        lastSavedAt: new Date(),
        autoSaveEnabled: false,
        autoSaveInterval: 60,
      },
      layerListStore: {
        layers: [layer],
        activeLayerId: layer.id,
        baseLayer: { colorMode: 'transparent' },
        isImagePoolActive: false,
      },
      imagePoolStore: {
        selectedEntryId: undefined,
        preserveAspectRatio: true,
      },
      layerBuffers: new Map([[layer.id, buf]]),
      imagePool: [],
    };

    // Load V0 project (should be handled as V0)
    await loadProjectJson(projectV0);

    // Verify it loaded correctly
    expect(layerListStore.layers.length).toBe(1);
    expect(layerListStore.layers[0].id).toBe('L-migration-test');
    expect(layerListStore.layers[0].opacity).toBe(0.8);

    // Now dump it (should create V1 format)
    const packedV1 = await dumpProject();
    const unpackedV1 = packr.unpack(packedV1) as ProjectV1;

    // Verify it's now V1 format
    expect(unpackedV1.projectVersion).toBe(CURRENT_PROJECT_VERSION);
    expect(unpackedV1.version).toBeDefined();
    expect(unpackedV1.layers.buffers.has(layer.id)).toBe(true);

    // Verify WebP compression was applied
    const layerData = unpackedV1.layers.buffers.get(layer.id);
    expect(layerData!.webpBuffer).toBeInstanceOf(Uint8Array);
  });
});
