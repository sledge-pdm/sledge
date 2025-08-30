import { beforeEach, describe, expect, it } from 'vitest';
import { getEntry, removeEntry } from '~/controllers/canvas/image_pool/ImagePoolController';
import { currentColor, selectPalette, setColor } from '~/controllers/color/ColorController';
import { ProjectHistoryController } from '~/controllers/history/ProjectHistoryController';
import { CanvasSizeHistoryAction } from '~/controllers/history/actions/CanvasSizeHistoryAction';
import { ColorHistoryAction } from '~/controllers/history/actions/ColorHistoryAction';
import { ImagePoolHistoryAction } from '~/controllers/history/actions/ImagePoolHistoryAction';
import { ImagePoolEntry } from '~/models/canvas/image_pool/ImagePool';
import { PaletteType } from '~/models/color/PaletteType';
import { canvasStore } from '~/stores/ProjectStores';

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
    // Drop a few known test IDs if present
    ['rnd-a', 'rnd-b', 'rnd-c'].forEach((id) => {
      if (getEntry(id)) removeEntry(id);
    });
  });

  it('randomized sequence → undo-all → redo-all is consistent and idempotent', () => {
    const rng = makeRng(42);
    const LOG_RND = process.env.VITEST_LOG_RND === '1';
    const hc = new ProjectHistoryController();

    const initial = {
      color: currentColor(),
      canvas: { ...canvasStore.canvas },
      poolIds: ['rnd-a', 'rnd-b', 'rnd-c'].map((id) => !!getEntry(id)),
    };

    // Predefined candidate entries for pool operations
    const entries: Record<string, ImagePoolEntry> = {
      'rnd-a': {
        id: 'rnd-a',
        originalPath: 'C:/dummyA.png',
        resourcePath: 'C:/dummyA.png',
        fileName: 'dummyA.png',
        x: 0,
        y: 0,
        scale: 1,
        width: 8,
        height: 8,
        opacity: 1,
        visible: true,
      },
      'rnd-b': {
        id: 'rnd-b',
        originalPath: 'C:/dummyB.png',
        resourcePath: 'C:/dummyB.png',
        fileName: 'dummyB.png',
        x: 1,
        y: 1,
        scale: 1,
        width: 12,
        height: 12,
        opacity: 1,
        visible: true,
      },
      'rnd-c': {
        id: 'rnd-c',
        originalPath: 'C:/dummyC.png',
        resourcePath: 'C:/dummyC.png',
        fileName: 'dummyC.png',
        x: 2,
        y: 2,
        scale: 1,
        width: 16,
        height: 16,
        opacity: 1,
        visible: true,
      },
    };

    // Build a short random sequence of actions
    const steps: Array<() => void> = [];
    const stepDescs: string[] = [];
    const N = 20; // keep short/light
    for (let i = 0; i < N; i++) {
      const pick = Math.floor(rng() * 3);
      if (pick === 0) {
        // Color toggle among a tiny palette
        const targets = ['#000000', '#ff0000', '#00ff00', '#0000ff'] as const;
        const next = targets[Math.floor(rng() * targets.length)];
        const prev = currentColor();
        const a = new ColorHistoryAction(
          PaletteType.primary,
          // ColorHistoryAction expects RGBA tuples; we store via hex on controller
          hexToRgbaTuple(prev),
          hexToRgbaTuple(next),
          { from: 'rnd' }
        );
        steps.push(() => {
          a.redo();
          hc.addAction(a);
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
        const a = new CanvasSizeHistoryAction(cur, next, { from: 'rnd' });
        steps.push(() => {
          a.redo();
          hc.addAction(a);
        });
        stepDescs.push(`Canvas ${cur.width}x${cur.height} -> ${next.width}x${next.height}`);
      } else {
        // ImagePool add/remove on one of the fixed ids
        const keys = Object.keys(entries);
        const id = keys[Math.floor(rng() * keys.length)];
        const exists = !!getEntry(id);
        const kind = exists ? 'remove' : 'add';
        const a = new ImagePoolHistoryAction(kind as 'add' | 'remove', entries[id], { from: 'rnd' });
        steps.push(() => {
          a.redo();
          hc.addAction(a);
        });
        stepDescs.push(`ImagePool ${kind} ${id}`);
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

    const final = {
      color: currentColor(),
      canvas: { ...canvasStore.canvas },
      poolIds: ['rnd-a', 'rnd-b', 'rnd-c'].map((id) => !!getEntry(id)),
    };

    // Undo all → initial snapshot
    while (hc.canUndo()) hc.undo();
    expect(currentColor()).toBe(initial.color);
    expect(canvasStore.canvas.width).toBe(initial.canvas.width);
    expect(canvasStore.canvas.height).toBe(initial.canvas.height);
    expect(['rnd-a', 'rnd-b', 'rnd-c'].map((id) => !!getEntry(id))).toEqual(initial.poolIds);

    // Redo all → final snapshot
    while (hc.canRedo()) hc.redo();
    expect(currentColor()).toBe(final.color);
    expect(canvasStore.canvas.width).toBe(final.canvas.width);
    expect(canvasStore.canvas.height).toBe(final.canvas.height);
    expect(['rnd-a', 'rnd-b', 'rnd-c'].map((id) => !!getEntry(id))).toEqual(final.poolIds);

    // Idempotency check: repeat once more
    while (hc.canUndo()) hc.undo();
    while (hc.canRedo()) hc.redo();
    expect(currentColor()).toBe(final.color);
    expect(canvasStore.canvas.width).toBe(final.canvas.width);
    expect(canvasStore.canvas.height).toBe(final.canvas.height);
    expect(['rnd-a', 'rnd-b', 'rnd-c'].map((id) => !!getEntry(id))).toEqual(final.poolIds);
  });
});

// Local tiny helper to convert '#rrggbb' to [r,g,b,a]
function hexToRgbaTuple(hex: string): [number, number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return [r, g, b, 255];
}
