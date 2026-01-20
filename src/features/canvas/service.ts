import { Size2D, Vec2 } from '@sledge-pdm/core';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import { Consts } from '~/Consts';
import { coordinateTransform } from '~/features/canvas/transform/CanvasPositionCalculator';
import { CanvasSizeHistoryAction, projectHistoryController } from '~/features/history';
import { allLayers } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { WindowPos } from '~/types/CoordinateTypes';
import { eventBus } from '~/utils/EventBus';
import { dialog } from '~/utils/platform';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';

export function isValidCanvasSize(size: Size2D): boolean {
  if (size.width < Consts.minCanvasWidth || Consts.maxCanvasWidth < size.width) return false;
  if (size.height < Consts.minCanvasHeight || Consts.maxCanvasHeight < size.height) return false;

  const maxTextureSize = webGLRenderer?.getMaxTextureSize();
  if (maxTextureSize) {
    // WebGL制限の計算: 描画バッファは最大テクスチャサイズの1/8に制限される
    // 理論上限: sqrt(maxTextureSize² / 8) ≈ 5792 pixels per side (for 16384 max texture size)
    // 実際の制限: 理論上限 - 安全マージン ≈ 5759 pixels per side
    const theoreticalMaxSideLength = Math.sqrt((maxTextureSize * maxTextureSize) / 8);
    const safeSideLength = theoreticalMaxSideLength - Consts.webGLTextureSizeLimitMargin;
    const bufferSizeLimit = safeSideLength * safeSideLength * 4; // width * height * 4 bytes (RGBA)

    // console.log(`WebGL limit analysis:`);
    // console.log(`  MAX_TEXTURE_SIZE: ${maxTextureSize}`);
    // console.log(`  Theoretical max side: ${theoreticalMaxSideLength.toFixed(2)} pixels`);
    // console.log(`  Safe side length: ${safeSideLength.toFixed(2)} pixels`);
    // console.log(`  Buffer size limit: ${(bufferSizeLimit / 1024 / 1024).toFixed(2)} MB`);

    const requestedBufferSize = size.width * size.height * 4; // RGBA bytes

    if (requestedBufferSize > bufferSizeLimit) {
      const maxSidePixels = Math.floor(safeSideLength);
      dialog.message(
        `Canvas size exceeds WebGL limitations.

Requested: ${size.width}×${size.height} (${(requestedBufferSize / 1024 / 1024).toFixed(2)} MB)
Maximum: ${maxSidePixels}×${maxSidePixels} (${(bufferSizeLimit / 1024 / 1024).toFixed(2)} MB)

This limitation is caused by WebGL drawing buffer memory constraints:
• Drawing buffer limited to 1/8 of MAX_TEXTURE_SIZE²
• Your GPU's MAX_TEXTURE_SIZE: ${maxTextureSize}

For larger canvases, consider using multiple smaller images or wait for tiled rendering support.`,
        {
          kind: 'warning',
          title: 'Canvas Size Limitation',
        }
      );
      return false;
    }
  }

  return true;
}

interface ChangeCanvasSizeOptions {
  srcOrigin?: Vec2;
  destOrigin?: Vec2;
  skipHistory?: boolean;
}

export function changeCanvasSize(newSize: Size2D, options: ChangeCanvasSizeOptions): boolean {
  const { skipHistory = false, srcOrigin: src = { x: 0, y: 0 }, destOrigin: dest = { x: 0, y: 0 } } = options;
  if (!isValidCanvasSize(newSize)) return false;
  const oldSize = { width: projectStore.canvas.size.width, height: projectStore.canvas.size.height };
  if (oldSize.width === newSize.width && oldSize.height === newSize.height && src.x === 0 && src.y === 0 && dest.x === 0 && dest.y === 0)
    return false;
  const layerIds = allLayers().map((l) => l.id);
  const act = new CanvasSizeHistoryAction({
    beforeSize: oldSize,
    afterSize: newSize,
    context: { action: 'resize', from: 'changeCanvasSize' },
    historyMode: 'layer',
    layerIds,
  });
  if (!skipHistory) {
    for (const layerId of layerIds) {
      const frascoLayer = layerManager.getLayerOptional(layerId);
      if (frascoLayer) {
        frascoLayer.commitHistory(undefined, { silent: true });
      }
    }
    act.registerBefore();
  }

  setProjectStore('canvas', 'size', newSize);
  eventBus.emit('canvas:sizeChanged', { newSize });

  for (const l of allLayers()) {
    const frascoLayer = layerManager.getLayerOptional(l.id);
    if (frascoLayer) {
      const srcLayerOrigin = toLayerOrigin(src, oldSize.height);
      const destLayerOrigin = toLayerOrigin(dest, newSize.height);
      frascoLayer.resizePreserve(newSize.width, newSize.height, srcLayerOrigin, destLayerOrigin);
    } else {
      const baseBuffer = layerManager.exportRawCanvas(l.id);
      const resized = resizeBufferWithOrigins(baseBuffer, oldSize, newSize, src, dest);
      layerManager.replaceLayerBuffer(l.id, resized, newSize.width, newSize.height, { inputSpace: 'canvas' });
    }
    updateLayerPreview(l.id);
  }
  updateWebGLCanvas('changeCanvasSize');
  if (!skipHistory) {
    act.registerAfter();
    projectHistoryController.addAction(act);
  }
  setInteractStore('isCanvasSizeFrameMode', false);
  setInteractStore('canvasSizeFrameOffset', { x: 0, y: 0 });
  setInteractStore('canvasSizeFrameSize', { width: 0, height: 0 });

  selectionManager.clear();

  return true;
}

export function getMinZoom() {
  return interactStore.zoomMinFromInitial * interactStore.initialZoom;
}
export function getMaxZoom() {
  return interactStore.zoomMaxFromInitial * interactStore.initialZoom;
}
export function clipZoom(zoom: number) {
  return Math.max(getMinZoom(), Math.min(getMaxZoom(), zoom));
}

function resizeBufferWithOrigins(buffer: Uint8ClampedArray, oldSize: Size2D, newSize: Size2D, srcOrigin: Vec2, destOrigin: Vec2): Uint8ClampedArray {
  const oldW = Math.floor(oldSize.width);
  const oldH = Math.floor(oldSize.height);
  const newW = Math.floor(newSize.width);
  const newH = Math.floor(newSize.height);
  if (oldW <= 0 || oldH <= 0 || newW <= 0 || newH <= 0) {
    return new Uint8ClampedArray(0);
  }

  const srcX = Math.floor(srcOrigin.x);
  const srcY = Math.floor(srcOrigin.y);
  const destX = Math.floor(destOrigin.x);
  const destY = Math.floor(destOrigin.y);

  const validDxMin = destX - srcX;
  const validDxMax = destX - srcX + oldW;
  const validDyMin = destY - srcY;
  const validDyMax = destY - srcY + oldH;

  const copyLeft = Math.max(0, validDxMin);
  const copyTop = Math.max(0, validDyMin);
  const copyRight = Math.min(newW, validDxMax);
  const copyBottom = Math.min(newH, validDyMax);

  const out = new Uint8ClampedArray(newW * newH * 4);
  if (copyLeft >= copyRight || copyTop >= copyBottom) {
    return out;
  }

  const rowCopyWidth = copyRight - copyLeft;
  const rowBytes = rowCopyWidth * 4;
  for (let dy = copyTop; dy < copyBottom; dy++) {
    const sy = dy - destY + srcY;
    if (sy < 0 || sy >= oldH) continue;
    const sxFirst = copyLeft - destX + srcX;
    if (sxFirst < 0 || sxFirst + rowCopyWidth > oldW) continue;
    const srcIndex = (sy * oldW + sxFirst) * 4;
    const dstIndex = (dy * newW + copyLeft) * 4;
    out.set(buffer.subarray(srcIndex, srcIndex + rowBytes), dstIndex);
  }

  return out;
}

function toLayerOrigin(origin: Vec2, height: number): Vec2 {
  const x = Math.floor(origin.x);
  const y = Math.floor(origin.y);
  return { x, y: height - 1 - y };
}

const referenceLengthRatio = 0.85;
const defaultReferenceLength = 800;
let lastMeasuredReferenceLength = defaultReferenceLength;
const referenceLength = () => {
  const sectionBetweenArea = document.getElementById('sections-between-area');
  if (!sectionBetweenArea) {
    return lastMeasuredReferenceLength * referenceLengthRatio;
  }

  const areaBound = sectionBetweenArea.getBoundingClientRect();
  const minSide = Math.min(areaBound.width, areaBound.height);

  if (minSide > 0) {
    lastMeasuredReferenceLength = minSide;
    return minSide * referenceLengthRatio;
  }

  const fallbackLength = Math.max(areaBound.width, areaBound.height, lastMeasuredReferenceLength, 1);
  lastMeasuredReferenceLength = fallbackLength;
  return fallbackLength * referenceLengthRatio;
};

export const getReferencedZoom = (length?: number) => {
  if (length === undefined) {
    const width = projectStore.canvas.size.width;
    const height = projectStore.canvas.size.height;
    length = width > height ? width : height;
  }

  return referenceLength() / length;
};

export const adjustZoomToFit = (width?: number, height?: number) => {
  width = width ?? projectStore.canvas.size.width;
  height = height ?? projectStore.canvas.size.height;
  if (!width || !height) return;

  const longerLength = width > height ? width : height;
  const referencedZoom = getReferencedZoom(longerLength);
  if (!referencedZoom) return;

  setInteractStore('initialZoom', referencedZoom);
  setZoom(referencedZoom);
  centeringCanvas();
};

export const centeringCanvas = () => {
  const canvasSize = projectStore.canvas.size;
  const sectionBetweenArea = document.getElementById('sections-between-area');
  if (!sectionBetweenArea) return;
  const areaBound = sectionBetweenArea.getBoundingClientRect();
  const zoom = interactStore.zoom;

  const sideSectionControlLeftEl = document.getElementById('side-section-control-leftSide');
  const bottomBarEl = document.getElementById('bottom-bar');
  setOffset({
    x: sideSectionControlLeftEl ? -sideSectionControlLeftEl.scrollWidth : 0,
    y: bottomBarEl ? bottomBarEl.scrollHeight : 0,
  });
  setInteractStore('offsetOrigin', {
    x: areaBound.x + areaBound.width / 2 - (canvasSize.width * zoom) / 2,
    y: areaBound.height / 2 - (canvasSize.height * zoom) / 2,
  });
  setRotation(0);
};

export const setZoom = (zoom: number): boolean => {
  if (zoom > 0 && zoom !== interactStore.zoom) {
    zoom = Math.min(getMaxZoom(), Math.max(getMinZoom(), zoom));
    setInteractStore('zoom', zoom);
    coordinateTransform.clearCache();
    return true;
  }
  return false;
};

export const setOffset = (offset: { x: number; y: number }) => {
  if (offset.x !== interactStore.offset.x || offset.y !== interactStore.offset.y) {
    setInteractStore('offset', offset);
    coordinateTransform.clearCache();
  }
};

export const normalizeRotation = (rotation: number) => {
  // 内部表現を (-180, 180] の範囲に正規化して管理する
  // 例: 270 -> -90, -181 -> 179
  let r = rotation % 360; // JS の % は符号を保持する
  if (r > 180) r -= 360;
  if (r < -180) r += 360;
  // r = Math.round(r * Math.pow(10, Consts.rotationPrecisionSignificantDigits)) / Math.pow(10, Consts.rotationPrecisionSignificantDigits);

  return r;
};

export const setRotation = (rotation: number) => {
  const r = normalizeRotation(rotation);
  if (r !== interactStore.rotation) {
    setInteractStore('rotation', r);
    coordinateTransform.clearCache();
  }
};

export function zoomTowardWindowPos(centerWindowPos: WindowPos, zoomNew: number) {
  const zoomOld = interactStore.zoom;

  // ズーム前の座標系でキャンバス座標を計算
  const centerCanvasPos = coordinateTransform.windowToCanvas(centerWindowPos);

  // ズームを適用
  const zoomChanged = setZoom(zoomNew);

  // ズーム中心を維持するための標準的な計算式
  const dx = centerCanvasPos.x * (zoomOld - zoomNew);
  const dy = centerCanvasPos.y * (zoomOld - zoomNew);

  setOffset({
    x: interactStore.offset.x + dx,
    y: interactStore.offset.y + dy,
  });

  return zoomChanged;
}

export function zoomTowardAreaCenter(zoomNew: number) {
  const zoomOld = interactStore.zoom;

  const betweenAreaCenter = document.getElementById('between-area-center');
  if (!betweenAreaCenter) {
    return;
  }
  const betweenAreaCenterRect = betweenAreaCenter.getBoundingClientRect();

  // ズーム中心のウィンドウ座標
  const centerWindowPos = WindowPos.create(
    betweenAreaCenterRect.left + betweenAreaCenterRect.width / 2,
    betweenAreaCenterRect.top + betweenAreaCenterRect.height / 2
  );

  // ズーム前の座標系でキャンバス座標を計算
  const centerCanvasPos = coordinateTransform.windowToCanvas(centerWindowPos);

  // ズームを適用
  const zoomChanged = setZoom(zoomNew);

  // ズーム中心を維持するための標準的な計算式
  // ズーム変更によるオフセット調整
  const dx = centerCanvasPos.x * (zoomOld - zoomNew);
  const dy = centerCanvasPos.y * (zoomOld - zoomNew);

  setOffset({
    x: interactStore.offset.x + dx,
    y: interactStore.offset.y + dy,
  });

  return zoomChanged;
}

export function rotateInAreaCenter(rotation: number) {
  const betweenAreaCenter = document.getElementById('between-area-center');
  if (!betweenAreaCenter) {
    return;
  }
  const betweenAreaCenterRect = betweenAreaCenter.getBoundingClientRect();
  rotateInCenter(WindowPos.create(betweenAreaCenterRect.left, betweenAreaCenterRect.top), rotation);
}

export function rotateInCenter(centerWindowPosition: WindowPos, rotation: number) {
  // 回転前の座標系で回転中心のキャンバス座標を計算
  const centerCanvasPos = coordinateTransform.windowToCanvas(centerWindowPosition);

  // 回転を適用
  setRotation(rotation);

  // 回転後に同じキャンバス座標が同じウィンドウ座標になるよう逆算
  const expectedWindowPos = coordinateTransform.canvasToWindow(centerCanvasPos);

  // 期待するウィンドウ座標と実際のウィンドウ座標の差分をオフセットに反映
  const deltaWindowX = centerWindowPosition.x - expectedWindowPos.x;
  const deltaWindowY = centerWindowPosition.y - expectedWindowPos.y;

  setOffset({
    x: interactStore.offset.x + deltaWindowX,
    y: interactStore.offset.y + deltaWindowY,
  });
}

export const toggleVerticalFlip = () => {
  setInteractStore('verticalFlipped', (v) => !v);
  coordinateTransform.clearCache();
  eventBus.emit('selection:updateSelectionMenu', {});
};

export const setVerticalFlip = (flipped: boolean) => {
  setInteractStore('verticalFlipped', flipped);
  coordinateTransform.clearCache();
  eventBus.emit('selection:updateSelectionMenu', {});
};

export const toggleHorizontalFlip = () => {
  setInteractStore('horizontalFlipped', (v) => !v);
  coordinateTransform.clearCache();
  eventBus.emit('selection:updateSelectionMenu', {});
};
export const setHorizontalFlip = (flipped: boolean) => {
  setInteractStore('horizontalFlipped', flipped);
  coordinateTransform.clearCache();
  eventBus.emit('selection:updateSelectionMenu', {});
};

export const resetOrientation = () => {
  setVerticalFlip(false);
  setHorizontalFlip(false);
  setRotation(0);
};
