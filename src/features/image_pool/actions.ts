import { gzipInflate, HistoryContext, ImagePoolEntry, ImagePoolImage, type RawPixelData } from '@sledge-pdm/core';
import { normalizeRotation } from '~/features/canvas';
import { historyManager } from '~/features/history';
import { FrascoLayerCommand } from '~/features/history/command/frasco/FrascoLayerCommand';
import { ImagePoolAddCommand } from '~/features/history/command/image_pool/ImagePoolAddCommand';
import { ImagePoolPropsCommand } from '~/features/history/command/image_pool/ImagePoolPropsCommand';
import { ImagePoolRemoveCommand } from '~/features/history/command/image_pool/ImagePoolRemoveCommand';
import { CommandsHistoryEntry } from '~/features/history/entry/CommandsHistoryEntry';
import { activeLayer } from '~/features/layer';
import { getLayer } from '~/features/layer/frasco/LayerManager';
import { logSystemError, logUserInfo } from '~/features/log/service';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { loadImageData } from '~/utils/DataUtils';
import { createTexture, deleteTexture } from '~/utils/TextureUtils';
import { flip_pixels_vertically } from '~/utils/wasm';
import { updateFrascoCanvas } from '~/webgl/service';
import { removeImagePoolBlobUrl } from './blobManager';
import { getImagePoolImage, removeImagePoolImage, setImagePoolImage } from './imageStore';
import { cloneEntry, createEntryFromFile, createEntryFromLocalImage, createEntryFromRawBuffer, getEntry } from './service';

const isSameEntryProps = (a: ImagePoolEntry, b: ImagePoolEntry): boolean => {
  if (a.id !== b.id) return false;
  if (a.opacity !== b.opacity) return false;
  if (a.visible !== b.visible) return false;
  if ((a.descriptionName ?? '') !== (b.descriptionName ?? '')) return false;
  if (a.base.width !== b.base.width || a.base.height !== b.base.height) return false;
  if (
    a.transform.x !== b.transform.x ||
    a.transform.y !== b.transform.y ||
    a.transform.scaleX !== b.transform.scaleX ||
    a.transform.scaleY !== b.transform.scaleY ||
    a.transform.rotation !== b.transform.rotation ||
    a.transform.flipX !== b.transform.flipX ||
    a.transform.flipY !== b.transform.flipY
  )
    return false;
  return true;
};

const setImageForEntry = (entryId: string, image: ImagePoolImage) => {
  removeImagePoolBlobUrl(entryId);
  setImagePoolImage(entryId, image);
};

const removeImageForEntry = (entryId: string) => {
  removeImagePoolBlobUrl(entryId);
  removeImagePoolImage(entryId);
};

// Insert entry with a given id (used for undo/redo to keep id stable)
export function insertEntry(entry: ImagePoolEntry, image: ImagePoolImage, options?: { register?: boolean }) {
  const newEntries = [...projectStore.imagePool.entries.filter((e) => e.id !== entry.id), entry];
  setProjectStore('imagePool', 'entries', newEntries);
  setImageForEntry(entry.id, image);

  const register = options?.register ?? true;
  if (register) {
    const index = projectStore.imagePool.entries.findIndex((e) => e.id === entry.id);
    historyManager.addEntry(
      new CommandsHistoryEntry(
        new ImagePoolAddCommand({
          entry: cloneEntry(entry),
          image,
          index,
        })
      )
    );
  }
}

export function updateEntryPartial(id: string, patch: Partial<ImagePoolEntry>, options?: { register?: boolean; context?: HistoryContext }) {
  const oldEntryIndex = projectStore.imagePool.entries.findIndex((e) => e.id === id);
  if (oldEntryIndex < 0) return;

  const shouldRegister = options?.register ?? true;
  const before = shouldRegister ? cloneEntry(projectStore.imagePool.entries[oldEntryIndex]) : undefined;
  setProjectStore('imagePool', 'entries', oldEntryIndex, patch);
  if (!shouldRegister || !before) return;

  if (options?.register && before) {
    const afterEntry = projectStore.imagePool.entries[oldEntryIndex];
    if (!afterEntry) return;
    const after = cloneEntry(afterEntry);
    registerEntryUpdate(id, before, after, options);
  }
}

export function registerEntryUpdate(id: string, before: ImagePoolEntry, after: ImagePoolEntry, options?: { context?: HistoryContext }) {
  if (isSameEntryProps(before, after)) return;

  historyManager.addEntry(
    new CommandsHistoryEntry(
      new ImagePoolPropsCommand({
        entryId: id,
        before,
        after,
      }),
      options?.context
    )
  );
}

export function removeEntry(id: string, options?: { register?: boolean }) {
  const entry = getEntry(id);
  if (!entry) {
    const newEntries = projectStore.imagePool.entries.filter((e) => e.id !== id);
    setProjectStore('imagePool', 'entries', newEntries);
    return;
  }
  const index = projectStore.imagePool.entries.findIndex((e) => e.id === id);
  const image = getImagePoolImage(id);

  const newEntries = projectStore.imagePool.entries.filter((e) => e.id !== id);
  setProjectStore('imagePool', 'entries', newEntries);
  removeImageForEntry(id);
  if (projectStore.imagePool.state.selectedEntryId === id) {
    const nextIndex = index - 1;
    if (0 <= nextIndex && nextIndex < newEntries.length) {
      setProjectStore('imagePool', 'state', 'selectedEntryId', newEntries[nextIndex].id);
    } else {
      setProjectStore('imagePool', 'state', 'selectedEntryId', undefined);
    }
  }

  const register = options?.register ?? true;
  if (register) {
    historyManager.addEntry(
      new CommandsHistoryEntry(
        new ImagePoolRemoveCommand({
          entry: cloneEntry(entry),
          image,
          index,
        })
      )
    );
  }
}

export async function addImagesFromLocal(imagePaths: string | string[], forceFit?: boolean) {
  if (Array.isArray(imagePaths)) {
    await Promise.all(
      imagePaths.map(async (p) => {
        const { entry, image } = await createEntryFromLocalImage(p, forceFit);
        insertEntry(entry, image);
      })
    );
    if (imagePaths.length > 0) {
      logUserInfo(`Added ${imagePaths.length} image(s) to image pool.`);
    }
  } else {
    const { entry, image } = await createEntryFromLocalImage(imagePaths, forceFit);
    insertEntry(entry, image);
    logUserInfo('Image added to image pool.');
  }
}

export async function addImagesFromFiles(files: File[], forceFit?: boolean) {
  await Promise.all(
    files.map(async (file) => {
      const { entry, image } = await createEntryFromFile(file, forceFit);
      insertEntry(entry, image);
    })
  );
  if (files.length > 0) {
    logUserInfo(`Added ${files.length} image(s) to image pool.`);
  }
}

export async function addImagesFromRawBuffer(rawBuffer: RawPixelData, width: number, height: number, forceFit?: boolean) {
  const { entry, image } = await createEntryFromRawBuffer(rawBuffer, width, height, forceFit);
  insertEntry(entry, image);
  logUserInfo('Image added to image pool.');
}

export async function transferToCurrentLayer(entryId: string, removeAfter: boolean) {
  const active = activeLayer();
  if (!active) return;

  try {
    const transferred = await transferToLayer(active.id, entryId);
    if (!transferred) return;
    historyManager.addEntry(
      new CommandsHistoryEntry(
        new FrascoLayerCommand({
          layerId: active.id,
          context: { tool: 'image' },
        })
      )
    );
    if (removeAfter) removeEntry(entryId);
    logUserInfo('Image transferred to active layer.');
  } catch (e) {
    logSystemError('Image transfer failed.', { label: 'ImagePool', details: [e] });
  }
}

export function showEntry(id: string) {
  const entry = getEntry(id);
  if (entry && !entry.visible) {
    updateEntryPartial(
      id,
      { visible: true },
      { register: true, context: { icon: '/assets/icons/actions/image.png', description: `show image / ${entry.descriptionName ?? entry.id}` } }
    );
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

const IMAGE_POOL_TRANSFER_300ES = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_src;
uniform sampler2D u_patch;
uniform vec2 u_canvas_size;
uniform vec2 u_patch_size;
uniform vec2 u_offset;
uniform vec2 u_scale;
uniform float u_rotate;
uniform vec2 u_flip;

void main() {
  vec4 dst = texture(u_src, v_uv);
  vec2 canvas = u_canvas_size;
  vec2 pt = u_patch_size;
  vec2 denom = max(pt - vec2(1.0), vec2(1.0));

  vec2 target;
  target.x = v_uv.x * (canvas.x - 1.0);
  target.y = (1.0 - v_uv.y) * (canvas.y - 1.0);

  vec2 rel = target - u_offset;
  vec2 src_center = (pt * u_scale) * 0.5;
  vec2 centered = rel - src_center;

  float cosr = cos(u_rotate);
  float sinr = sin(u_rotate);
  vec2 rotated = vec2(
    centered.x * cosr + centered.y * sinr,
    -centered.x * sinr + centered.y * cosr
  ) + src_center;

  vec2 src = rotated / u_scale;
  if (u_flip.x > 0.5) {
    src.x = (pt.x - 1.0) - src.x;
  }
  if (u_flip.y > 0.5) {
    src.y = (pt.y - 1.0) - src.y;
  }

  if (src.x < 0.0 || src.y < 0.0 || src.x >= pt.x || src.y >= pt.y) {
    outColor = dst;
    return;
  }

  vec2 uv = vec2(src.x / denom.x, 1.0 - (src.y / denom.y));
  vec4 srcColor = texture(u_patch, uv);

  float a = srcColor.a;
  outColor = vec4(
    srcColor.rgb * a + dst.rgb * (1.0 - a),
    a + dst.a * (1.0 - a)
  );
}
`;

export function hideEntry(id: string) {
  const entry = getEntry(id);
  if (entry && entry.visible) {
    updateEntryPartial(
      id,
      { visible: false },
      { register: true, context: { icon: '/assets/icons/actions/image.png', description: `hide image / ${entry.descriptionName ?? entry.id}` } }
    );
  }
}
