import { FloatingBuffer } from '~/controllers/selection/FloatingMoveManager';

export interface FloatingBufferApplyParams {
  floatingBuffer: FloatingBuffer;
  target: Uint8ClampedArray;
}

export async function applyFloatingBuffer({ floatingBuffer, target }: FloatingBufferApplyParams): Promise<Uint8ClampedArray> {
  // TODO: implement apply floating buffer
  const offset = floatingBuffer.offset;
  // patch_buffer(target, floatingBuffer.buffer, offset.x, offset.y); // wasm
  return target;
}
