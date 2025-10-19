import { Size2D, Vec2 } from '@sledge/core';
import { message } from '@tauri-apps/plugin-dialog';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import { Consts } from '~/Consts';
import { projectHistoryController } from '~/features/history';
import { CanvasSizeHistoryAction } from '~/features/history/actions/CanvasSizeHistoryAction';
import { allLayers } from '~/features/layer';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { canvasStore, setCanvasStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';

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
  // CanvasSizeHistoryAction uses the "current" canvas size and buffer as an old state, so must be called before resizing buffers.
  const act = new CanvasSizeHistoryAction(oldSize, newSize, { from: 'changeCanvasSize' });

  if (!skipHistory) act.registerBefore();

  setCanvasStore('canvas', newSize);
  eventBus.emit('canvas:sizeChanged', { newSize });

  for (const l of allLayers()) {
    const anvil = getAnvilOf(l.id)!;
    anvil.resizeWithOffset(newSize, {
      srcOrigin,
      destOrigin,
    });
    eventBus.emit('preview:requestUpdate', { layerId: l.id });
  }
  eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: 'changeCanvasSize' });
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

const referenceLengthRatio = 0.75;
const referenceLength = () => {
  const sectionBetweenArea = document.getElementById('sections-between-area');
  if (!sectionBetweenArea) return 800 * referenceLengthRatio;
  const areaBound = sectionBetweenArea.getBoundingClientRect();

  if (areaBound.width < areaBound.height) {
    return areaBound.width * referenceLengthRatio;
  } else {
    return areaBound.height * referenceLengthRatio;
  }
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
  if (width === undefined) width = canvasStore.canvas.width;
  if (height === undefined) height = canvasStore.canvas.height;
  if (!width || !height) return;

  const isWide = width > height;
  const longerLength = isWide ? width : height;

  const referencedZoom = getReferencedZoom(longerLength);
  if (!referencedZoom) return;

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

  eventBus.emit('canvas:onAdjusted', {});
};

export const setZoomByReference = (zoomByReference: number): boolean => {
  const referencedZoom = getReferencedZoom() ?? 1;
  let zoom = zoomByReference * referencedZoom;
  zoom = Math.round(zoom * Math.pow(10, Consts.zoomPrecisionSignificantDigits)) / Math.pow(10, Consts.zoomPrecisionSignificantDigits);
  if (zoom > 0 && zoom !== interactStore.zoom) {
    setInteractStore('zoom', zoom);
    zoomByReference =
      Math.round(zoomByReference * Math.pow(10, Consts.zoomByReferencePrecisionSignificantDigits)) /
      Math.pow(10, Consts.zoomByReferencePrecisionSignificantDigits);
    setInteractStore('zoomByReference', zoomByReference);
    return true;
  }
  return false;
};

export const setZoom = (zoom: number): boolean => {
  const rawZoom = zoom;
  zoom = Math.round(zoom * Math.pow(10, Consts.zoomPrecisionSignificantDigits)) / Math.pow(10, Consts.zoomPrecisionSignificantDigits);
  if (zoom > 0 && zoom !== interactStore.zoom) {
    setInteractStore('zoom', zoom);

    const referencedZoom = getReferencedZoom() ?? 1;
    let zoomByReference = rawZoom / referencedZoom;

    zoomByReference =
      Math.round(zoomByReference * Math.pow(10, Consts.zoomByReferencePrecisionSignificantDigits)) /
      Math.pow(10, Consts.zoomByReferencePrecisionSignificantDigits);
    setInteractStore('zoomByReference', zoomByReference);
    return true;
  }
  return false;
};

export const setOffset = (offset: { x: number; y: number }) => {
  if (offset.x !== interactStore.offset.x || offset.y !== interactStore.offset.y) {
    setInteractStore('offset', offset);
  }
};

export const setRotation = (rotation: number) => {
  // 内部表現を (-180, 180] の範囲に正規化して管理する
  // 例: 270 -> -90, -181 -> 179
  let r = rotation % 360; // JS の % は符号を保持する
  if (r > 180) r -= 360; // 181..359 -> -179..-1
  if (r <= -180) r += 360; // ... -360..-180 -> 0..180 ( -180 は 180 に統一 )
  r = Math.round(r * Math.pow(10, Consts.rotationPrecisionSignificantDigits)) / Math.pow(10, Consts.rotationPrecisionSignificantDigits);
  if (r !== interactStore.rotation) setInteractStore('rotation', r);
};

export function zoomTowardAreaCenter(newReferenceZoom: number) {
  const zoomOld = interactStore.zoom;
  const zoomChanged = setZoomByReference(newReferenceZoom);
  const zoomNew = interactStore.zoom;

  const betweenAreaCenter = document.getElementById('between-area-center');
  const canvasStack = document.getElementById('canvas-stack');
  if (!canvasStack || !betweenAreaCenter) {
    return;
  }
  const stackRect = canvasStack.getBoundingClientRect();
  const betweenAreaCenterRect = betweenAreaCenter.getBoundingClientRect();

  // 旧ズームでの view 中心がキャンバス座標でどこだったか
  const canvasCenterX = (betweenAreaCenterRect.left - stackRect.left) / zoomOld;
  const canvasCenterY = (betweenAreaCenterRect.top - stackRect.top) / zoomOld;

  // 新ズーム適用後も同じキャンバス座標が中心に来るようにオフセット調整
  // stackRect.left/top は transform 由来で後続再描画まで旧値なので、相対変化のみ計算
  const dx = canvasCenterX * (zoomOld - zoomNew);
  const dy = canvasCenterY * (zoomOld - zoomNew);

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
  rotateInCenter({ x: betweenAreaCenterRect.left, y: betweenAreaCenterRect.top }, rotation);
}

// centerWindowPositionを中心としたrotationを行う
// (通常のsetRotationはキャンバスの中心を中心に回転している点に注意)
export function rotateInCenter(centerWindowPosition: Vec2, rotation: number) {
  const rotOld = interactStore.rotation;

  // 新しい回転角度を設定
  setRotation(rotation);
  const rotNew = interactStore.rotation;

  // 回転角度の差分（ラジアン）
  const deltaRad = ((rotNew - rotOld) * Math.PI) / 180;

  // 回転の中心点を画面座標からキャンバス座標に変換
  const canvasStack = document.getElementById('canvas-stack');
  if (!canvasStack) {
    return;
  }

  const rect = canvasStack.getBoundingClientRect();
  const zoom = interactStore.zoom;

  // 回転中心の画面座標からキャンバススタック内の相対座標を計算
  const centerRelativeX = centerWindowPosition.x - rect.left;
  const centerRelativeY = centerWindowPosition.y - rect.top;

  // キャンバススタック内座標をキャンバス論理座標に変換（回転前）
  const centerCanvasX = centerRelativeX / zoom;
  const centerCanvasY = centerRelativeY / zoom;

  // キャンバスの中心座標
  const canvasCenterX = canvasStore.canvas.width / 2;
  const canvasCenterY = canvasStore.canvas.height / 2;

  // 回転中心からキャンバス中心へのベクトル
  const vecX = canvasCenterX - centerCanvasX;
  const vecY = canvasCenterY - centerCanvasY;

  // 回転による変位を計算
  const cosTheta = Math.cos(deltaRad);
  const sinTheta = Math.sin(deltaRad);

  // 回転後のベクトル
  const rotatedVecX = vecX * cosTheta - vecY * sinTheta;
  const rotatedVecY = vecX * sinTheta + vecY * cosTheta;

  // 変位量（ズーム適用済み画面座標）
  const deltaX = (rotatedVecX - vecX) * zoom;
  const deltaY = (rotatedVecY - vecY) * zoom;

  // オフセットを調整して回転中心を維持
  setOffset({
    x: interactStore.offset.x + deltaX,
    y: interactStore.offset.y + deltaY,
  });
}

export const toggleVerticalFlip = () => {
  setInteractStore('verticalFlipped', (v) => !v);
  eventBus.emit('selection:updateSelectionMenu', {});
};
export const setVerticalFlip = (flipped: boolean) => {
  setInteractStore('verticalFlipped', flipped);
  eventBus.emit('selection:updateSelectionMenu', {});
};

export const toggleHorizontalFlip = () => {
  setInteractStore('horizontalFlipped', (v) => !v);
  eventBus.emit('selection:updateSelectionMenu', {});
};
export const setHorizontalFlip = (flipped: boolean) => {
  setInteractStore('horizontalFlipped', flipped);
  eventBus.emit('selection:updateSelectionMenu', {});
};

export const resetOrientation = () => {
  setVerticalFlip(false);
  setHorizontalFlip(false);
  setRotation(0);
};
