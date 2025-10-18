import { Vec2 } from '@sledge/core';
import { interactStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';

/**
 * 変換関連ユーティリティ
 * 目的:
 *  - pan/zoom (外側のラッパーで行われる) と rotate/flip (orientation レイヤー) を分離し再利用しやすくする
 *  - オーバーレイを zoom の外に出す際に canvas 座標 <-> 画面座標 を安定して算出できるようにする
 *
 * CSS 構造 (現状):
 *  [pan+zoom wrapper] -> [orientation (rotate + flip around center)] -> [raster contents]
 *
 * fullMatrix = panZoomMatrix * rotationFlipMatrix
 * (右から左に適用: point に対して rotationFlip の後に panZoom)
 */

export interface CanvasTransformSet {
  panZoom: DOMMatrix;
  rotationFlip: DOMMatrix;
  full: DOMMatrix;
  inverseFull: DOMMatrix; // 画面 -> キャンバス（回転/flip/zoom/pan 全部戻す）
  inversePanZoom: DOMMatrix;
  inverseRotationFlip: DOMMatrix;
}

/**
 * 現在の interactStore / canvasStore から行列群を構築する。
 * DOMMatrix が使用不可の環境 (SSR 等) では簡易フォールバックを返す。
 */
export function getCanvasTransforms(): CanvasTransformSet {
  const { zoom, offset, offsetOrigin, rotation, horizontalFlipped, verticalFlipped } = interactStore;
  const w = canvasStore.canvas.width;
  const h = canvasStore.canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  // DOMMatrix が無い環境へのフォールバック (極力避ける。テスト / SSR 安全策)
  const Matrix: typeof DOMMatrix | undefined = (globalThis as any).DOMMatrix ?? (globalThis as any).WebKitCSSMatrix;
  if (!Matrix) {
    // 簡易フォールバック: 変換を一切行わない恒等行列
    const identity = {
      transformPoint: (p: any) => p,
      inverse: () => identity,
      multiply: () => identity,
    } as unknown as DOMMatrix;
    return {
      panZoom: identity,
      rotationFlip: identity,
      full: identity,
      inverseFull: identity,
      inversePanZoom: identity,
      inverseRotationFlip: identity,
    };
  }

  // pan + zoom (左上原点基準)
  const panZoom = new Matrix().translate(offsetOrigin.x + offset.x, offsetOrigin.y + offset.y).scale(zoom);

  // rotate + flip (キャンバス中心基準) ※ CSS と同じ並び: translate -> rotate -> scale -> translate
  const sx = horizontalFlipped ? -1 : 1;
  const sy = verticalFlipped ? -1 : 1;
  const rotationFlip = new Matrix().translate(cx, cy).rotate(rotation).scale(sx, sy).translate(-cx, -cy);

  const full = panZoom.multiply(rotationFlip); // point には rotationFlip -> panZoom の順で作用
  const inverseFull = full.inverse();
  const inversePanZoom = panZoom.inverse();
  const inverseRotationFlip = rotationFlip.inverse();

  return { panZoom, rotationFlip, full, inverseFull, inversePanZoom, inverseRotationFlip };
}

/** 行列を Vec2 に適用して Vec2 を返す */
function applyMatrix(m: DOMMatrix, p: Vec2): Vec2 {
  const r = m.transformPoint(new DOMPoint(p.x, p.y));
  return { x: r.x, y: r.y };
}

/**
 * canvas 座標 (回転/flip前の論理座標) を画面座標へ変換。
 * zoom / pan / rotate / flip 全て含む。
 */
export function canvasToScreen(pos: Vec2): Vec2 {
  const { full } = getCanvasTransforms();
  return applyMatrix(full, pos);
}

/**
 * canvas 座標を "zoom を除外" して画面座標へ変換。
 * オーバーレイを zoom 外に配置する際に使用。
 * - rotate / flip は適用
 * - pan (平行移動) は適用 (キャンバスの表示位置は必要)
 * - zoom は適用しない (ピクセル等倍で表示したい UI 用)
 */
export function canvasToScreenNoZoom(pos: Vec2): Vec2 {
  // 通常: screen = panZoom * rotationFlip * pos = (offsetOrigin+offset) + (rotationFlip(pos)) * zoom
  // オーバーレイを zoom の外に配置するので DOM 要素自体は scale(zoom) されない。
  // その代わり位置だけ最終的な zoom を掛けた座標を返す。
  const { rotationFlip } = getCanvasTransforms();
  const rotated = applyMatrix(rotationFlip, pos);
  const { offset, offsetOrigin, zoom } = interactStore;
  return {
    x: offsetOrigin.x + offset.x + rotated.x * zoom,
    y: offsetOrigin.y + offset.y + rotated.y * zoom,
  };
}

/**
 * 画面座標をキャンバス論理座標へ変換。pan/zoom/rotate/flip 全て逆変換。
 */
export function screenToCanvas(screen: Vec2): Vec2 {
  const { inverseFull } = getCanvasTransforms();
  return applyMatrix(inverseFull, screen);
}

/**
 * 画面座標をキャンバス論理座標へ変換 (zoom 無しで canvasToScreenNoZoom の逆)。
 * 主にドラッグや hover 座標再計算で使用予定。
 */
export function screenToCanvasNoZoom(screen: Vec2): Vec2 {
  // canvasToScreenNoZoom の逆変換。
  // screen = (offsetOrigin+offset) + rotationFlip(pos) * zoom
  // rotationFlip(pos) = (screen - (offsetOrigin+offset)) / zoom
  // pos = inverseRotationFlip( ... )
  const { inverseRotationFlip } = getCanvasTransforms();
  const { offset, offsetOrigin, zoom } = interactStore;
  const local = {
    x: (screen.x - (offsetOrigin.x + offset.x)) / zoom,
    y: (screen.y - (offsetOrigin.y + offset.y)) / zoom,
  };
  return applyMatrix(inverseRotationFlip, local);
}

export function getRelativeCanvasAreaPosition(canvasPos: Vec2) {
  const offsetX = interactStore.offsetOrigin.x + interactStore.offset.x;
  const offsetY = interactStore.offsetOrigin.y + interactStore.offset.y;
  return {
    x: offsetX + canvasPos.x * interactStore.zoom,
    y: offsetY + canvasPos.y * interactStore.zoom,
  };
}

export function clientPositionToCanvasPosition(clientPos: Vec2): Vec2 {
  const canvasRef = document.getElementById('interact-canvas') as HTMLCanvasElement | undefined;
  if (!canvasRef) return { x: 0, y: 0 };
  // pointer 座標
  const clientX = clientPos.x;
  const clientY = clientPos.y;

  // 1. キャンバス中心 (画面座標)
  const rect = canvasRef.getBoundingClientRect();
  const cxScreen = rect.left + rect.width / 2;
  const cyScreen = rect.top + rect.height / 2;

  // 2. 画面中心からのベクトル（scale だけ戻す）
  const dx = (clientX - cxScreen) / interactStore.zoom;
  const dy = (clientY - cyScreen) / interactStore.zoom;

  // 3. 逆回転
  const t = (-interactStore.rotation * Math.PI) / 180; // ←逆向き
  const rx = dx * Math.cos(t) - dy * Math.sin(t);
  const ry = dx * Math.sin(t) + dy * Math.cos(t);

  let canvasPos = { x: rx + canvasStore.canvas.width / 2, y: ry + canvasStore.canvas.height / 2 };

  if (interactStore.horizontalFlipped) {
    canvasPos.x = canvasStore.canvas.width - canvasPos.x;
  }
  if (interactStore.verticalFlipped) {
    canvasPos.y = canvasStore.canvas.height - canvasPos.y;
  }

  // 4. キャンバス座標
  return {
    x: canvasPos.x,
    y: canvasPos.y,
  };
}

export function clientPositionToCanvasPositionWithoutRotation(clientPos: Vec2): Vec2 {
  const canvasRef = document.getElementById('interact-canvas') as HTMLCanvasElement | undefined;
  if (!canvasRef) return { x: 0, y: 0 };
  // pointer 座標
  const clientX = clientPos.x;
  const clientY = clientPos.y;

  // 1. キャンバス中心 (画面座標)
  const rect = canvasRef.getBoundingClientRect();
  const cxScreen = rect.left + rect.width / 2;
  const cyScreen = rect.top + rect.height / 2;

  // 2. 画面中心からのベクトル（scale だけ戻す）
  const dx = (clientX - cxScreen) / interactStore.zoom;
  const dy = (clientY - cyScreen) / interactStore.zoom;

  let canvasPos = { x: dx + canvasStore.canvas.width / 2, y: dy + canvasStore.canvas.height / 2 };

  if (interactStore.horizontalFlipped) {
    canvasPos.x = canvasStore.canvas.width - canvasPos.x;
  }
  if (interactStore.verticalFlipped) {
    canvasPos.y = canvasStore.canvas.height - canvasPos.y;
  }

  // 4. キャンバス座標
  return {
    x: canvasPos.x,
    y: canvasPos.y,
  };
}
