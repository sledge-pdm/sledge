import { beforeEach, describe, expect, it, vi } from 'vitest';
import { changeCanvasSizeWithNoOffset } from '~/features/canvas';
import { currentColor, hexToRGBA, PaletteType, registerColorChange, selectPalette, setColor, setCurrentColor } from '~/features/color';
import { projectHistoryController } from '~/features/history';
import { AnvilLayerHistoryAction } from '~/features/history/actions/AnvilLayerHistoryAction';
import { getEntry, ImagePoolEntry, insertEntry, removeEntry, updateEntryPartial } from '~/features/image_pool';
import { addLayerTo, BlendMode, Layer, LayerType, moveLayer, removeLayer, setLayerProp } from '~/features/layer';
import { flushPatch, setPixel } from '~/features/layer/anvil/AnvilController';
import { anvilManager, getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { canvasStore, layerListStore, setCanvasStore, setImagePoolStore, setLayerListStore } from '~/stores/ProjectStores';

// Mock 'document' if used in CanvasSizeHistoryAction or related code
if (typeof document === 'undefined') {
  (globalThis as any).document = {
    // Add minimal stubs as needed for your code
    createElement: vi.fn(),
    getElementById: vi.fn(),
    // ...add more if required
  };
}

// Tiny seeded RNG (LCG) for reproducibility
function makeRng(seed = 123456789) {
  let s = seed >>> 0;
  return () => (s = (1664525 * s + 1013904223) >>> 0) / 0xffffffff;
}

describe('Project-level history randomized (lightweight scaffold)', () => {
  beforeEach(() => {
    // Normalize color and image pool before each test
    selectPalette(PaletteType.primary);
    setColor(PaletteType.primary, '#000000');

    // Reset imagePool store
    setImagePoolStore('entries', []);
    setImagePoolStore('selectedEntryId', undefined);

    const WIDTH = 16;
    const HEIGHT = 16;

    // Keep canvas small to make layer buffers tiny
    setCanvasStore('canvas', { width: WIDTH, height: HEIGHT });
    // Seed 3 layers with agents (small buffers)
    const l = (id: string, name = id): Layer => ({
      id,
      name,
      type: LayerType.Dot,
      typeDescription: 'dot',
      enabled: true,
      opacity: 1,
      mode: BlendMode.normal,
      dotMagnification: 1,
      cutFreeze: false,
    });
    setLayerListStore('layers', [l('L1'), l('L2'), l('L3')]);
    setLayerListStore('activeLayerId', 'L1');
    // Ensure anvils exist for each layer id
    layerListStore.layers.forEach((layer) => {
      anvilManager.registerAnvil(layer.id, new Uint8ClampedArray(WIDTH * HEIGHT * 4), WIDTH, HEIGHT);
    });
    // Drop a few known test IDs if present
    ['rnd-a', 'rnd-b', 'rnd-c'].forEach((id) => {
      if (getEntry(id)) removeEntry(id, true); // noDiff=true to avoid history during cleanup
    });
  });

  it('randomized sequence → undo-all → redo-all is consistent and idempotent', () => {
    const rng = makeRng(42);
    const LOG_RND = process.env.VITEST_LOG_RND === '1';
    const hc = projectHistoryController;
    hc.clearHistory(); // Clear history before test

    const initial = snapshotState();

    // Helper function to create minimal WebP buffer (dummy data for testing)
    const createDummyWebpBuffer = (width: number, height: number, seed: number): Uint8Array => {
      // Create a simple pattern based on dimensions and seed for deterministic testing
      const size = Math.max(32, Math.floor((width * height * seed) / 100)); // minimum 32 bytes
      const buffer = new Uint8Array(size);
      // Fill with a predictable pattern
      for (let i = 0; i < size; i++) {
        buffer[i] = (seed * 17 + i * 31) & 0xff;
      }
      return buffer;
    };

    // Predefined candidate entries for pool operations
    const entries: Record<string, ImagePoolEntry> = {
      'rnd-a': {
        id: 'rnd-a',
        originalPath: 'C:/dummyA.png',
        webpBuffer: createDummyWebpBuffer(8, 8, 1),
        base: { width: 8, height: 8 },
        transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
        opacity: 1,
        visible: true,
      },
      'rnd-b': {
        id: 'rnd-b',
        originalPath: 'C:/dummyB.png',
        webpBuffer: createDummyWebpBuffer(12, 12, 2),
        base: { width: 12, height: 12 },
        transform: { x: 1, y: 1, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
        opacity: 1,
        visible: true,
      },
      'rnd-c': {
        id: 'rnd-c',
        originalPath: 'C:/dummyC.png',
        webpBuffer: createDummyWebpBuffer(16, 16, 3),
        base: { width: 16, height: 16 },
        transform: { x: 2, y: 2, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
        opacity: 1,
        visible: true,
      },
    };

    // Build a short random sequence of actions
    const steps: Array<() => void> = [];
    const stepDescs: string[] = [];
    const N = 40; // still short/light, but a bit richer coverage
    for (let i = 0; i < N; i++) {
      const pick = Math.floor(rng() * 7); // 7 kinds
      if (pick === 0) {
        // Color toggle among a tiny palette
        const targets = ['#000000', '#ff0000', '#00ff00', '#0000ff'] as const;
        const next = targets[Math.floor(rng() * targets.length)];
        const prev = currentColor();
        steps.push(() => {
          registerColorChange(hexToRGBA(prev), hexToRGBA(next));
          setCurrentColor(next);
        });
        stepDescs.push(`Color ${prev} -> ${next}`);
      } else if (pick === 1) {
        // Small canvas tweak within reasonable bounds
        const cur = { ...canvasStore.canvas };
        const dw = Math.floor(rng() * 5) - 2; // -2..+2
        const dh = Math.floor(rng() * 5) - 2; // -2..+2
        const next = {
          width: Math.max(1, cur.width + dw),
          height: Math.max(1, cur.height + dh),
        };
        steps.push(() => {
          changeCanvasSizeWithNoOffset(next);
        });
        stepDescs.push(`Canvas ${cur.width}x${cur.height} -> ${next.width}x${next.height}`);
      } else if (pick === 2) {
        // ImagePool add/remove on one of the fixed ids
        const keys = Object.keys(entries);
        const id = keys[Math.floor(rng() * keys.length)];
        const exists = !!getEntry(id);
        const kind = exists ? 'remove' : 'add';
        steps.push(() => {
          if (kind === 'add') {
            insertEntry(entries[id]);
          } else {
            removeEntry(id);
          }
        });
        stepDescs.push(`ImagePool ${kind} ${id}`);
      } else if (pick === 3) {
        // ImagePool entry props: nudge position/opacity/visibility if exists; otherwise add first
        const keys = Object.keys(entries);
        const id = keys[Math.floor(rng() * keys.length)];
        const cur = getEntry(id);
        if (!cur) {
          steps.push(() => {
            insertEntry(entries[id]);
          });
          stepDescs.push(`ImagePool add ${id} (prep for props)`);
        } else {
          const dx = Math.floor(rng() * 5) - 2;
          const dy = Math.floor(rng() * 5) - 2;
          const dop = (Math.floor(rng() * 3) - 1) * 0.1; // -0.1, 0, +0.1
          const updatedProps: Partial<ImagePoolEntry> = {
            transform: {
              ...cur.transform,
              x: cur.transform.x + dx,
              y: cur.transform.y + dy,
            },
            opacity: Math.max(0, Math.min(1, cur.opacity + dop)),
            visible: rng() < 0.3 ? !cur.visible : cur.visible,
          };
          steps.push(() => {
            updateEntryPartial(id, updatedProps);
          });
          stepDescs.push(`ImagePool props ${id} move(${dx},${dy})`);
        }
      } else if (pick === 4) {
        // Layer list: add/delete/reorder
        const actionKind = Math.floor(rng() * 3); // 0:add 1:delete 2:reorder
        if (actionKind === 0) {
          // add at random index
          const idx = Math.floor(rng() * (layerListStore.layers.length + 1));
          const id = `LR-${Math.floor(rng() * 100000)}`;
          steps.push(() => {
            addLayerTo(idx, {
              name: id,
              type: LayerType.Dot,
              enabled: true,
              opacity: 1,
              mode: BlendMode.normal,
              dotMagnification: 1,
            });
          });
          stepDescs.push(`Layer add ${id} @${idx}`);
        } else if (actionKind === 1) {
          if (layerListStore.layers.length > 1) {
            const layer = layerListStore.layers[Math.floor(rng() * layerListStore.layers.length)];
            steps.push(() => {
              removeLayer(layer.id);
            });
            stepDescs.push(`Layer delete ${layer.id}`);
          }
        } else {
          if (layerListStore.layers.length > 1) {
            // simple swap of two indices
            const i1 = Math.floor(rng() * layerListStore.layers.length);
            let i2 = Math.floor(rng() * layerListStore.layers.length);
            if (i2 === i1) i2 = (i2 + 1) % layerListStore.layers.length;
            steps.push(() => {
              moveLayer(i1, i2);
            });
            stepDescs.push(`Layer reorder swap(${i1},${i2})`);
          }
        }
      } else if (pick === 5) {
        // Layer props tweak (opacity/mode/enabled)
        if (layerListStore.layers.length > 0) {
          const layer = layerListStore.layers[Math.floor(rng() * layerListStore.layers.length)];
          const modes = [BlendMode.normal, BlendMode.multiply, BlendMode.screen] as const;
          const nextMode = modes[Math.floor(rng() * modes.length)];
          const nextOpacity = Math.max(0, Math.min(1, layer.opacity + (Math.floor(rng() * 3) - 1) * 0.2));
          const nextEnabled = rng() < 0.3 ? !layer.enabled : layer.enabled;

          const changes = [
            { prop: 'opacity' as const, value: nextOpacity },
            { prop: 'mode' as const, value: nextMode },
            { prop: 'enabled' as const, value: nextEnabled },
          ];
          const change = changes[Math.floor(rng() * changes.length)];

          steps.push(() => {
            setLayerProp(layer.id, change.prop, change.value);
          });
          stepDescs.push(`Layer props ${layer.id} ${change.prop}->${change.value}`);
        }
      } else if (pick === 6) {
        // Layer buffer tiny pixel patch on a random layer
        if (layerListStore.layers.length > 0) {
          const layer = layerListStore.layers[Math.floor(rng() * layerListStore.layers.length)];
          const anvil = getAnvilOf(layer.id);
          if (anvil) {
            const w = anvil.getWidth();
            const count = 1 + Math.floor(rng() * 3);
            steps.push(() => {
              for (let k = 0; k < count; k++) {
                const x = k % Math.min(4, w);
                const y = 0;
                const r = (k * 40) & 0xff;
                const g = (k * 80) & 0xff;
                const b = (k * 120) & 0xff;
                setPixel(layer.id, x, y, [r, g, b, 255]);
              }
              const patch = flushPatch(layer.id);
              if (patch) {
                const a = new AnvilLayerHistoryAction({
                  layerId: layer.id,
                  patch,
                  context: { from: 'rnd' },
                });
                hc.addAction(a);
              }
            });
            stepDescs.push(`Layer buffer pixels ${layer.id} n=${count}`);
          }
        }
      }
    }

    // Execute sequence
    steps.forEach((fn) => fn());

    if (LOG_RND) {
      // Print executed step list for debugging/repro
      const header = `\n[rnd] seed=42 steps=${N}`;
      const body = stepDescs.map((d, i) => `${i + 1}. ${d}`).join('\n');
      // eslint-disable-next-line no-console
      console.log(`${header}\n${body}`);
    }

    const final = snapshotState();

    // Undo all → initial snapshot
    while (hc.canUndo()) hc.undo();
    expect(currentColor()).toBe(initial.color);
    expect(canvasStore.canvas.width).toBe(initial.canvas.width);
    expect(canvasStore.canvas.height).toBe(initial.canvas.height);
    expect(simplifyPoolState()).toEqual(initial.pool);
    expect(simplifyLayers()).toEqual(initial.layers);

    // Redo all → final snapshot
    while (hc.canRedo()) hc.redo();
    expect(currentColor()).toBe(final.color);
    expect(canvasStore.canvas.width).toBe(final.canvas.width);
    expect(canvasStore.canvas.height).toBe(final.canvas.height);
    expect(simplifyPoolState()).toEqual(final.pool);
    expect(simplifyLayers()).toEqual(final.layers);

    // Idempotency check: repeat once more
    while (hc.canUndo()) hc.undo();
    while (hc.canRedo()) hc.redo();
    expect(currentColor()).toBe(final.color);
    expect(canvasStore.canvas.width).toBe(final.canvas.width);
    expect(canvasStore.canvas.height).toBe(final.canvas.height);
    expect(simplifyPoolState()).toEqual(final.pool);
    expect(simplifyLayers()).toEqual(final.layers);
  });
});

// Helpers to snapshot/compare only what we care about in random checks
function simplifyPoolState() {
  const ids = ['rnd-a', 'rnd-b', 'rnd-c'];
  return ids.map((id) => {
    const e = getEntry(id);
    return e
      ? {
          id,
          exists: true,
          x: e.transform.x,
          y: e.transform.y,
          opacity: e.opacity,
          visible: e.visible,
          scaleX: e.transform.scaleX,
          scaleY: e.transform.scaleY,
        }
      : { id, exists: false };
  });
}

function simplifyLayers() {
  return layerListStore.layers.map((l) => ({
    id: l.id,
    name: l.name,
    enabled: l.enabled,
    opacity: l.opacity,
    mode: l.mode,
    dotMagnification: l.dotMagnification,
  }));
}

function snapshotState() {
  return {
    color: currentColor(),
    canvas: { ...canvasStore.canvas },
    pool: simplifyPoolState(),
    layers: simplifyLayers(),
  };
}
