// controllers/layer/SelectionManager.ts

import { rawToWebp, webpToRaw } from '@sledge/anvil';
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
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { DebugLogger } from '~/features/log/service';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { TOOL_CATEGORIES } from '~/features/tools/Tools';
import { canvasStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';

export type MoveMode = 'selection' | 'layer' | 'pasted';

export interface FloatingBuffer {
  buffer: Uint8ClampedArray;
  width: number;
  height: number;
  offset: Vec2;
}

class FloatingMoveManager {
  private readonly LOG_LABEL = 'FloatingMoveManager';
  private logger = new DebugLogger(this.LOG_LABEL, false);

  private targetLayerId: string | undefined = undefined;

  public getTargetLayerId(): string | undefined {
    return this.targetLayerId;
  }
  private targetBufferOriginal:
    | {
        buffer: Uint8Array;
        width: number;
        height: number;
      }
    | undefined = undefined;
  private targetBuffer: Uint8ClampedArray | undefined = undefined;
  private floatingBuffer: FloatingBuffer | undefined = undefined;

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
    const anvil = getAnvilOf(targetLayerId);
    if (!anvil) return;
    const webpBuffer = rawToWebp(new Uint8Array(anvil.getBufferData().buffer), anvil.getWidth(), anvil.getHeight());
    if (!webpBuffer) return;
    this.targetBufferOriginal = {
      buffer: webpBuffer,
      width: anvil.getWidth(),
      height: anvil.getHeight(),
    };
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

    eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: 'floating-move' });
    eventBus.emit('preview:requestUpdate', { layerId: this.targetLayerId });

    eventBus.emit('selection:updateSelectionMenu', {});
    eventBus.emit('selection:updateSVGRect', {});
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

    eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: 'floating-move' });
    eventBus.emit('preview:requestUpdate', { layerId: this.targetLayerId });
    eventBus.emit('selection:updateSelectionMenu', {});
    eventBus.emit('selection:updateSVGRect', {});

    return this.floatingBuffer;
  }

  public commit() {
    this.logger.debugLog('commit', {});
    if (!this.targetLayerId || !this.targetBuffer || !this.targetBufferOriginal) {
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

    setBuffer(this.targetLayerId, this.movePreviewBuffer);
    const orig = webpToRaw(this.targetBufferOriginal.buffer, this.targetBufferOriginal.width, this.targetBufferOriginal.height);
    if (orig) registerWholeChange(this.targetLayerId, new Uint8ClampedArray(orig.buffer));
    const patch = flushPatch(this.targetLayerId);
    if (patch) {
      projectHistoryController.addAction(new AnvilLayerHistoryAction(this.targetLayerId, patch, { tool: TOOL_CATEGORIES.MOVE }));
    }
    if (this.getState() === 'layer' || this.getState() === 'pasted') {
      selectionManager.clear();
    } else {
      const newOffset = this.floatingBuffer.offset;
      selectionManager.shiftOffset(newOffset);
      selectionManager.commitOffset();
    }

    // Reset the state
    this.state = undefined;
    this.floatingBuffer = undefined;
    this.targetLayerId = undefined;
    this.targetBuffer = undefined;

    eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: 'floating-move' });
    eventBus.emit('preview:requestUpdate', { layerId: this.targetLayerId });

    eventBus.emit('selection:updateSelectionMenu', { immediate: true });
    eventBus.emit('selection:updateSVGRect', { immediate: true });
  }

  public cancel() {
    // Reset the state
    this.state = undefined;
    this.floatingBuffer = undefined;

    eventBus.emit('selection:updateSelectionMenu', { immediate: true });
    eventBus.emit('selection:updateSVGRect', { immediate: true });
  }
}

export const floatingMoveManager = new FloatingMoveManager();
