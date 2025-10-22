import { interactStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';

/**
 * Rulerの座標計算に関する型定義
 */
export interface RulerMark {
  /** 画面座標での位置 */
  position: number;
  /** キャンバス座標での位置 */
  canvasPosition: number;
  /** 表示するラベル（整数値など） */
  label: string;
  /** メジャーマークかマイナーマークか */
  isMajor: boolean;
}

export interface RulerCalculationResult {
  /** 水平方向のマーク */
  horizontalMarks: RulerMark[];
  /** 垂直方向のマーク */
  verticalMarks: RulerMark[];
  /** 表示開始位置（キャンバス座標） */
  startCanvasX: number;
  startCanvasY: number;
  /** 表示終了位置（キャンバス座標） */
  endCanvasX: number;
  endCanvasY: number;
}

/**
 * ズームレベルに基づいて適切なマーク間隔を決定
 */
function getMarkInterval(zoom: number): { majorInterval: number; minorInterval: number } {
  // ズームレベルに応じた間隔の調整
  if (zoom >= 24) {
    return { majorInterval: 5, minorInterval: 1 };
  } else if (zoom >= 8) {
    return { majorInterval: 10, minorInterval: 1 };
  } else if (zoom >= 4) {
    return { majorInterval: 20, minorInterval: 5 };
  } else if (zoom >= 2) {
    return { majorInterval: 50, minorInterval: 10 };
  } else if (zoom >= 1) {
    return { majorInterval: 100, minorInterval: 20 };
  } else if (zoom >= 0.5) {
    return { majorInterval: 200, minorInterval: 50 };
  } else if (zoom >= 0.25) {
    return { majorInterval: 500, minorInterval: 100 };
  } else {
    return { majorInterval: 1000, minorInterval: 200 };
  }
}

/**
 * 指定した範囲とインターバルに基づいてマークを生成（回転なし変換を使用）
 */
function generateMarks(start: number, end: number, majorInterval: number, minorInterval: number, isHorizontal: boolean): RulerMark[] {
  const marks: RulerMark[] = [];

  // マイナーマークから開始位置を決定
  const startMinor = Math.floor(start / minorInterval) * minorInterval;
  const endMinor = Math.ceil(end / minorInterval) * minorInterval;

  // 回転なし変換を取得
  const noRotationTransform = createNoRotationTransform();

  // 必要な要素を取得
  const canvasAreaElement = document.getElementById('canvas-area');
  const sectionsBetweenAreaElement = document.getElementById('sections-between-area');
  const canvasAreaRect = canvasAreaElement?.getBoundingClientRect();
  const sectionsBetweenAreaRect = sectionsBetweenAreaElement?.getBoundingClientRect();

  if (!canvasAreaRect || !sectionsBetweenAreaRect) {
    return marks;
  }

  for (let canvasPos = startMinor; canvasPos <= endMinor; canvasPos += minorInterval) {
    const isMajor = canvasPos % majorInterval === 0;

    // キャンバス座標から画面座標への変換（回転なし、sections-between-area相対）
    let windowPos: number;
    if (isHorizontal) {
      // キャンバス座標 → canvas-area相対座標（回転なし）
      const canvasAreaRelative = noRotationTransform.forward.transformPoint(new DOMPoint(canvasPos, 0));
      // canvas-area相対座標 → window座標
      const windowX = canvasAreaRect.left + canvasAreaRelative.x;
      // window座標 → sections-between-area相対座標
      windowPos = windowX - sectionsBetweenAreaRect.left;
    } else {
      // キャンバス座標 → canvas-area相対座標（回転なし）
      const canvasAreaRelative = noRotationTransform.forward.transformPoint(new DOMPoint(0, canvasPos));
      // canvas-area相対座標 → window座標
      const windowY = canvasAreaRect.top + canvasAreaRelative.y;
      // window座標 → sections-between-area相対座標
      windowPos = windowY - sectionsBetweenAreaRect.top;
    }

    marks.push({
      position: windowPos,
      canvasPosition: canvasPos,
      label: isMajor ? canvasPos.toString() : '',
      isMajor,
    });
  }

  return marks;
}

/**
 * 回転を無視した座標変換を行う（ルーラー専用）
 * パン・ズーム・反転は適用するが、回転は0°として扱う
 */
function createNoRotationTransform() {
  const { zoom, offset, offsetOrigin, horizontalFlipped, verticalFlipped } = interactStore;
  const { width, height } = canvasStore.canvas;

  const Matrix = globalThis.DOMMatrix ?? (globalThis as any).WebKitCSSMatrix;
  if (!Matrix) {
    return { forward: new DOMMatrix(), inverse: new DOMMatrix() };
  }

  const cx = width / 2;
  const cy = height / 2;
  const sx = horizontalFlipped ? -1 : 1;
  const sy = verticalFlipped ? -1 : 1;
  const totalOffsetX = offsetOrigin.x + offset.x;
  const totalOffsetY = offsetOrigin.y + offset.y;

  // 回転を0として変換行列を構築
  const matrix = new Matrix()
    .translate(totalOffsetX, totalOffsetY)
    .scale(zoom)
    .translate(cx, cy)
    .rotate(0) // 回転は常に0
    .scale(sx, sy)
    .translate(-cx, -cy);

  return {
    forward: matrix,
    inverse: matrix.inverse(),
  };
}

/**
 * 現在の表示範囲に基づいてRulerに表示すべき座標情報を計算
 * 回転時でも常に0°（水平・垂直）基準で表示する
 */
export function calculateRulerMarks(): RulerCalculationResult {
  const { zoom } = interactStore;
  const { width: canvasWidth, height: canvasHeight } = canvasStore.canvas;

  // sections-between-areaエリアのサイズを取得
  const sectionsBetweenAreaElement = document.getElementById('sections-between-area');
  const containerWidth = sectionsBetweenAreaElement?.clientWidth || 1000;
  const containerHeight = sectionsBetweenAreaElement?.clientHeight || 1000;

  // 回転を無視した座標変換を使用
  const noRotationTransform = createNoRotationTransform();

  // canvas-area要素の位置を取得
  const canvasAreaElement = document.getElementById('canvas-area');
  const canvasAreaRect = canvasAreaElement?.getBoundingClientRect();
  const sectionsBetweenAreaRect = sectionsBetweenAreaElement?.getBoundingClientRect();

  if (!canvasAreaRect || !sectionsBetweenAreaRect) {
    return {
      horizontalMarks: [],
      verticalMarks: [],
      startCanvasX: 0,
      startCanvasY: 0,
      endCanvasX: 0,
      endCanvasY: 0,
    };
  }

  // sections-between-area相対座標でビューポートの四隅を回転なしでキャンバス座標に変換
  const transformPoint = (x: number, y: number) => {
    // sections-between-area相対座標をwindow座標に変換
    const windowX = sectionsBetweenAreaRect.left + x;
    const windowY = sectionsBetweenAreaRect.top + y;

    // canvas-area相対座標に変換
    const canvasRelativeX = windowX - canvasAreaRect.left;
    const canvasRelativeY = windowY - canvasAreaRect.top;

    // 回転なしでキャンバス座標に変換
    const result = noRotationTransform.inverse.transformPoint(new DOMPoint(canvasRelativeX, canvasRelativeY));
    return { x: result.x, y: result.y };
  };

  const topLeft = transformPoint(0, 0);
  const topRight = transformPoint(containerWidth, 0);
  const bottomLeft = transformPoint(0, containerHeight);
  const bottomRight = transformPoint(containerWidth, containerHeight);

  // 表示範囲の最小・最大値を計算
  const startCanvasX = Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
  const endCanvasX = Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
  const startCanvasY = Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);
  const endCanvasY = Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);

  // 間隔を決定
  const { majorInterval, minorInterval } = getMarkInterval(zoom);

  // 水平・垂直方向のマークを生成
  const horizontalMarks = generateMarks(startCanvasX, endCanvasX, majorInterval, minorInterval, true);
  const verticalMarks = generateMarks(startCanvasY, endCanvasY, majorInterval, minorInterval, false);

  return {
    horizontalMarks,
    verticalMarks,
    startCanvasX,
    startCanvasY,
    endCanvasX,
    endCanvasY,
  };
}

/**
 * 特定のキャンバス座標が現在の表示範囲内にあるかチェック
 */
export function isInViewport(canvasX: number, canvasY: number): boolean {
  const result = calculateRulerMarks();
  return canvasX >= result.startCanvasX && canvasX <= result.endCanvasX && canvasY >= result.startCanvasY && canvasY <= result.endCanvasY;
}
