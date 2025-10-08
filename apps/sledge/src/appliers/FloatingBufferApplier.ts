import { patch_buffer_rgba } from '@sledge/wasm';
import { FloatingBuffer } from '~/features/selection/FloatingMoveManager';

export interface FloatingBufferApplyParams {
  width: number; // target full width
  height: number; // target full height
  floatingBuffer: FloatingBuffer;
  target: Uint8ClampedArray; // base buffer to patch (copied by caller if needed)
}

// Pure helper: returns new patched buffer (does NOT touch Anvil or history)
export function applyFloatingBuffer({ width, height, floatingBuffer, target }: FloatingBufferApplyParams): Uint8ClampedArray {
  const offset = floatingBuffer.offset;
  try {
    const res = patch_buffer_rgba(
      new Uint8Array(target.buffer, target.byteOffset, target.byteLength),
      width,
      height,
      new Uint8Array(floatingBuffer.buffer.buffer, floatingBuffer.buffer.byteOffset, floatingBuffer.buffer.byteLength),
      floatingBuffer.width,
      floatingBuffer.height,
      offset.x,
      offset.y
    );
    return new Uint8ClampedArray(res);
  } catch (e) {
    console.error('applyFloatingBuffer wasm error', e);
    return target;
  }
}
