import { gzipDeflate, gzipInflate, type RawPixelData } from '@sledge-pdm/core';
import { createSignal } from 'solid-js';
import { v4 } from 'uuid';
import { normalizeRotation } from '~/features/canvas';
import { projectHistoryController } from '~/features/history';
import { ImagePoolHistoryAction } from '~/features/history/actions/ImagePoolHistoryAction';
import { LayerHistoryAction } from '~/features/history/actions/LayerHistoryAction';
import { ImagePoolEntry, ImagePoolImage, ImagePoolImagePersisted } from '~/features/image_pool/model';
import { activeLayer } from '~/features/layer';
import { getLayer } from '~/features/layer/frasco/LayerManager';
import { logSystemError, logUserInfo, logUserWarn } from '~/features/log/service';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { bufferToBlob, loadImageData } from '~/utils/DataUtils';
import { pathToFileLocation } from '~/utils/FileUtils';
import { fs } from '~/utils/platform';
import { createTexture, deleteTexture } from '~/utils/TextureUtils';
import { flip_pixels_vertically } from '~/utils/wasm';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';

type ImageMimeType = ImagePoolImagePersisted['mimeType'];

const DEFAULT_MIME: ImageMimeType = 'image/png';

const normalizeMimeType = (mime?: string): ImageMimeType => {
  const lower = mime?.toLowerCase();
  if (lower === 'image/jpeg' || lower === 'image/jpg') return 'image/jpeg';
  if (lower === 'image/png') return 'image/png';
  if (lower === 'image/webp') return 'image/webp';
  return DEFAULT_MIME;
};

const guessMimeFromPath = (filePath?: string): ImageMimeType => {
  const ext = filePath?.split('.').pop()?.toLowerCase();
  if (!ext) return DEFAULT_MIME;
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return DEFAULT_MIME;
};

const cloneEntries = (entries: ImagePoolEntry[]): ImagePoolEntry[] =>
  entries.map((e) => ({
    ...e,
    base: { ...e.base },
    transform: { ...e.transform },
  }));

export const toPersistedImages = (images: Map<string, ImagePoolImage>): Map<string, ImagePoolImagePersisted> => {
  const persisted = new Map<string, ImagePoolImagePersisted>();
  images.forEach((image, id) => persisted.set(id, { mimeType: image.mimeType, deflatedBuffer: image.deflatedBuffer }));
  return persisted;
};

export const clonePersistedImages = (images: Map<string, ImagePoolImagePersisted>): Map<string, ImagePoolImagePersisted> => {
  const cloned = new Map<string, ImagePoolImagePersisted>();
  images.forEach((image, id) => cloned.set(id, { mimeType: image.mimeType, deflatedBuffer: new Uint8Array(image.deflatedBuffer) }));
  return cloned;
};

const hydrateImage = (persisted: ImagePoolImagePersisted): ImagePoolImage => {
  const inflated = gzipInflate(persisted.deflatedBuffer) as Uint8Array<ArrayBuffer>;
  const blobUrl = URL.createObjectURL(new Blob([inflated], { type: persisted.mimeType }));
  return { ...persisted, blobUrl };
};

export const makeRuntimeImages = (images: Map<string, ImagePoolImagePersisted>): Map<string, ImagePoolImage> => {
  const runtime = new Map<string, ImagePoolImage>();
  images.forEach((image, id) => runtime.set(id, hydrateImage(image)));
  return runtime;
};

const createImagePoolImage = (bytes: Uint8Array, mimeType: ImageMimeType): ImagePoolImage => {
  const deflatedBuffer = gzipDeflate(bytes);
  const blobUrl = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: mimeType }));
  return { mimeType, deflatedBuffer, blobUrl };
};

export const [runtimeImages, setRuntimeImages] = createSignal<Map<string, ImagePoolImage>>(new Map());

const setImageForEntry = (entryId: string, image: ImagePoolImage) => {
  const images = new Map(runtimeImages());
  const prev = images.get(entryId);
  if (prev) {
    URL.revokeObjectURL(prev.blobUrl);
  }
  images.set(entryId, image);
  setRuntimeImages(images);
};

const removeImageForEntry = (entryId: string) => {
  const images = new Map(runtimeImages());
  const prev = images.get(entryId);
  if (prev) {
    URL.revokeObjectURL(prev.blobUrl);
  }
  images.delete(entryId);
  setRuntimeImages(images);
};

const createEntryBase = (width: number, height: number, forceFit?: boolean): ImagePoolEntry => {
  const id = v4();
  let initialScale = forceFit ? Math.min(projectStore.canvas.size.width / width, projectStore.canvas.size.height / height) : 1;

  // at least ensure fit to prevent image overflow
  if (width > projectStore.canvas.size.width || height > projectStore.canvas.size.height) {
    initialScale = Math.min(projectStore.canvas.size.width / width, projectStore.canvas.size.height / height);
  }

  return {
    id,
    base: { width, height },
    transform: { x: 0, y: 0, scaleX: initialScale, scaleY: initialScale, rotation: 0, flipX: false, flipY: false },
    opacity: 1,
    visible: true,
  };
};

const createEntryWithImage = (
  bytes: Uint8Array,
  mimeType: ImageMimeType,
  width: number,
  height: number,
  forceFit?: boolean
): { entry: ImagePoolEntry; image: ImagePoolImage } => {
  const entry = createEntryBase(width, height, forceFit);
  const image = createImagePoolImage(bytes, mimeType);
  return { entry, image };
};

export const getEntry = (id: string): ImagePoolEntry | undefined => projectStore.imagePool.entries.find((e) => e.id === id);

// Insert entry with a given id (used for undo/redo to keep id stable)
export function insertEntry(entry: ImagePoolEntry, image: ImagePoolImage, noDiff?: boolean) {
  const oldEntries = cloneEntries(projectStore.imagePool.entries);
  const oldImages = clonePersistedImages(toPersistedImages(runtimeImages()));

  const newEntries = [...projectStore.imagePool.entries.filter((e) => e.id !== entry.id), entry];

  setProjectStore('imagePool', 'entries', newEntries);
  setImageForEntry(entry.id, image);
  const newImages = clonePersistedImages(toPersistedImages(runtimeImages()));

  if (!noDiff) {
    projectHistoryController.addAction(
      new ImagePoolHistoryAction({
        kind: 'add',
        oldEntries,
        newEntries: cloneEntries(newEntries),
        oldImages,
        newImages,
        context: { from: 'ImagePoolController.insertEntry' },
      })
    );
  }
}

export function updateEntryPartial(id: string, patch: Partial<ImagePoolEntry>) {
  const oldEntryIndex = projectStore.imagePool.entries.findIndex((e) => e.id === id);
  if (oldEntryIndex < 0) return;

  setProjectStore('imagePool', 'entries', oldEntryIndex, patch);
}

export function removeEntry(id: string, noDiff?: boolean) {
  const oldEntries = cloneEntries(projectStore.imagePool.entries);
  const oldImages = clonePersistedImages(toPersistedImages(runtimeImages()));
  const entry = getEntry(id);
  if (!entry) {
    logUserWarn(`ImagePool entry ${id} not found.`, { label: 'ImagePool' });
    return;
  }

  if (projectStore.imagePool.entries.some((e) => e.id === id)) {
    const newEntries = projectStore.imagePool.entries.filter((e) => e.id !== id);

    setProjectStore('imagePool', 'entries', newEntries);
    removeImageForEntry(id);
    const newImages = clonePersistedImages(toPersistedImages(runtimeImages()));

    if (projectStore.imagePool.state.selectedEntryId === id) {
      const index = oldEntries.findIndex((e) => e.id === id);
      const nextIndex = index - 1;
      if (0 <= nextIndex && nextIndex < newEntries.length) {
        selectEntry(newEntries[nextIndex].id);
      } else {
        selectEntry(undefined);
      }
    }
    if (!noDiff)
      projectHistoryController.addAction(
        new ImagePoolHistoryAction({
          kind: 'remove',
          oldEntries,
          newEntries: cloneEntries(newEntries),
          oldImages,
          newImages,
          context: { from: 'ImagePoolController.removeEntry' },
        })
      );
  }
}

export async function addImagesFromLocal(imagePaths: string | string[], forceFit?: boolean) {
  if (Array.isArray(imagePaths)) {
    await Promise.all(
      imagePaths.map(async (p) => {
        const { entry, image } = await createEntryFromLocalImage(p, forceFit);
        insertEntry(entry, image, false);
      })
    );
    if (imagePaths.length > 0) {
      logUserInfo(`Added ${imagePaths.length} image(s) to image pool.`);
    }
  } else {
    const { entry, image } = await createEntryFromLocalImage(imagePaths, forceFit);
    insertEntry(entry, image, false);
    logUserInfo('Image added to image pool.');
  }
}

export async function addImagesFromFiles(files: File[], forceFit?: boolean) {
  await Promise.all(
    files.map(async (file) => {
      const { entry, image } = await createEntryFromFile(file, forceFit);
      insertEntry(entry, image, false);
    })
  );
  if (files.length > 0) {
    logUserInfo(`Added ${files.length} image(s) to image pool.`);
  }
}

export async function addImagesFromRawBuffer(rawBuffer: RawPixelData, width: number, height: number, forceFit?: boolean) {
  const { entry, image } = await createEntryFromRawBuffer(rawBuffer, width, height, forceFit);
  insertEntry(entry, image, false);
  logUserInfo('Image added to image pool.');
}

export async function transferToCurrentLayer(entryId: string, removeAfter: boolean) {
  const active = activeLayer();
  if (!active) return;

  try {
    await transferToLayer(active.id, entryId);
    if (removeAfter) removeEntry(entryId);
    logUserInfo('Image transferred to active layer.');
  } catch (e) {
    logSystemError('Image transfer failed.', { label: 'ImagePool', details: [e] });
  }
}

async function transferToLayer(layerId: string, entryId: string) {
  const entry = getEntry(entryId);
  const image = runtimeImages().get(entryId);
  const layer = getLayer(layerId);
  const layerW = layer.getWidth();
  const layerH = layer.getHeight();
  if (!layerW || !layerH || !entry) return;
  if (!image) {
    logSystemError(`ImagePool image missing for entry ${entryId}`, { label: 'ImagePool' });
    return;
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
  projectHistoryController.addAction(
    new LayerHistoryAction({
      layerId,
      context: { tool: 'image' },
    })
  );
  updateWebGLCanvas(`Image Transfer to Layer(${layerId})`);
  updateLayerPreview(layerId);
}

export async function createEntryFromLocalImage(imagePath: string, forceFit?: boolean) {
  const bytes = await fs.readFile(imagePath);
  const mimeType = guessMimeFromPath(imagePath);
  const byteArray = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes as ArrayBuffer);
  const blob = new Blob([byteArray.slice()], { type: mimeType });
  const bitmap = await createImageBitmap(blob);
  const { entry, image } = createEntryWithImage(byteArray, mimeType, bitmap.width, bitmap.height, forceFit);
  entry.descriptionName = pathToFileLocation(imagePath)?.name;
  bitmap.close();
  return { entry, image };
}

export async function createEntryFromFile(file: File, forceFit?: boolean) {
  const mimeType = normalizeMimeType(file.type);
  const buffer = new Uint8Array(await file.arrayBuffer());
  const { width, height } = await createImageBitmap(new Blob([buffer], { type: mimeType })).then((bitmap) => {
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  });
  const { entry, image } = createEntryWithImage(buffer, mimeType, width, height, forceFit);
  entry.descriptionName = file.name;
  return { entry, image };
}

export async function createEntryFromRawBuffer(rawBuffer: RawPixelData, width: number, height: number, forceFit?: boolean) {
  const blob = await bufferToBlob({ buffer: rawBuffer, width, height });
  const buffer = new Uint8Array(await blob.arrayBuffer());
  const { entry, image } = createEntryWithImage(buffer, 'image/png', width, height, forceFit);
  return { entry, image };
}

export function selectEntry(id?: string) {
  setProjectStore('imagePool', 'state', 'selectedEntryId', id);
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
