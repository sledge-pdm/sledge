// controllers/layer/SelectionManager.ts
import { RgbaBuffer } from '@sledge/anvil';
import { Vec2 } from '@sledge/core';
import { projectHistoryController } from '~/features/history';
import { AnvilLayerHistoryAction } from '~/features/history/actions/AnvilLayerHistoryAction';
// import { getActiveAgent, getAgentOf, getBufferOf } from '~/features/layer/agent/LayerAgentManager'; // legacy
import { getAnvil } from '~/features/layer/anvil/AnvilManager';
import { DebugLogger } from '~/features/log/DebugLogger';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { TOOL_CATEGORIES } from '~/features/tools/Tools';
import { canvasStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';

export type MoveMode = 'selection' | 'layer' | 'pasted';

export interface FloatingBuffer {
  buffer: Uint8ClampedArray;
  width: number;
  height: number;
  offset: Vec2;
  origin?: Vec2;
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

  private overlayVersion = 0;
  private state: MoveMode | undefined = undefined;

  public getPreviewBuffer(): Uint8ClampedArray | undefined {
    return this.targetBuffer;
  }

  public getFloatingBuffer() {
    return this.floatingBuffer;
  }

  public getCompositePreview(): Uint8ClampedArray | undefined {
    if (!this.targetBuffer || !this.floatingBuffer || !canvasStore.canvas) return undefined;
    const buffer = RgbaBuffer.fromRaw(canvasStore.canvas.width, canvasStore.canvas.height, this.targetBuffer);
    const originX = this.floatingBuffer.origin?.x ?? 0;
    const originY = this.floatingBuffer.origin?.y ?? 0;
    buffer.transferFromRaw(this.floatingBuffer.buffer, this.floatingBuffer.width, this.floatingBuffer.height, {
      offsetX: Math.round(originX + this.floatingBuffer.offset.x),
      offsetY: Math.round(originY + this.floatingBuffer.offset.y),
    });

    return buffer.data;
  }

  public getOverlayDescriptor():
    | {
        buffer: Uint8ClampedArray;
        width: number;
        height: number;
        position: Vec2;
        version: number;
      }
    | undefined {
    if (!this.floatingBuffer) return undefined;
    const origin = this.floatingBuffer.origin ?? { x: 0, y: 0 };
    return {
      buffer: this.floatingBuffer.buffer,
      width: this.floatingBuffer.width,
      height: this.floatingBuffer.height,
      position: {
        x: origin.x + this.floatingBuffer.offset.x,
        y: origin.y + this.floatingBuffer.offset.y,
      },
      version: this.overlayVersion,
    };
  }

  public isMoving() {
    return this.floatingBuffer !== undefined;
  }

  public getState() {
    return this.state;
  }

  constructor() {}

  private requestFrame(immediate?: boolean, layerIdOverride?: string) {
    const layerId = layerIdOverride ?? this.targetLayerId;
    updateWebGLCanvas(false, 'floating-move');
    updateLayerPreview(layerId);
    const payload = immediate ? { immediate: true } : {};
    eventBus.emit('selection:updateSelectionMenu', payload);
    eventBus.emit('selection:updateSelectionPath', payload);
  }

  private getBaseBuffer(state: MoveMode, targetLayerId: string): Uint8ClampedArray | undefined {
    const anvil = getAnvil(targetLayerId);
    const width = anvil.getWidth();
    const height = anvil.getHeight();
    if (width == null || height == null) return undefined;
    if (state === 'layer') {
      return new Uint8ClampedArray(width * height * 4);
    } else if (state === 'selection') {
      const anvil = getAnvil(targetLayerId);
      const mask = selectionManager.getCombinedMask();
      return anvil.cropWithMask(mask, width, height, 0, 0);
    } else if (state === 'pasted') {
      const base = anvil.getBufferCopy();
      return base ? base.slice() : undefined;
    }
  }

  public async startMove(floatingBuffer: FloatingBuffer, state: MoveMode, targetLayerId: string) {
    const anvil = getAnvil(targetLayerId);
    const webpBuffer = anvil.exportWebp();
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
    this.overlayVersion++;

    this.requestFrame();
  }

  public async moveDelta(delta: Vec2) {
    this.logger.debugLog('moveDelta', { delta });
    if (!this.floatingBuffer) {
      console.error('attempt to move, but nothing is moving.');
      return;
    }

    this.floatingBuffer.offset.x += delta.x;
    this.floatingBuffer.offset.y += delta.y;

    this.requestFrame();
    return this.floatingBuffer;
  }

  public async moveTo(newOffset: Vec2) {
    this.logger.debugLog('moveTo', { offset: newOffset });
    if (!this.floatingBuffer) {
      console.error('attempt to move, but nothing is moving.');
      return;
    }

    this.floatingBuffer.offset = newOffset;

    this.requestFrame();
    return this.floatingBuffer;
  }

  public commit() {
    this.logger.debugLog('commit', {});
    if (!this.targetLayerId || !this.targetBuffer || !this.targetBufferOriginal) {
      console.error('attempt to commit, but no target layer or buffer is set.');
      return;
    }
    if (!this.floatingBuffer) {
      console.error('attempt to commit, but nothing is moving.');
      return;
    }

    const composed = this.getCompositePreview();
    if (!composed) {
      console.error('failed to build composed preview for commit');
      return;
    }

    const anvil = getAnvil(this.targetLayerId);
    anvil.replaceBuffer(composed, this.targetBufferOriginal.width, this.targetBufferOriginal.height);

    anvil.addCurrentWholeDiff();

    const patch = anvil.flushDiffs();
    if (patch) {
      projectHistoryController.addAction(
        new AnvilLayerHistoryAction({
          layerId: this.targetLayerId,
          patch,
          context: { tool: TOOL_CATEGORIES.MOVE },
        })
      );
    }

    if (this.getState() === 'layer' || this.getState() === 'pasted') {
      selectionManager.clear();
    } else {
      const newOffset = this.floatingBuffer.offset;
      selectionManager.shiftOffset(newOffset);
      selectionManager.commitOffset();
    }

    // Reset the state
    const layerId = this.targetLayerId;
    this.state = undefined;
    this.floatingBuffer = undefined;
    this.targetLayerId = undefined;
    this.targetBuffer = undefined;
    this.targetBufferOriginal = undefined;
    this.overlayVersion++;

    this.requestFrame(true, layerId);
  }

  public cancel() {
    // Reset the state
    const layerId = this.targetLayerId;
    this.state = undefined;
    this.floatingBuffer = undefined;
    this.targetLayerId = undefined;
    this.targetBuffer = undefined;
    this.targetBufferOriginal = undefined;
    this.overlayVersion++;

    this.requestFrame(true, layerId);
  }
}

export const floatingMoveManager = new FloatingMoveManager();
