import { patch_buffer_rgba } from '@sledge/wasm';
import { FloatingBuffer } from '~/features/selection/FloatingMoveManager';

export interface FloatingBufferApplyParams {
  width: number;
  height: number;
  floatingBuffer: FloatingBuffer;
  target: Uint8ClampedArray;
}

export function applyFloatingBuffer({ width, height, floatingBuffer, target }: FloatingBufferApplyParams): Uint8ClampedArray {
  // TODO: implement apply floating buffer
  const offset = floatingBuffer.offset;
  // target is Uint8ClampedArray, wasm.patch_buffer expects Uint8Array inputs and returns Uint8Array
  // width and height are provided by caller (target dimensions)
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
