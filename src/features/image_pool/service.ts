import { decodeWebp, encodeWebp, type RawPixelData } from '@sledge-pdm/core';
import { v4 } from 'uuid';
import { normalizeRotation } from '~/features/canvas';
import { projectHistoryController } from '~/features/history';
import { ImagePoolHistoryAction } from '~/features/history/actions/ImagePoolHistoryAction';
import { LayerHistoryAction } from '~/features/history/actions/LayerHistoryAction';
import { ImagePoolEntry } from '~/features/image_pool/model';
import { activeLayer } from '~/features/layer';
import { getLayer } from '~/features/layer/frasco/LayerManager';
import { logSystemError, logUserInfo, logUserWarn } from '~/features/log/service';
import { canvasStore, imagePoolStore, setImagePoolStore } from '~/stores/ProjectStores';
import { loadImageData, loadLocalImage } from '~/utils/DataUtils';
import { pathToFileLocation } from '~/utils/FileUtils';
import { flip_pixels_vertically } from '~/utils/wasm';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';

export const getEntry = (id: string): ImagePoolEntry | undefined => imagePoolStore.entries.find((e) => e.id === id);

// Insert entry with a given id (used for undo/redo to keep id stable)
export function insertEntry(entry: ImagePoolEntry, noDiff?: boolean) {
  const oldEntries = imagePoolStore.entries.slice();

  setImagePoolStore('entries', [...imagePoolStore.entries.filter((e) => e.id !== entry.id), entry]);

  if (!noDiff) {
    projectHistoryController.addAction(
      new ImagePoolHistoryAction({
        kind: 'add',
        oldEntries,
        newEntries: imagePoolStore.entries.slice(),
        context: { from: 'ImagePoolController.insertEntry' },
      })
    );
  }
}

export function updateEntryPartial(id: string, patch: Partial<ImagePoolEntry>, noDiff?: boolean) {
  let oldEntryIndex = imagePoolStore.entries.findIndex((e) => e.id === id);
  if (oldEntryIndex < 0) return;

  setImagePoolStore('entries', oldEntryIndex, patch);
}

export function removeEntry(id: string, noDiff?: boolean) {
  const oldEntries = imagePoolStore.entries.slice();
  const entry = getEntry(id);
  if (!entry) {
    logUserWarn(`ImagePool entry ${id} not found.`, { label: 'ImagePool' });
    return;
  }

  if (imagePoolStore.entries.some((e) => e.id === id)) {
    setImagePoolStore(
      'entries',
      imagePoolStore.entries.filter((e) => e.id !== id)
    );

    if (imagePoolStore.selectedEntryId === id) {
      const index = oldEntries.findIndex((e) => e.id === id);
      const nextIndex = index - 1;
      if (0 <= nextIndex && nextIndex < imagePoolStore.entries.length) {
        selectEntry(oldEntries[nextIndex].id);
      } else {
        selectEntry(undefined);
      }
    }
    if (!noDiff)
      projectHistoryController.addAction(
        new ImagePoolHistoryAction({
          kind: 'remove',
          oldEntries,
          newEntries: imagePoolStore.entries.slice(),
          context: { from: 'ImagePoolController.removeEntry' },
        })
      );
  }
}

export async function addImagesFromLocal(imagePaths: string | string[], forceFit?: boolean) {
  if (Array.isArray(imagePaths)) {
    await Promise.all(
      imagePaths.map(async (p) => {
        const entry = await createEntryFromLocalImage(p, forceFit);
        insertEntry(entry, false);
      })
    );
    if (imagePaths.length > 0) {
      logUserInfo(`Added ${imagePaths.length} image(s) to image pool.`);
    }
  } else {
    const entry = await createEntryFromLocalImage(imagePaths, forceFit);
    insertEntry(entry, false);
    logUserInfo('Image added to image pool.');
  }
}

export async function addImagesFromFiles(files: File[], forceFit?: boolean) {
  await Promise.all(
    files.map(async (file) => {
      const entry = await createEntryFromFile(file, forceFit);
      insertEntry(entry, false);
    })
  );
  if (files.length > 0) {
    logUserInfo(`Added ${files.length} image(s) to image pool.`);
  }
}

export async function addImagesFromRawBuffer(rawBuffer: RawPixelData, width: number, height: number, forceFit?: boolean) {
  const entry = await createEntryFromRawBuffer(rawBuffer, width, height, forceFit);
  insertEntry(entry, false);
  logUserInfo('Image added to image pool.');
}

export async function transferToCurrentLayer(entryId: string, removeAfter: boolean) {
  const active = activeLayer();
  if (!active) return;

  try {
    transferToLayer(active.id, entryId);
    if (removeAfter) removeEntry(entryId); // ImagePool から削除
    logUserInfo('Image transferred to active layer.');
  } catch (e) {
    logSystemError('Image transfer failed.', { label: 'ImagePool', details: [e] });
  }
}

async function transferToLayer(layerId: string, entryId: string) {
  const entry = getEntry(entryId);
  const layer = getLayer(layerId);
  const layerW = layer.getWidth();
  const layerH = layer.getHeight();
  if (!layerW || !layerH || !entry) return;

  // TODO: replace with non-webp method
  const rawEntryBuffer = decodeWebp(entry.webpBuffer, entry.base.width, entry.base.height);

  const offsetX = Math.round(entry.transform.x);
  const offsetY = Math.round(entry.transform.y);

  // calculate nearest scale to match integer width/height
  const targetWidth = Math.round(entry.base.width * entry.transform.scaleX);
  const targetHeight = Math.round(entry.base.height * entry.transform.scaleY);
  const scaleX = targetWidth / entry.base.width;
  const scaleY = targetHeight / entry.base.height;

  const rotate = normalizeRotation(entry.transform.rotation);

  const entryBuffer = new Uint8Array(rawEntryBuffer);
  flip_pixels_vertically(entryBuffer, entry.base.width, entry.base.height);
  const entryTexture = layer.createTextureFromRaw(entryBuffer, { width: entry.base.width, height: entry.base.height });

  layer.commitHistory();
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
  layer.deleteTexture(entryTexture);
  projectHistoryController.addAction(
    new LayerHistoryAction({
      layerId,
      context: { tool: 'image' },
    })
  );
  updateWebGLCanvas(`Image Transfer to Layer(${layerId})`);
  updateLayerPreview(layerId);
}

function createEntry(webpBuffer: Uint8Array, width: number, height: number, forceFit?: boolean) {
  const id = v4();
  let initialScale = forceFit ? Math.min(canvasStore.size.width / width, canvasStore.size.height / height) : 1;

  // at least ensure fit to prevent image overflow
  if (width > canvasStore.size.width || height > canvasStore.size.height) {
    initialScale = Math.min(canvasStore.size.width / width, canvasStore.size.height / height);
  }

  const entry: ImagePoolEntry = {
    id,
    webpBuffer,
    base: { width, height },
    transform: { x: 0, y: 0, scaleX: initialScale, scaleY: initialScale, rotation: 0, flipX: false, flipY: false },
    opacity: 1,
    visible: true,
  };
  return entry;
}

export async function createEntryFromLocalImage(imagePath: string, forceFit?: boolean) {
  const bitmap = await loadLocalImage(imagePath);
  const width = bitmap.width;
  const height = bitmap.height;
  const imageData = await loadImageData(bitmap);
  const webpBuffer = encodeWebp(imageData.data, width, height);
  bitmap.close();
  const entry = createEntry(webpBuffer, width, height, forceFit);
  entry.descriptionName = pathToFileLocation(imagePath)?.name;
  return entry;
}

export async function createEntryFromFile(file: File, forceFit?: boolean) {
  const bitmap = await createImageBitmap(file);
  const width = bitmap.width;
  const height = bitmap.height;
  const imageData = await loadImageData(bitmap);
  const webpBuffer = encodeWebp(imageData.data, width, height);
  bitmap.close();
  const entry = createEntry(webpBuffer, width, height, forceFit);
  entry.descriptionName = file.name;
  return entry;
}

export async function createEntryFromRawBuffer(rawBuffer: RawPixelData, width: number, height: number, forceFit?: boolean) {
  const webpBuffer = encodeWebp(rawBuffer, width, height);
  const entry = createEntry(webpBuffer, width, height, forceFit);
  return entry;
}

export function selectEntry(id?: string) {
  setImagePoolStore('selectedEntryId', id);
}

export function showEntry(id: string) {
  const entry = getEntry(id);
  if (entry && !entry.visible) {
    updateEntryPartial(id, {
      visible: true,
    });
  }
}

export function hideEntry(id: string) {
  const entry = getEntry(id);
  if (entry && entry.visible) {
    updateEntryPartial(id, {
      visible: false,
    });
  }
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
