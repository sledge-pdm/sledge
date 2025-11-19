import { Vec2 } from '@sledge/core';
import { logSystemWarn } from '~/features/log/service';
import { CanvasPos, WindowPos } from '~/types/CoordinateTypes';
import { coordinateTransform } from './UnifiedCoordinateTransform';

// coordinateTransformをre-export
export { coordinateTransform };

/**
 * 統一された座標変換システムを使用した実装
 * getBoundingClientRectの呼び出しを削減
 */
export function clientPositionToCanvasPosition(clientPos: Vec2): Vec2 {
  return coordinateTransform.windowToCanvasVec2(clientPos);
}

/**
 * オーバーレイ用の座標変換（ページ絶対座標で処理）
 * 選択範囲メニューなどのオーバーレイ要素で使用
 */
export function canvasToScreenForOverlay(pos: Vec2): Vec2 {
  const windowPos = coordinateTransform.canvasToWindowForOverlay(CanvasPos.from(pos));
  return WindowPos.toVec2(windowPos);
}

export function screenToCanvasForOverlay(pos: Vec2): Vec2 {
  const canvasPos = coordinateTransform.windowToCanvasForOverlay(WindowPos.from(pos));
  return CanvasPos.toVec2(canvasPos);
}

/**
 * 回転を除外した座標変換（後方互換性のため）
 */
export function clientPositionToCanvasPositionWithoutRotation(clientPos: Vec2): Vec2 {
  // 新しいシステムでは回転を個別に除外する機能は提供しない
  // 必要に応じて別途実装
  logSystemWarn('clientPositionToCanvasPositionWithoutRotation is deprecated and may not work correctly with new coordinate system', {
    label: 'CanvasPositionCalculator',
    debugOnly: true,
  });
  return coordinateTransform.windowToCanvasVec2(clientPos);
}

/**
 * イベントからウィンドウ座標を取得
 */
export function getWindowMousePosition(e: MouseEvent | PointerEvent | TouchEvent) {
  let x = 0;
  let y = 0;

  if ('clientX' in e && 'clientY' in e) {
    x = e.clientX;
    y = e.clientY;
  } else if ('touches' in e && e.touches.length > 0) {
    x = e.touches[0].clientX;
    y = e.touches[0].clientY;
  }
  return { x, y };
}

/**
 * イベントからキャンバス座標を取得
 */
export function getCanvasMousePosition(e: MouseEvent | PointerEvent | TouchEvent) {
  const windowPos = getWindowPosFromEvent(e);
  const canvasPos = coordinateTransform.windowToCanvas(windowPos);
  return CanvasPos.toVec2(canvasPos);
}

// 新しい型安全な関数群（推奨）

/**
 * イベントからWindowPosを取得
 */
export function getWindowPosFromEvent(e: MouseEvent | PointerEvent | TouchEvent): WindowPos {
  const pos = getWindowMousePosition(e);
  return WindowPos.from(pos);
}

/**
 * イベントからCanvasPosを取得
 */
export function getCanvasPosFromEvent(e: MouseEvent | PointerEvent | TouchEvent): CanvasPos {
  const windowPos = getWindowPosFromEvent(e);
  return coordinateTransform.windowToCanvas(windowPos);
}

// 変換行列のキャッシュ管理

/**
 * 座標変換のキャッシュをクリア
 * 大きな状態変更時に呼び出す
 */
export function clearCoordinateCache(): void {
  coordinateTransform.clearCache();
}

/**
 * デバッグ用: 現在の変換行列を取得
 */
export function getDebugTransformInfo() {
  const matrix = coordinateTransform.getTransformMatrix();
  const inverse = coordinateTransform.getInverseMatrix();

  // canvas-area要素の情報も取得
  const canvasAreaElement = document.getElementById('canvas-area');
  const canvasAreaRect = canvasAreaElement ? canvasAreaElement.getBoundingClientRect() : null;

  const testCanvasPos = CanvasPos.create(100, 100);

  return {
    matrix: matrix.toString(),
    inverse: inverse.toString(),
    // テスト座標での変換結果
    testCanvasPos,
    testWindowPos: coordinateTransform.canvasToWindow(testCanvasPos),
    testWindowPosOverlay: coordinateTransform.canvasToWindowForOverlay(testCanvasPos),
    canvasAreaRect: canvasAreaRect
      ? {
          left: canvasAreaRect.left,
          top: canvasAreaRect.top,
          width: canvasAreaRect.width,
          height: canvasAreaRect.height,
        }
      : null,
  };
}
