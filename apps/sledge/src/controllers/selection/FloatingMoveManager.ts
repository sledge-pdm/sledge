// controllers/layer/SelectionManager.ts

import { Vec2 } from '@sledge/core';
import { applyFloatingBuffer } from '~/appliers/FloatingBufferApplier';
import { getActiveAgent } from '~/controllers/layer/LayerAgentManager';
import { DebugLogger } from '~/controllers/log/LogController';
import { canvasStore } from '~/stores/ProjectStores';
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

  public startMove(floatingBuffer: FloatingBuffer, state: MoveMode) {
    this.logger.debugLog('startMove', { floatingBuffer, state });
    this.floatingBuffer = floatingBuffer;
    this.state = state;
  }

  // The operation right before commiting/preview.
  // For example, if move context was selection moving or pasting "cut" area,
  // original area should be deleted before moving.
  public preMove() {
    // for example:
    if (this.state === 'selection') {
      // Clear the original area in the preview buffer (not original buffer!)
    }
  }

  public async move(delta: Vec2) {
    this.logger.debugLog('move', { delta });
    if (!this.floatingBuffer || !this.movePreviewBuffer) {
      console.error('attempt to move, but nothing is moving.');
      return;
    }

    this.floatingBuffer.offset.x += delta.x;
    this.floatingBuffer.offset.y += delta.y;

    this.preMove();
    // update preview buffer
    this.movePreviewBuffer = await applyFloatingBuffer({
      width: canvasStore.canvas.width,
      height: canvasStore.canvas.height,
      floatingBuffer: this.floatingBuffer,
      target: this.movePreviewBuffer,
    });

    eventBus.emit('floatingMove:moved', {});

    return this.floatingBuffer;
  }

  public commit() {
    this.logger.debugLog('commit', {});
    if (!this.floatingBuffer || !this.movePreviewBuffer) {
      console.error('attempt to commit, but nothing is moving.');
      return;
    }

    // apply preview to actual buffer
    getActiveAgent()?.setBuffer(this.movePreviewBuffer);

    // Emit the commit event
    eventBus.emit('floatingMove:committed', {});

    // Reset the state
    this.floatingBuffer = undefined;
    this.state = undefined;
  }

  public cancel() {}
}

export const selectionManager = new FloatingMoveManager();
