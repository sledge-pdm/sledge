import { Size2D, Vec2 } from '@sledge/core';
import { message } from '@tauri-apps/plugin-dialog';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import { Consts } from '~/Consts';
import { coordinateTransform } from '~/features/canvas/transform/CanvasPositionCalculator';
import { CanvasSizeHistoryAction, projectHistoryController } from '~/features/history';
import { allLayers } from '~/features/layer';
import { getAnvil } from '~/features/layer/anvil/AnvilManager';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { canvasStore, setCanvasStore } from '~/stores/ProjectStores';
import { WindowPos } from '~/types/CoordinateTypes';
import { eventBus } from '~/utils/EventBus';
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
      message(
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

export function changeCanvasSizeWithNoOffset(newSize: Size2D, skipHistory?: boolean): boolean {
  return changeCanvasSize(newSize, undefined, undefined, skipHistory);
}

export function changeCanvasSize(newSize: Size2D, srcOrigin?: Vec2, destOrigin?: Vec2, skipHistory?: boolean): boolean {
  if (!isValidCanvasSize(newSize)) return false;
  const oldSize = { width: canvasStore.canvas.width, height: canvasStore.canvas.height };
  srcOrigin = srcOrigin ?? { x: 0, y: 0 };
  if (oldSize.width === newSize.width && oldSize.height === newSize.height && srcOrigin.x === 0 && srcOrigin.y === 0) return false;
  const act = new CanvasSizeHistoryAction({ beforeSize: oldSize, afterSize: newSize, context: { from: 'changeCanvasSize' } });
  if (!skipHistory) {
    act.registerBefore();
  }

  setCanvasStore('canvas', newSize);
  eventBus.emit('canvas:sizeChanged', { newSize });

  for (const l of allLayers()) {
    const anvil = getAnvil(l.id);
    anvil.resizeWithOffset(newSize, {
      srcOrigin,
      destOrigin,
    });
    updateLayerPreview(l.id);
  }
  updateWebGLCanvas(false, 'changeCanvasSize');
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
    const width = canvasStore.canvas.width;
    const height = canvasStore.canvas.height;
    length = width > height ? width : height;
  }

  return referenceLength() / length;
};

export const adjustZoomToFit = (width?: number, height?: number) => {
  width = width ?? canvasStore.canvas.width;
  height = height ?? canvasStore.canvas.height;
  if (!width || !height) return;

  const longerLength = width > height ? width : height;
  const referencedZoom = getReferencedZoom(longerLength);
  if (!referencedZoom) return;

  setInteractStore('initialZoom', referencedZoom);
  setZoom(referencedZoom);
  centeringCanvas();
};

export const centeringCanvas = () => {
  const canvasSize = canvasStore.canvas;
  // const canvasArea = interactStore.canvasAreaSize;
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
