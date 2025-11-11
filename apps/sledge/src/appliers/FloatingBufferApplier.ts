import { RgbaBuffer } from '@sledge/anvil';
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
    const buffer = RgbaBuffer.fromRaw(width, height, target);
    const originX = floatingBuffer.origin?.x ?? 0;
    const originY = floatingBuffer.origin?.y ?? 0;
    buffer.transferFromRaw(floatingBuffer.buffer, floatingBuffer.width, floatingBuffer.height, {
      offsetX: Math.round(originX + floatingBuffer.offset.x),
      offsetY: Math.round(originY + floatingBuffer.offset.y),
    });
    return new Uint8ClampedArray(buffer.data);
  } catch (e) {
    console.error('applyFloatingBuffer wasm error', e);
    return target;
  }
}
