import { RGBA } from '@sledge/anvil';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { changeCanvasSizeWithNoOffset } from '~/features/canvas';
import { currentColor, PaletteType, registerColorChange, selectPalette, setCurrentColor, setPaletteColor } from '~/features/color';
import { projectHistoryController } from '~/features/history';
import { AnvilLayerHistoryAction } from '~/features/history/actions/AnvilLayerHistoryAction';
import { getEntry, ImagePoolEntry, insertEntry, removeEntry } from '~/features/image_pool';
import { addLayerTo, BlendMode, Layer, LayerType, moveLayer, removeLayer, setLayerProp } from '~/features/layer';
import { anvilManager } from '~/features/layer/anvil/AnvilManager';
import { canvasStore, layerListStore, setCanvasStore, setImagePoolStore, setLayerListStore } from '~/stores/ProjectStores';
import { BLACK, BLUE, GREEN, RED } from '../../support/colors';
import { HistoryActionTester } from '../../support/HistoryActionTester';

// Mock 'document' if used in CanvasSizeHistoryAction or related code
if (typeof document === 'undefined') {
  (globalThis as any).document = {
    // Add minimal stubs as needed for your code
    createElement: vi.fn(),
    getElementById: vi.fn(),
    // ...add more if required
  };
}

const RANDOM_STATE_FILE = join(tmpdir(), 'sledge', 'project-history-randomized-sequence.json');

// Prefer Math.random when available; fall back to a seeded LCG when Math is not usable
function makeRng(seed = Date.now()) {
  if (typeof Math.random === 'function') {
    const nextFloat = () => Math.random();
    return {
      nextFloat,
      int: (max: number) => Math.floor(nextFloat() * max), // [0, max)
      range: (min: number, maxExclusive: number) => Math.floor(nextFloat() * (maxExclusive - min)) + min, // [min, max)
    };
  }

  // Tiny seeded RNG (LCG) fallback
  let s = seed >>> 0;
  const nextFloat = () => (s = (1664525 * s + 1013904223) >>> 0) / 0xffffffff;
  return {
    nextFloat,
    int: (max: number) => Math.floor(nextFloat() * max), // [0, max)
    range: (min: number, maxExclusive: number) => Math.floor(nextFloat() * (maxExclusive - min)) + min, // [min, max)
  };
}

function ensureRandomStateDifferent(signature: string) {
  const dir = dirname(RANDOM_STATE_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const previous = existsSync(RANDOM_STATE_FILE) ? readFileSync(RANDOM_STATE_FILE, 'utf-8') : undefined;
  if (previous && previous === signature) {
    throw new Error('Randomized sequence matches the previous run. Please rerun to get a different sequence.');
  }
  writeFileSync(RANDOM_STATE_FILE, signature, 'utf-8');
}

const projectHistoryDummyWebp = () => readFileSync(new URL('./actions/images/projectHistory_random.webp', import.meta.url));

type HistoryActionType = 'color' | 'canvas' | 'imagePoolToggle' | 'layerList' | 'layerProps' | 'layerBuffer';
const ACTION_TYPES: HistoryActionType[] = ['color', 'canvas', 'imagePoolToggle', 'layerList', 'layerProps', 'layerBuffer'];

describe('Project-level history randomized (lightweight scaffold)', () => {
  beforeEach(() => {
    // Normalize color and image pool before each test
    selectPalette(PaletteType.primary);
    setPaletteColor(PaletteType.primary, BLACK);

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
    const rng = makeRng();
    const LOG_RND = process.env.VITEST_LOG_RND === '1';
    const hc = projectHistoryController;
    hc.clearHistory(); // Clear history before test

    const initial = snapshotState();

    const entries: Record<string, ImagePoolEntry> = {
      'rnd-a': {
        id: 'rnd-a',
        originalPath: 'C:/dummyA.png',
        webpBuffer: projectHistoryDummyWebp(),
        base: { width: 8, height: 8 },
        transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
        opacity: 1,
        visible: true,
      },
      'rnd-b': {
        id: 'rnd-b',
        originalPath: 'C:/dummyB.png',
        webpBuffer: projectHistoryDummyWebp(),
        base: { width: 12, height: 12 },
        transform: { x: 1, y: 1, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
        opacity: 1,
        visible: true,
      },
      'rnd-c': {
        id: 'rnd-c',
        originalPath: 'C:/dummyC.png',
        webpBuffer: projectHistoryDummyWebp(),
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
      const pick = ACTION_TYPES[rng.int(ACTION_TYPES.length)];
      switch (pick) {
        case 'color':
          // Color toggle among a tiny palette
          const targets: RGBA[] = [BLACK, RED, GREEN, BLUE] as const;
          const nextColor = targets[rng.int(targets.length)];
          const prevColor = currentColor();
          steps.push(() => {
            registerColorChange(prevColor, nextColor);
            setCurrentColor(nextColor);
          });
          stepDescs.push(`Color ${prevColor} -> ${nextColor}`);
          break;
        case 'canvas':
          // Small canvas tweak within reasonable bounds
          const cur = { ...canvasStore.canvas };
          const dw = rng.range(-2, 3); // -2..+2
          const dh = rng.range(-2, 3); // -2..+2
          const nextSize = {
            width: Math.max(1, cur.width + dw),
            height: Math.max(1, cur.height + dh),
          };
          steps.push(() => {
            changeCanvasSizeWithNoOffset(nextSize);
          });
          stepDescs.push(`Canvas ${cur.width}x${cur.height} -> ${nextSize.width}x${nextSize.height}`);
          break;
        case 'imagePoolToggle':
          // ImagePool add/remove on one of the fixed ids
          const keys = Object.keys(entries);
          const id = keys[rng.int(keys.length)];
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
          break;
        case 'layerList':
          // Layer list: add/delete/reorder
          const actionKind = rng.int(3); // 0:add 1:delete 2:reorder
          if (actionKind === 0) {
            // add at random index
            const idx = rng.int(layerListStore.layers.length + 1);
            const id = `LR-${rng.int(100000)}`;
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
              const layer = layerListStore.layers[rng.int(layerListStore.layers.length)];
              steps.push(() => {
                removeLayer(layer.id);
              });
              stepDescs.push(`Layer delete ${layer.id}`);
            }
          } else {
            if (layerListStore.layers.length > 1) {
              // simple swap of two indices
              const i1 = rng.int(layerListStore.layers.length);
              let i2 = rng.int(layerListStore.layers.length);
              if (i2 === i1) i2 = (i2 + 1) % layerListStore.layers.length;
              steps.push(() => {
                moveLayer(i1, i2);
              });
              stepDescs.push(`Layer reorder swap(${i1},${i2})`);
            }
          }
          break;
        case 'layerProps':
          // Layer props tweak (opacity/mode/enabled)
          if (layerListStore.layers.length > 0) {
            const layer = layerListStore.layers[rng.int(layerListStore.layers.length)];
            const modes = [BlendMode.normal, BlendMode.multiply, BlendMode.screen] as const;
            const nextMode = modes[rng.int(modes.length)];
            const nextOpacity = Math.max(0, Math.min(1, layer.opacity + rng.range(-1, 2) * 0.2)); // -0.2, 0, +0.2
            const nextEnabled = rng.nextFloat() < 0.3 ? !layer.enabled : layer.enabled;

            const changes = [
              { prop: 'opacity' as const, value: nextOpacity },
              { prop: 'mode' as const, value: nextMode },
              { prop: 'enabled' as const, value: nextEnabled },
            ];
            const change = changes[rng.int(changes.length)];

            steps.push(() => {
              setLayerProp(layer.id, change.prop, change.value);
            });
            stepDescs.push(`Layer props ${layer.id} ${change.prop}->${change.value}`);
          }
          break;
        case 'layerBuffer':
          // Layer buffer tiny pixel patch on a random layer
          if (layerListStore.layers.length > 0) {
            const layer = layerListStore.layers[rng.int(layerListStore.layers.length)];
            const anvil = anvilManager.getAnvil(layer.id);
            if (!anvil) return;
            const w = anvil.getWidth();
            const count = rng.range(1, 4); // 1..3
            steps.push(() => {
              for (let k = 0; k < count; k++) {
                const x = k % Math.min(4, w);
                const y = 0;
                const r = (k * 40) & 0xff;
                const g = (k * 80) & 0xff;
                const b = (k * 120) & 0xff;
                anvil.setPixel(x, y, [r, g, b, 255]);
              }
              const patch = anvil.flushDiffs();
              if (patch) {
                const tester = new HistoryActionTester(
                  () =>
                    new AnvilLayerHistoryAction({
                      layerId: layer.id,
                      patch,
                      context: { from: 'rnd' },
                    })
                );
                tester.run({
                  apply: (action) => hc.addAction(action),
                });
              }
            });
            stepDescs.push(`Layer buffer pixels ${layer.id} n=${count}`);
          }
          break;
        default:
          console.warn(`Unknown action type picked: ${pick}`);
          break;
      }
    }

    const signature = JSON.stringify({ steps: stepDescs });
    ensureRandomStateDifferent(signature);

    // Execute sequence
    steps.forEach((fn) => fn());

    if (LOG_RND) {
      // Print executed step list for debugging/repro
      const header = `\n[rnd] steps=${N}`;
      const body = stepDescs.map((d, i) => `${i + 1}. ${d}`).join('\n');
      // eslint-disable-next-line no-console
      console.log(`${header}\n${body}`);
    }

    const final = snapshotState();

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
