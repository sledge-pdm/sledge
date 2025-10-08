// controllers/layer/SelectionManager.ts

import { Vec2 } from '@sledge/core';
import { crop_patch_rgba } from '@sledge/wasm';
import { applyFloatingBuffer } from '~/appliers/FloatingBufferApplier';
import { projectHistoryController } from '~/features/history';
import { AnvilLayerHistoryAction } from '~/features/history/actions/AnvilLayerHistoryAction';
// import { getActiveAgent, getAgentOf, getBufferOf } from '~/features/layer/agent/LayerAgentManager'; // legacy
import {
  flushPatch,
  getBufferCopy,
  getBufferPointer,
  getHeight,
  getWidth,
  registerWholeChange,
  setBuffer,
} from '~/features/layer/anvil/AnvilController';
import { DebugLogger } from '~/features/log/service';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { canvasStore } from '~/stores/ProjectStores';
import { TOOL_CATEGORIES } from '~/tools/Tools';
import { eventBus } from '~/utils/EventBus';

export type MoveMode = 'selection' | 'layer' | 'pasted';

export interface FloatingBuffer {
  buffer: Uint8ClampedArray;
  width: number;
  height: number;
  offset: Vec2;
}

// Usage:
//
// ```ts
// const manager = new FloatingMoveManager();
// // Let's create a new floating buffer (paste)
// const floatingBuffer = { buffer: new Uint8ClampedArray(100 * 100 * 4), width: 100, height: 100, startOffset: { x: 0, y: 0 } };
// manager.startMove(floatingBuffer, 'selection');
// manager.move({ x: 10, y: 10 }); // moveOffset is now {x: 10, y: 10}.
// manager.commit(); // commit the move (floatingBuffer is pasted to the active layer in (10, 10))
// ```

class FloatingMoveManager {
  private readonly LOG_LABEL = 'FloatingMoveManager';
  private logger = new DebugLogger(this.LOG_LABEL, false);

  private targetLayerId: string | undefined = undefined;
  private targetBuffer: Uint8ClampedArray | undefined = undefined;
  // moveOffsetを扱う代わりに、FloatingBufferにoffsetを持たせるようにする。
  // これにより、選択範囲のoffsetをmoveに引きついで扱える。
  private floatingBuffer: FloatingBuffer | undefined = undefined;

  // Don't modify original layer buffer while moving.
  // instead, create a preview buffer and conditionally use it.
  private movePreviewBuffer: Uint8ClampedArray | undefined = undefined; // should be same size as layer/canvas.
  private state: MoveMode | undefined = undefined;

  public getPreviewBuffer() {
    return this.movePreviewBuffer;
  }

  public getFloatingBuffer() {
    return this.floatingBuffer;
  }

  public isMoving() {
    return this.floatingBuffer !== undefined;
  }

  public getState() {
    return this.state;
  }

  constructor() {}

  private getBaseBuffer(state: MoveMode, targetLayerId: string): Uint8ClampedArray | undefined {
    const width = getWidth(targetLayerId);
    const height = getHeight(targetLayerId);
    if (width == null || height == null) return undefined;
    if (state === 'layer') {
      return new Uint8ClampedArray(width * height * 4);
    } else if (state === 'selection') {
      const base = getBufferPointer(targetLayerId);
      if (!base) return undefined;
      const mask = selectionManager.getCombinedMask();
      const croppedBuffer = crop_patch_rgba(new Uint8Array(base.buffer), width, height, new Uint8Array(mask), width, height, 0, 0);
      return new Uint8ClampedArray(croppedBuffer.buffer);
    } else if (state === 'pasted') {
      const base = getBufferCopy(targetLayerId);
      return base ? base.slice() : undefined;
    }
  }

  public async startMove(floatingBuffer: FloatingBuffer, state: MoveMode, targetLayerId: string) {
    this.targetBuffer = this.getBaseBuffer(state, targetLayerId);
    if (!this.targetBuffer) return;

    this.targetLayerId = targetLayerId;

    this.logger.debugLog('startMove', { floatingBuffer, state });
    this.floatingBuffer = floatingBuffer;
    this.state = state;

    this.movePreviewBuffer = applyFloatingBuffer({
      width: canvasStore.canvas.width,
      height: canvasStore.canvas.height,
      floatingBuffer: this.floatingBuffer,
      target: this.targetBuffer,
    });

    eventBus.emit('floatingMove:moved', {});
    eventBus.emit('selection:offsetChanged', { newOffset: this.floatingBuffer.offset });
    eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: 'floating-move' });
    eventBus.emit('preview:requestUpdate', { layerId: this.targetLayerId });

    eventBus.emit('floatingMove:stateChanged', { moving: true });
  }

  public async moveDelta(delta: Vec2) {
    this.logger.debugLog('moveDelta', { delta });
    if (!this.floatingBuffer || !this.movePreviewBuffer) {
      console.error('attempt to move, but nothing is moving.');
      return;
    }

    this.floatingBuffer.offset.x += delta.x;
    this.floatingBuffer.offset.y += delta.y;

    return this.updatePreview();
  }

  public async moveTo(newOffset: Vec2) {
    this.logger.debugLog('moveTo', { offset: newOffset });
    if (!this.floatingBuffer || !this.movePreviewBuffer) {
      console.error('attempt to move, but nothing is moving.');
      return;
    }

    this.floatingBuffer.offset = newOffset;

    return this.updatePreview();
  }

  public updatePreview() {
    if (!this.floatingBuffer || !this.movePreviewBuffer || !this.targetBuffer) {
      console.error('attempt to move, but nothing is moving.');
      return;
    }

    // update preview buffer
    this.movePreviewBuffer = applyFloatingBuffer({
      width: canvasStore.canvas.width,
      height: canvasStore.canvas.height,
      floatingBuffer: this.floatingBuffer,
      target: this.targetBuffer,
    });

    eventBus.emit('floatingMove:moved', {});
    eventBus.emit('selection:offsetChanged', { newOffset: this.floatingBuffer.offset });
    eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: 'floating-move' });
    eventBus.emit('preview:requestUpdate', { layerId: this.targetLayerId });

    return this.floatingBuffer;
  }

  public commit() {
    this.logger.debugLog('commit', {});
    if (!this.targetLayerId || !this.targetBuffer) {
      console.error('attempt to commit, but no target layer or buffer is set.');
      return;
    }
    if (!this.floatingBuffer || !this.movePreviewBuffer) {
      console.error('attempt to commit, but nothing is moving.');
      return;
    }

    // update preview buffer
    this.movePreviewBuffer = applyFloatingBuffer({
      width: canvasStore.canvas.width,
      height: canvasStore.canvas.height,
      floatingBuffer: this.floatingBuffer,
      target: this.targetBuffer,
    });

    const beforeBuffer = getBufferCopy(this.targetLayerId);
    if (beforeBuffer) {
      setBuffer(this.targetLayerId, this.movePreviewBuffer);
      registerWholeChange(this.targetLayerId, beforeBuffer, this.movePreviewBuffer.slice());
      const patch = flushPatch(this.targetLayerId);
      if (patch) {
        projectHistoryController.addAction(new AnvilLayerHistoryAction(this.targetLayerId, patch, { tool: TOOL_CATEGORIES.MOVE }));
      }
    }

    // Emit the commit event
    eventBus.emit('floatingMove:committed', {});

    if (this.getState() === 'layer' || this.getState() === 'pasted') {
      selectionManager.clear();
    } else {
      const newOffset = this.floatingBuffer.offset;
      selectionManager.shiftOffset(newOffset);
      selectionManager.commitOffset();

      eventBus.emit('selection:offsetChanged', { newOffset });
      eventBus.emit('selection:maskChanged', { commit: true });
    }

    // Reset the state
    this.state = undefined;
    this.floatingBuffer = undefined;
    this.targetLayerId = undefined;
    this.targetBuffer = undefined;
    eventBus.emit('floatingMove:stateChanged', { moving: false });
    eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: 'floating-move' });
    eventBus.emit('preview:requestUpdate', { layerId: this.targetLayerId });
  }

  public cancel() {
    //cancel
    if (this.getState() === 'layer' || this.getState() === 'pasted') {
      selectionManager.clear();
    }
    // Reset the state
    this.state = undefined;
    this.floatingBuffer = undefined;
    this.targetLayerId = undefined;
    this.targetBuffer = undefined;

    eventBus.emit('floatingMove:stateChanged', { moving: false });
  }
}

export const floatingMoveManager = new FloatingMoveManager();
