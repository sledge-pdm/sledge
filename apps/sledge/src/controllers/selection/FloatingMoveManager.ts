// controllers/layer/SelectionManager.ts

import { Vec2 } from '@sledge/core';
import { crop_patch_rgba } from '@sledge/wasm';
import { applyFloatingBuffer } from '~/appliers/FloatingBufferApplier';
import { LayerBufferHistoryAction } from '~/controllers/history/actions/LayerBufferHistoryAction';
import { projectHistoryController } from '~/controllers/history/ProjectHistoryController';
import { getActiveAgent, getAgentOf, getBufferOf } from '~/controllers/layer/LayerAgentManager';
import { DebugLogger } from '~/controllers/log/LogController';
import { selectionManager } from '~/controllers/selection/SelectionAreaManager';
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
  private logger = new DebugLogger(this.LOG_LABEL, true);

  private targetLayerId: string | undefined = undefined;
  private targetBuffer: Uint8ClampedArray | undefined = undefined;
  // moveOffsetを扱う代わりに、FloatingBufferにoffsetを持たせるようにする。
  // これにより、選択範囲のoffsetをmoveに引きついで扱える。
  private floatingBuffer: FloatingBuffer | undefined = undefined;

  // Don't modify original layer buffer while moving.
  // instead, create a preview buffer and conditionally use it.
  // 注釈: 現在はオリジナルの元バッファを保持したうえで、オリジナルのバッファを改変してしまっています。
  // それだと保存やエクスポートの時にcommitされていない変更が載ってしまうので、プレビュー用バッファを用意したうえでwebGLに渡すときに
  //   const buffer = layer.id === layerListStore.activeLayerId && floatingMoveManager.isMoving() ? floatingMoveManager.movePreviewBuffer : getBufferOf(layer.id);
  // のようにする方が安全と思います。
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
    const targetAgent = getAgentOf(targetLayerId);
    if (!targetAgent) return;
    if (state === 'layer') {
      // layer: source layer = target layer
      // move whole layer so return empty buffer
      return new Uint8ClampedArray(targetAgent.getWidth() * targetAgent.getHeight() * 4);
    } else if (state === 'selection') {
      // selection: source layer = target layer
      // move selection so return buffer cropped by selection

      // slice buffer by mask
      const width = targetAgent.getWidth();
      const height = targetAgent.getHeight();
      const croppedBuffer = crop_patch_rgba(
        // source
        new Uint8Array(targetAgent.getBuffer()),
        width,
        height,
        new Uint8Array(selectionManager.getCombinedMask()),
        width,
        height,
        0,
        0
      );
      return new Uint8ClampedArray(croppedBuffer.buffer);
    } else if (state === 'pasted') {
      // pasted: source is pasted buffer so just return target buffer
      return targetAgent.getBuffer().slice() as Uint8ClampedArray;
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

    const beforeBuffer = getBufferOf(this.targetLayerId);

    // apply preview to actual buffer
    getActiveAgent()?.setBuffer(this.movePreviewBuffer);

    if (beforeBuffer) {
      // just record buffer change.
      // should be replaced by SelectionHistoryAction or something.
      const action = new LayerBufferHistoryAction(
        this.targetLayerId,
        {
          layerId: this.targetLayerId,
          whole: {
            type: 'whole',
            before: beforeBuffer,
            after: this.movePreviewBuffer.slice(),
          },
        },
        { from: 'LayerImageAgent.registerToHistory', tool: TOOL_CATEGORIES.MOVE }
      );
      projectHistoryController.addAction(action);
    }

    // Emit the commit event
    eventBus.emit('floatingMove:committed', {});

    if (this.state === 'layer') {
      selectionManager.clear();
    }
    // Reset the state
    this.state = undefined;
    this.floatingBuffer = undefined;
    this.targetLayerId = undefined;
    this.targetBuffer = undefined;

    eventBus.emit('floatingMove:stateChanged', { moving: false });
  }

  public cancel() {
    //cancel
    if (this.getState() === 'layer') {
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
