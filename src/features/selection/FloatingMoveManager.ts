// controllers/layer/SelectionManager.ts
import { Vec2 } from '@sledge-pdm/core';
import { VERBOSE_LOG_ENABLED } from '~/Consts';
import { beginEditSession } from '~/features/edit_session';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { logSystemError, logSystemInfo } from '~/features/log/service';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { TOOL_CATEGORIES } from '~/features/tools/Tools';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { apply_mask_offset } from '~/utils/wasm';
import { updateFrascoCanvas } from '~/webgl/service';

export type MoveMode = 'selection' | 'pasted';
type FloatingMoveListener = () => void;

export interface FloatingBuffer {
  buffer: Uint8ClampedArray;
  width: number;
  height: number;
  offset: Vec2;
  origin?: Vec2;
}

class FloatingMoveManager {
  private readonly LOG_LABEL = 'FloatingMoveManager';

  private targetLayerId: string | undefined = undefined;

  public getTargetLayerId(): string | undefined {
    return this.targetLayerId;
  }
  private targetBufferOriginal:
    | {
        buffer: Uint8ClampedArray;
        width: number;
        height: number;
      }
    | undefined = undefined;
  private targetBuffer: Uint8ClampedArray | undefined = undefined;
  private floatingBuffer: FloatingBuffer | undefined = undefined;
  private compositeBuffer: Uint8ClampedArray | undefined;
  private floatingArea: SelectionMask | undefined;

  private overlayVersion = 0;
  private state: MoveMode | undefined = undefined;
  private listeners = new Set<FloatingMoveListener>();
  /** closes the edit session this move opened; undefined while no move is floating. */
  private endSession: (() => void) | undefined = undefined;

  public getPreviewBuffer(): Uint8ClampedArray | undefined {
    return this.targetBuffer;
  }

  public getFloatingBuffer() {
    return this.floatingBuffer;
  }

  public getFloatingArea() {
    return this.floatingArea;
  }

  public getOffset() {
    return this.floatingBuffer?.offset;
  }

  public getCompositePreview(): Uint8ClampedArray | undefined {
    if (!this.targetBuffer || !this.floatingBuffer) return undefined;
    const width = this.targetBufferOriginal?.width ?? projectStore.canvas.size?.width;
    const height = this.targetBufferOriginal?.height ?? projectStore.canvas.size?.height;
    if (!width || !height) return undefined;

    const expected = width * height * 4;
    if (!this.compositeBuffer || this.compositeBuffer.length !== expected) {
      this.compositeBuffer = new Uint8ClampedArray(expected);
    }

    this.compositeBuffer.set(this.targetBuffer);
    const originX = this.floatingBuffer.origin?.x ?? 0;
    const originY = this.floatingBuffer.origin?.y ?? 0;
    const offsetX = Math.round(originX + this.floatingBuffer.offset.x);
    const offsetY = Math.round(originY + this.floatingBuffer.offset.y);
    blendBuffer(
      this.compositeBuffer,
      width,
      height,
      this.floatingBuffer.buffer,
      this.floatingBuffer.width,
      this.floatingBuffer.height,
      offsetX,
      offsetY
    );

    return this.compositeBuffer;
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

  private requestFrame() {
    updateFrascoCanvas('floating-move');
    this.emitChange();
  }

  private getBaseBuffer(state: MoveMode, targetLayerId: string): Uint8ClampedArray | undefined {
    const width = projectStore.canvas.size?.width;
    const height = projectStore.canvas.size?.height;
    if (width == null || height == null) return undefined;
    const base = layerManager.exportRawCanvas(targetLayerId);
    if (state === 'selection') {
      const mask = this.floatingArea?.getMask() ?? selectionManager.getBack()?.getMask();
      if (!mask) return new Uint8ClampedArray(base);
      const cleared = new Uint8ClampedArray(base);
      clearMaskedPixels(cleared, mask, width, height);
      return cleared;
    } else if (state === 'pasted') {
      return new Uint8ClampedArray(base);
    }
  }

  public async startMove(floatingBuffer: FloatingBuffer, state: MoveMode, targetLayerId: string, selectionMask?: SelectionMask) {
    this.compositeBuffer = undefined;
    this.floatingArea = selectionMask ? cloneMask(selectionMask) : undefined;
    const base = layerManager.exportRawCanvas(targetLayerId);
    this.targetBufferOriginal = {
      buffer: base,
      width: projectStore.canvas.size.width,
      height: projectStore.canvas.size.height,
    };
    this.targetBuffer = this.getBaseBuffer(state, targetLayerId);
    if (!this.targetBuffer) return;

    this.targetLayerId = targetLayerId;

    this.debugLog('startMove', { floatingBuffer, state });
    this.floatingBuffer = floatingBuffer;
    this.state = state;
    this.overlayVersion++;

    // the move holds the layer's pixels from here until commit or cancel, and nothing else may edit them
    // in between. ending the session is part of `reset`, so every exit from the move closes it.
    this.endSession?.();
    this.endSession = beginEditSession({
      label: 'move',
      isExclusive: () => this.isMoving(),
      // the move has its own commit and cancel in the UI, so the user has not asked for it to be applied
      // yet - dropping it is the answer that does not put pixels somewhere they never confirmed.
      interrupt: () => this.cancel(),
      finalize: () => this.commit(),
    });

    this.requestFrame();
  }

  public async moveDelta(delta: Vec2) {
    this.debugLog('moveDelta', { delta });
    if (!this.floatingBuffer) {
      logSystemError('attempt to move, but nothing is moving.', { label: this.LOG_LABEL });
      return;
    }

    this.floatingBuffer.offset.x += delta.x;
    this.floatingBuffer.offset.y += delta.y;

    this.requestFrame();
    return this.floatingBuffer;
  }

  public async moveTo(newOffset: Vec2) {
    this.debugLog('moveTo', { offset: newOffset });
    if (!this.floatingBuffer) {
      logSystemError('attempt to move, but nothing is moving.', { label: this.LOG_LABEL });
      return;
    }

    this.floatingBuffer.offset = newOffset;

    this.requestFrame();
    return this.floatingBuffer;
  }

  /**
   * @description compose what the layer should hold once this move is applied.
   *
   *   the base is read from the layer here rather than reused from the copy `startMove` took, because a
   *   move floats until the user commits it and anything at all can edit the layer in that stretch - an
   *   effect, a clear, an undo. composing over the old copy would write those edits back out of existence.
   *   the preview path keeps using its own cached copy; only what is about to be made permanent is re-read.
   */
  private buildCommitBuffer(): { buffer: Uint8ClampedArray; width: number; height: number } | undefined {
    if (!this.targetLayerId || !this.floatingBuffer) return undefined;
    // the current canvas size, not the one recorded at startMove: a resize in between moved the goalposts.
    const width = projectStore.canvas.size?.width;
    const height = projectStore.canvas.size?.height;
    if (!width || !height) return undefined;

    // the layer can be gone by now - removed, or undone away - and reading a missing one throws. this is a
    // commit: it has to come back with something or nothing, never with an exception that skips the reset.
    let base: Uint8ClampedArray;
    try {
      base = new Uint8ClampedArray(layerManager.exportRawCanvas(this.targetLayerId));
    } catch {
      return undefined;
    }
    if (base.length !== width * height * 4) return undefined;

    // 'selection' lifted its pixels out of the layer, so the area they came from is cleared before the
    // floating buffer is put back down. 'pasted' brought its own pixels and leaves the layer as it is.
    const mask = this.state === 'selection' ? this.floatingArea?.getMask() : undefined;
    if (mask) clearMaskedPixels(base, mask, width, height);

    const originX = this.floatingBuffer.origin?.x ?? 0;
    const originY = this.floatingBuffer.origin?.y ?? 0;
    blendBuffer(
      base,
      width,
      height,
      this.floatingBuffer.buffer,
      this.floatingBuffer.width,
      this.floatingBuffer.height,
      Math.round(originX + this.floatingBuffer.offset.x),
      Math.round(originY + this.floatingBuffer.offset.y)
    );

    return { buffer: base, width, height };
  }

  public commit() {
    this.debugLog('commit', {});
    if (!this.floatingBuffer || !this.targetLayerId) {
      logSystemError('attempt to commit, but nothing is moving.', { label: this.LOG_LABEL });
      // nothing to apply, but the state still has to come back to rest - see `reset`.
      this.reset();
      return;
    }

    // whatever happens below, the move must not be left floating: the session stays exclusive until the
    // captured pixels are written back or dropped, and a move that never comes to rest can never be
    // committed or cancelled again.
    try {
      const composed = this.buildCommitBuffer();
      const layer = layerManager.getLayerOptional(this.targetLayerId);
      if (!composed || !layer) {
        // the layer this move was lifted from is gone - a remove, or an undo that took it away. there is
        // nowhere to put the pixels, so the move is dropped the way a cancel would drop it.
        logSystemError('attempt to commit, but the target layer is missing. the move is dropped.', { label: this.LOG_LABEL });
        this.restoreSelectionOnDrop();
        return;
      }

      layer.commitHistory(undefined, { context: { tool: TOOL_CATEGORIES.MOVE } });
      layerManager.replaceLayerBuffer(this.targetLayerId, composed.buffer, composed.width, composed.height, {
        inputSpace: 'canvas',
      });

      if (this.state === 'pasted') {
        selectionManager.clearAll();
      } else {
        const baseMask = this.floatingArea;
        if (baseMask) {
          const width = baseMask.getWidth();
          const height = baseMask.getHeight();
          const oldMask = baseMask.getMask();
          const offset = this.floatingBuffer.offset;
          const newMask = new Uint8Array(apply_mask_offset(oldMask, width, height, offset.x, offset.y));
          const updated = new SelectionMask(width, height);
          updated.setMask(newMask);
          selectionManager.setBack(updated);
          selectionManager.clearFront();
        } else {
          selectionManager.clearAll();
        }
      }
    } finally {
      this.reset();
    }
  }

  public cancel() {
    try {
      this.restoreSelectionOnDrop();
    } finally {
      this.reset();
    }
  }

  /** @description put the selection back where the move lifted it from, for a move that is not applied. */
  private restoreSelectionOnDrop() {
    if (this.state !== 'selection') return;
    if (this.floatingArea) {
      selectionManager.setBack(cloneMask(this.floatingArea));
      selectionManager.clearFront();
    } else {
      selectionManager.clearAll();
    }
  }

  /**
   * @description bring the move back to rest and close its edit session.
   *
   *   every exit from a move goes through here, including the ones that failed partway: the session is
   *   only allowed to stop being exclusive once the captured pixels have been written back or dropped, and
   *   a move left holding them is one nothing can commit or cancel any more.
   */
  private reset() {
    this.state = undefined;
    this.floatingBuffer = undefined;
    this.targetLayerId = undefined;
    this.targetBuffer = undefined;
    this.targetBufferOriginal = undefined;
    this.compositeBuffer = undefined;
    this.overlayVersion++;
    this.floatingArea = undefined;

    this.endSession?.();
    this.endSession = undefined;

    this.requestFrame();
  }

  subscribe(listener: FloatingMoveListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private debugLog(message: string, ...details: unknown[]) {
    if (VERBOSE_LOG_ENABLED)
      logSystemInfo(message, {
        label: this.LOG_LABEL,
        details: details.length ? details : undefined,
        debugOnly: true,
      });
  }

  private emitChange() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const floatingMoveManager = new FloatingMoveManager();

const cloneMask = (mask: SelectionMask): SelectionMask => {
  const cloned = new SelectionMask(mask.getWidth(), mask.getHeight());
  cloned.setMask(new Uint8Array(mask.getMask()));
  return cloned;
};

function clearMaskedPixels(buffer: Uint8ClampedArray, mask: Uint8Array, width: number, height: number) {
  const expected = width * height;
  if (mask.length !== expected) {
    return;
  }
  for (let i = 0; i < expected; i++) {
    if (mask[i] === 0) continue;
    const idx = i * 4;
    buffer[idx] = 0;
    buffer[idx + 1] = 0;
    buffer[idx + 2] = 0;
    buffer[idx + 3] = 0;
  }
}

function blendBuffer(
  dst: Uint8ClampedArray,
  dstWidth: number,
  dstHeight: number,
  src: Uint8ClampedArray,
  srcWidth: number,
  srcHeight: number,
  offsetX: number,
  offsetY: number
) {
  for (let y = 0; y < srcHeight; y++) {
    const dstY = y + offsetY;
    if (dstY < 0 || dstY >= dstHeight) continue;
    for (let x = 0; x < srcWidth; x++) {
      const dstX = x + offsetX;
      if (dstX < 0 || dstX >= dstWidth) continue;
      const srcIdx = (y * srcWidth + x) * 4;
      const srcA = src[srcIdx + 3];
      if (srcA === 0) continue;
      const dstIdx = (dstY * dstWidth + dstX) * 4;
      const invA = 255 - srcA;
      dst[dstIdx] = Math.round((src[srcIdx] * srcA + dst[dstIdx] * invA) / 255);
      dst[dstIdx + 1] = Math.round((src[srcIdx + 1] * srcA + dst[dstIdx + 1] * invA) / 255);
      dst[dstIdx + 2] = Math.round((src[srcIdx + 2] * srcA + dst[dstIdx + 2] * invA) / 255);
      dst[dstIdx + 3] = Math.min(255, srcA + Math.round((dst[dstIdx + 3] * invA) / 255));
    }
  }
}
