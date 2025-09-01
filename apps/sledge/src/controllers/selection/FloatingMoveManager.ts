// controllers/layer/SelectionManager.ts

import { Vec2 } from '@sledge/core';
import { DebugLogger } from '~/controllers/log/LogController';
import { eventBus } from '~/utils/EventBus';

export type MoveMode = 'selection' | 'layer';

export interface FloatingBuffer {
  buffer: Uint8ClampedArray;
  width: number;
  height: number;
  startOffset: Vec2;
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

  private floatingBuffer: FloatingBuffer | undefined = undefined;
  private state: MoveMode | undefined = undefined;

  // The offset from move start position.
  // This is supposed to be (0,0) when nothing is moved.
  // (because the final offset always calculated by [selection offset] + [move offset]).
  // Note: If floating buffer is not starting from (0,0),
  //       this offset should start with that offset. (e.g. most of the selection)
  private moveOffset: Vec2 = { x: 0, y: 0 };

  public setMoveOffset(moveOffset: Vec2) {
    this.moveOffset = moveOffset;
  }

  public getMoveOffset() {
    return this.moveOffset;
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
    this.moveOffset = floatingBuffer.startOffset;
  }

  public move(delta: Vec2) {
    this.logger.debugLog('move', { delta });
    this.moveOffset.x += delta.x;
    this.moveOffset.y += delta.y;

    eventBus.emit('selection:offsetChanged', { newOffset: this.moveOffset });
    return this.moveOffset;
  }

  public moveTo(pos: Vec2) {
    this.logger.debugLog('moveTo', { pos });
    this.moveOffset = pos;

    eventBus.emit('selection:offsetChanged', { newOffset: this.moveOffset });
    return this.moveOffset;
  }

  public commit() {
    this.logger.debugLog('commit', {});
    if (!this.floatingBuffer) {
      console.error('attempt to commit, but nothing is moving.');
      return;
    }

    // implement buffer commit.

    // Emit the commit event
    eventBus.emit('floatingMove:committed', { newOffset: this.moveOffset });

    // Reset the state
    this.floatingBuffer = undefined;
    this.state = undefined;
    this.moveOffset = { x: 0, y: 0 };
  }
}

export const selectionManager = new FloatingMoveManager();
