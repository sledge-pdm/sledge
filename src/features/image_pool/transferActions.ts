import { gzipInflate } from '@sledge-pdm/core';
import { normalizeRotation } from '~/features/canvas';
import { activeLayer } from '~/features/layer';
import { getLayer } from '~/features/layer/frasco/LayerManager';
import { logSystemError, logUserInfo } from '~/features/log/service';
import { loadImageData } from '~/utils/DataUtils';
import { createTexture, deleteTexture } from '~/utils/TextureUtils';
import { flip_pixels_vertically } from '~/utils/wasm';
import { updateFrascoCanvas } from '~/webgl/service';
import { removeEntry } from './entryActions';
import { registerTransferHistory } from './historyActions';
import { getImagePoolImage } from './imageStore';
import { getEntry } from './service';
import { IMAGE_POOL_TRANSFER_300ES } from './shader';

export async function transferToCurrentLayer(entryId: string, removeAfter: boolean) {
  const active = activeLayer();
  if (!active) return;

  try {
    const transferred = await transferToLayer(active.id, entryId);
    if (!transferred) return;
    registerTransferHistory(active.id);
    if (removeAfter) removeEntry(entryId);
    logUserInfo('Image transferred to active layer.');
  } catch (e) {
    logSystemError('Image transfer failed.', { label: 'ImagePool', details: [e] });
  }
}

async function transferToLayer(layerId: string, entryId: string): Promise<boolean> {
  const entry = getEntry(entryId);
  const image = getImagePoolImage(entryId);
  const layer = getLayer(layerId);
  const layerW = layer.getWidth();
  const layerH = layer.getHeight();
  if (!layerW || !layerH || !entry) return false;
  if (!image) {
    logSystemError(`ImagePool image missing for entry ${entryId}`, { label: 'ImagePool' });
    return false;
  }

  const inflated = gzipInflate(image.deflatedBuffer) as Uint8Array<ArrayBuffer>;
  const blob = new Blob([inflated], { type: image.mimeType });
  const bitmap = await createImageBitmap(blob);
  const imageData = await loadImageData(bitmap);
  bitmap.close();

  const offsetX = Math.round(entry.transform.x);
  const offsetY = Math.round(entry.transform.y);

  // calculate nearest scale to match integer width/height
  const targetWidth = Math.round(entry.base.width * entry.transform.scaleX);
  const targetHeight = Math.round(entry.base.height * entry.transform.scaleY);
  const scaleX = targetWidth / entry.base.width;
  const scaleY = targetHeight / entry.base.height;

  const rotate = normalizeRotation(entry.transform.rotation);

  const entryBuffer = new Uint8Array(imageData.data.buffer, imageData.data.byteOffset, imageData.data.byteLength);
  flip_pixels_vertically(entryBuffer, entry.base.width, entry.base.height);
  const entryTexture = createTexture(layer.getGLContext(), entry.base.width, entry.base.height, entryBuffer);

  layer.commitHistory(undefined, { silent: true });
  layer.applyEffectWithTextures(
    {
      fragmentSrc: IMAGE_POOL_TRANSFER_300ES,
      uniforms: {
        u_canvas_size: [layerW, layerH],
        u_patch_size: [entry.base.width, entry.base.height],
        u_offset: [offsetX, offsetY],
        u_scale: [scaleX, scaleY],
        u_rotate: (rotate * Math.PI) / 180,
        u_flip: [entry.transform.flipX ? 1 : 0, entry.transform.flipY ? 1 : 0],
      },
    },
    { u_patch: entryTexture }
  );
  deleteTexture(layer.getGLContext(), entryTexture);
  updateFrascoCanvas(`Image Transfer to Layer(${layerId})`);
  return true;
}
