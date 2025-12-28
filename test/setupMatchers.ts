import { expect } from 'vitest';
import type { ProjectHistoryController } from '~/features/history/controller';
import type { Layer } from '~/features/layer';

type CanvasLike = { width: number; height: number };

function layerIds(input: Layer[] | string[]): string[] {
  if (input.length === 0) return [];
  if (typeof input[0] === 'string') return input as string[];
  return (input as Layer[]).map((l) => l.id);
}

expect.extend({
  toHaveLayerOrder(received: Layer[] | string[], expected: string[]) {
    const ids = layerIds(received);
    const pass = JSON.stringify(ids) === JSON.stringify(expected);
    return {
      pass,
      message: () => `expected layer order ${expected.join(', ')} but got ${ids.join(', ') || '<empty>'}`,
    };
  },
  toHaveCanvasSize(received: CanvasLike, expected: CanvasLike) {
    const pass = received.width === expected.width && received.height === expected.height;
    return {
      pass,
      message: () => `expected canvas ${expected.width}x${expected.height} but got ${received.width}x${received.height}`,
    };
  },
  toMatchHistoryState(received: ProjectHistoryController, expected: { canUndo: boolean; canRedo: boolean }) {
    const pass = received.canUndo() === expected.canUndo && received.canRedo() === expected.canRedo;
    return {
      pass,
      message: () =>
        `expected history state undo=${expected.canUndo} redo=${expected.canRedo} but got undo=${received.canUndo()} redo=${received.canRedo()}`,
    };
  },
});

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Assertion<T = any> {
    toHaveLayerOrder(expected: string[]): void;
    toHaveCanvasSize(expected: CanvasLike): void;
    toMatchHistoryState(expected: { canUndo: boolean; canRedo: boolean }): void;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface AsymmetricMatchersContaining {
    toHaveLayerOrder(expected: string[]): void;
    toHaveCanvasSize(expected: CanvasLike): void;
    toMatchHistoryState(expected: { canUndo: boolean; canRedo: boolean }): void;
  }
}
