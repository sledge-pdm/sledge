import { PixelBuffer } from '@sledge/anvil';
import { FloatingBuffer } from '~/features/selection/FloatingMoveManager';

export interface FloatingBufferApplyParams {
  width: number; // target full width
  height: number; // target full height
  floatingBuffer: FloatingBuffer;
  target: Uint8ClampedArray; // base buffer to patch (copied by caller if needed)
}

// Pure helper: returns new patched buffer (does NOT touch Anvil or history)
export function applyFloatingBuffer({ width, height, floatingBuffer, target }: FloatingBufferApplyParams): Uint8ClampedArray {
  try {
    const buffer = PixelBuffer.fromRaw(width, height, target);
    buffer.transferFromRaw(floatingBuffer.buffer, floatingBuffer.width, floatingBuffer.height, {
      offsetX: floatingBuffer.offset.x,
      offsetY: floatingBuffer.offset.y,
    });
    return new Uint8ClampedArray(buffer.data);
  } catch (e) {
    console.error('applyFloatingBuffer wasm error', e);
    return target;
  }
}
