import { coordinateTransform } from '~/features/canvas/transform/UnifiedCoordinateTransform';
import { interactStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';
import { CanvasPos, WindowPos } from '~/types/CoordinateTypes';

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
 * 指定した範囲とインターバルに基づいてマークを生成
 */
function generateMarks(start: number, end: number, majorInterval: number, minorInterval: number, isHorizontal: boolean): RulerMark[] {
  const marks: RulerMark[] = [];

  // マイナーマークから開始位置を決定
  const startMinor = Math.floor(start / minorInterval) * minorInterval;
  const endMinor = Math.ceil(end / minorInterval) * minorInterval;

  for (let canvasPos = startMinor; canvasPos <= endMinor; canvasPos += minorInterval) {
    const isMajor = canvasPos % majorInterval === 0;

    // キャンバス座標から画面座標への変換（sections-between-area相対）
    let windowPos: number;
    if (isHorizontal) {
      const winPos = coordinateTransform.canvasToWindow(CanvasPos.create(canvasPos, 0));
      // sections-between-area要素の左上を基準とした相対座標に変換
      const sectionsBetweenAreaElement = document.getElementById('sections-between-area');
      const sectionsBetweenAreaRect = sectionsBetweenAreaElement?.getBoundingClientRect();
      windowPos = sectionsBetweenAreaRect ? winPos.x - sectionsBetweenAreaRect.left : winPos.x;
    } else {
      const winPos = coordinateTransform.canvasToWindow(CanvasPos.create(0, canvasPos));
      // sections-between-area要素の左上を基準とした相対座標に変換
      const sectionsBetweenAreaElement = document.getElementById('sections-between-area');
      const sectionsBetweenAreaRect = sectionsBetweenAreaElement?.getBoundingClientRect();
      windowPos = sectionsBetweenAreaRect ? winPos.y - sectionsBetweenAreaRect.top : winPos.y;
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
 * 現在の表示範囲に基づいてRulerに表示すべき座標情報を計算
 */
export function calculateRulerMarks(): RulerCalculationResult {
  const { zoom } = interactStore;
  const { width: canvasWidth, height: canvasHeight } = canvasStore.canvas;

  // sections-between-areaエリアのサイズを取得
  const sectionsBetweenAreaElement = document.getElementById('sections-between-area');
  const containerWidth = sectionsBetweenAreaElement?.clientWidth || 1000;
  const containerHeight = sectionsBetweenAreaElement?.clientHeight || 1000;

  // sections-between-area相対座標でビューポートの四隅をキャンバス座標に変換
  // sections-between-areaの左上(0,0)から右下まで
  const topLeft = coordinateTransform.windowToCanvas(
    WindowPos.create(sectionsBetweenAreaElement?.getBoundingClientRect().left || 0, sectionsBetweenAreaElement?.getBoundingClientRect().top || 0)
  );
  const topRight = coordinateTransform.windowToCanvas(
    WindowPos.create(
      (sectionsBetweenAreaElement?.getBoundingClientRect().left || 0) + containerWidth,
      sectionsBetweenAreaElement?.getBoundingClientRect().top || 0
    )
  );
  const bottomLeft = coordinateTransform.windowToCanvas(
    WindowPos.create(
      sectionsBetweenAreaElement?.getBoundingClientRect().left || 0,
      (sectionsBetweenAreaElement?.getBoundingClientRect().top || 0) + containerHeight
    )
  );
  const bottomRight = coordinateTransform.windowToCanvas(
    WindowPos.create(
      (sectionsBetweenAreaElement?.getBoundingClientRect().left || 0) + containerWidth,
      (sectionsBetweenAreaElement?.getBoundingClientRect().top || 0) + containerHeight
    )
  );

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
